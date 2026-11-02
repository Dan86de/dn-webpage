#!/usr/bin/env node
// The verify skill's helper: starts a throwaway copy of the site, keeps a
// browser page alive between commands, and logs every call to the run folder.
// See ../SKILL.md for the commands. It never touches the working tree, the real
// Redis store, Kit, or anything else outside the run folder.
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  appendFileSync,
  constants,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), "../../../..");
const SCRATCH = join(ROOT, ".scratch/verify");
const READY_TIMEOUT_MS = 60_000;
const SEE_TIMEOUT_MS = 15_000;

// Not part of what the site builds from: changing these leaves a run current.
const NOT_THE_PRODUCT =
  /^(\.agents|\.claude|docs)\/|^(AGENTS|CLAUDE|README)\.md$/;

// What `run` may execute, always inside the run's copy of the site.
const ALLOWED_RUN = [
  /^pnpm (habit|weight|bet|post|post:new|test|build)( |$)/,
  /^pnpm astro check$/,
];

const VERDICTS = ["pass", "fail", "manual", "not driven"];

class Refused extends Error {}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function git(...args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" }).stdout.trim();
}

function productFiles() {
  return git("ls-files", "-co", "--exclude-standard")
    .split("\n")
    .filter((file) => file && !NOT_THE_PRODUCT.test(file))
    .filter((file) => existsSync(join(ROOT, file)))
    .sort();
}

/** A hash of the site's sources as they are on disk right now, dirty or not. */
function fingerprint() {
  const hash = createHash("sha256");
  for (const file of productFiles()) {
    hash.update(file);
    const path = join(ROOT, file);
    if (lstatSync(path).isFile()) hash.update(readFileSync(path));
  }
  return hash.digest("hex");
}

// The server and the CLIs get this and nothing else from the user's shell. The
// empty store variables win over any .env file, which keeps redis.ts on its
// in-memory fallback even if `vercel env pull` has been run.
function cleanEnv(runDir) {
  return {
    PATH: process.env.PATH,
    LANG: "en_US.UTF-8",
    HOME: join(runDir, "home"),
    TMPDIR: join(runDir, "tmp"),
    ASTRO_TELEMETRY_DISABLED: "1",
    KV_REST_API_URL: "",
    KV_REST_API_TOKEN: "",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
  };
}

const statePath = (runDir) => join(runDir, "state.json");
const readState = (runDir) =>
  JSON.parse(readFileSync(statePath(runDir), "utf8"));
const writeState = (runDir, state) =>
  writeFileSync(statePath(runDir), JSON.stringify(state, null, 2) + "\n");

function alive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function freePort() {
  return new Promise((done, fail) => {
    const probe = createNetServer();
    probe.on("error", fail);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });
}

function listRuns() {
  if (!existsSync(SCRATCH)) return [];
  return readdirSync(SCRATCH)
    .filter((name) => existsSync(statePath(join(SCRATCH, name))))
    .sort();
}

/** The run named by --run, or the only live one. Never a guess between several. */
function resolveRun(named) {
  if (named) {
    const runDir = join(SCRATCH, named);
    if (!existsSync(statePath(runDir)))
      throw new Refused(`no run called ${named}`);
    return runDir;
  }
  const live = listRuns().filter((name) =>
    alive(readState(join(SCRATCH, name)).serverPid),
  );
  if (live.length === 1) return join(SCRATCH, live[0]);
  if (live.length === 0) {
    throw new Refused(
      "no live run: start one, or name a stopped one with --run <run>",
    );
  }
  throw new Refused(`several live runs (${live.join(", ")}): pass --run <run>`);
}

function log(runDir, argv, output, code) {
  const stamp = new Date().toISOString();
  appendFileSync(
    join(runDir, "transcript.log"),
    `--- ${stamp} $ drive ${argv.join(" ")} (exit ${code})\n${output}${output.endsWith("\n") || !output ? "" : "\n"}`,
  );
}

// ---------------------------------------------------------------- lifecycle

function copySite(runDir) {
  const site = join(runDir, "site");
  for (const file of productFiles()) {
    const target = join(site, file);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(ROOT, file), target, {
      verbatimSymlinks: true,
      mode: constants.COPYFILE_FICLONE,
    });
  }
  // A real copy, not a symlink: Vite refuses to serve files from outside its
  // root, and the run must not share its dependency cache with a user's server.
  const clone =
    process.platform === "darwin" ? ["-cR"] : ["-R", "--reflink=auto"];
  const copied = spawnSync("cp", [...clone, join(ROOT, "node_modules"), site], {
    encoding: "utf8",
  });
  if (copied.status !== 0)
    throw new Error(`could not copy node_modules: ${copied.stderr}`);
  return site;
}

function startServer(runDir, port) {
  const server = openSync(join(runDir, "server.log"), "a");
  const child = spawn(
    process.execPath,
    [
      "node_modules/astro/bin/astro.mjs",
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: join(runDir, "site"),
      env: cleanEnv(runDir),
      detached: true,
      stdio: ["ignore", server, server],
    },
  );
  child.unref();
  return child.pid;
}

async function waitForUrl(url, ok, timeoutMs = READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (ok(response)) return true;
    } catch {
      // Not listening yet.
    }
    await sleep(250);
  }
  return false;
}

/** Installs the browser if it is missing (a no-op otherwise); returns where it lives. */
async function browsersPath() {
  const install = spawnSync(
    process.execPath,
    [
      join(ROOT, "node_modules/playwright-core/cli.js"),
      "install",
      "chromium-headless-shell",
    ],
    { encoding: "utf8" },
  );
  if (install.status !== 0)
    throw new Error(`browser install failed:\n${install.stderr}`);
  const { chromium } = await import("playwright-core");
  return chromium.executablePath().split(/\/chromium-\d+\//)[0];
}

async function start() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15);
  const run = `${stamp}-${randomBytes(3).toString("hex")}`;
  const runDir = join(SCRATCH, run);
  mkdirSync(join(runDir, "home"), { recursive: true });
  mkdirSync(join(runDir, "tmp"), { recursive: true });
  mkdirSync(join(runDir, "shots"), { recursive: true });

  copySite(runDir);
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const state = {
    run,
    url,
    port,
    commit: git("rev-parse", "HEAD"),
    branch: git("branch", "--show-current"),
    dirty: git("status", "--short"),
    fingerprint: fingerprint(),
    browsersPath: await browsersPath(),
    serverPid: startServer(runDir, port),
    driverPid: null,
    driverPort: null,
  };
  writeState(runDir, state);

  if (!(await waitForUrl(`${url}/api/smash`, (response) => response.ok))) {
    throw new Error(
      `the server did not answer within ${READY_TIMEOUT_MS / 1000}s, see ${join(runDir, "server.log")}`,
    );
  }

  const driverLog = openSync(join(runDir, "driver.log"), "a");
  const driver = spawn(process.execPath, [SELF, "__daemon", runDir], {
    cwd: ROOT,
    env: { ...cleanEnv(runDir), PLAYWRIGHT_BROWSERS_PATH: state.browsersPath },
    detached: true,
    stdio: ["ignore", driverLog, driverLog],
  });
  driver.unref();
  state.driverPid = driver.pid;
  writeState(runDir, state);

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (!readState(runDir).driverPort) {
    if (Date.now() > deadline || !alive(driver.pid)) {
      throw new Error(
        `the browser did not start, see ${join(runDir, "driver.log")}`,
      );
    }
    await sleep(100);
  }

  writeEvidence(runDir);
  return {
    runDir,
    output: `run: ${run}\nfolder: ${relative(ROOT, runDir)}\nurl: ${url}\nready: the server answered and the browser is up\n`,
  };
}

/** Each line is `ok ...` or `UNFIT ...`. Read-only. */
async function doctor(runDir) {
  const state = readState(runDir);
  const lines = [];
  const report = (ok, text) => lines.push(`${ok ? "ok   " : "UNFIT"} ${text}`);

  const serverUp = alive(state.serverPid);
  report(
    serverUp,
    `server pid ${state.serverPid} ${serverUp ? "is running" : "is not running"}`,
  );

  const listeners = spawnSync(
    "lsof",
    ["-nP", `-iTCP:${state.port}`, "-sTCP:LISTEN", "-t"],
    {
      encoding: "utf8",
    },
  ).stdout;
  const owns = listeners.split("\n").includes(String(state.serverPid));
  report(
    owns,
    `${state.url} ${owns ? "belongs to this run's server" : "is not served by this run"}`,
  );

  let answers = false;
  if (owns) {
    try {
      const response = await fetch(`${state.url}/api/smash`);
      answers = response.ok;
      report(
        answers,
        `GET /api/smash -> ${response.status} ${await response.text()}`,
      );
    } catch (error) {
      report(false, `GET /api/smash failed: ${error.message}`);
    }
  }

  if (serverUp) {
    const env = spawnSync(
      "ps",
      ["eww", "-o", "command=", "-p", String(state.serverPid)],
      {
        encoding: "utf8",
      },
    ).stdout;
    const realStore = /(KV_REST_API_URL|UPSTASH_REDIS_REST_URL)=\S/.test(env);
    report(
      !realStore,
      realStore
        ? "the server has a real store URL in its env"
        : "the server has no store URL: in-memory store",
    );
  }

  const driverUp = alive(state.driverPid);
  report(
    driverUp,
    `browser driver pid ${state.driverPid} ${driverUp ? "is running" : "is not running"}`,
  );
  if (driverUp && state.driverPort) {
    const where = await callDriver(state, "where", []).catch(
      (error) => `failed: ${error.message}`,
    );
    lines.push(`     page: ${where}`);
  }

  const current = fingerprint() === state.fingerprint;
  report(
    current,
    current
      ? "the build matches the working tree"
      : "the working tree changed since this run started: start a new run",
  );

  lines.push(
    "     sign-in: the site has no accounts; a bettor is a cookie in the run's browser",
  );
  lines.push(
    `     commit ${state.commit.slice(0, 7)} on ${state.branch}, tree ${state.dirty ? "dirty" : "clean"} at start`,
  );

  const fit = lines.every((line) => !line.startsWith("UNFIT"));
  lines.push(fit ? "FIT" : "UNFIT");
  return { fit, output: lines.join("\n") + "\n" };
}

async function stop(runDir) {
  const state = readState(runDir);
  if (state.driverPort && alive(state.driverPid)) {
    await callDriver(state, "__quit", []).catch(() => {});
  }
  const lines = [];
  for (const [name, pid] of [
    ["browser driver", state.driverPid],
    ["server", state.serverPid],
  ]) {
    if (!alive(pid)) {
      lines.push(`${name} pid ${pid} was not running`);
      continue;
    }
    // Detached, so the pid is also the group: this takes esbuild and chromium.
    process.kill(-pid, "SIGTERM");
    for (let i = 0; i < 40 && alive(pid); i++) await sleep(100);
    if (alive(pid)) process.kill(-pid, "SIGKILL");
    lines.push(`stopped ${name} pid ${pid}`);
  }
  await sleep(200);
  // The rest of the run folder stays as the record; this is only a cache.
  rmSync(join(runDir, "site/node_modules"), { recursive: true, force: true });
  const after = await doctor(runDir);
  lines.push(
    after.fit
      ? "doctor says FIT: something is still running"
      : "doctor says UNFIT: nothing of this run is left running",
  );
  writeEvidence(runDir);
  lines.push(`evidence: ${relative(ROOT, join(runDir, "evidence.md"))}`);
  return { fit: after.fit, output: lines.join("\n") + "\n" };
}

/** The dev server only sees a brand-new post folder after this. Wipes the in-memory store. */
async function restart(runDir) {
  const state = readState(runDir);
  if (!alive(state.serverPid)) throw new Refused("this run is stopped");
  process.kill(-state.serverPid, "SIGTERM");
  for (let i = 0; i < 40 && alive(state.serverPid); i++) await sleep(100);
  writeState(runDir, { ...state, serverPid: startServer(runDir, state.port) });
  if (
    !(await waitForUrl(`${state.url}/api/smash`, (response) => response.ok))
  ) {
    throw new Error("the server did not come back, see server.log");
  }
  return `restarted: server pid ${readState(runDir).serverPid}, the in-memory store is empty again\n`;
}

// ----------------------------------------------------------------- evidence

const checksPath = (runDir) => join(runDir, "checks.json");
const readChecks = (runDir) =>
  existsSync(checksPath(runDir))
    ? JSON.parse(readFileSync(checksPath(runDir), "utf8"))
    : [];

function verdictLine(checks) {
  const named = (verdict) =>
    checks
      .filter((check) => check.verdict === verdict)
      .map((check) => check.heading);
  if (checks.length === 0) return "**Not run**: no checks recorded";
  const failed = named("fail");
  if (failed.length) return `**Not done**: ${failed.join("; ")}`;
  const manual = named("manual");
  if (manual.length)
    return `**Done once the map changes in this PR**: ${manual.join("; ")}`;
  const notDriven = named("not driven");
  if (notDriven.length)
    return `**Done, with ${notDriven.length} not driven**: ${notDriven.join("; ")}`;
  return "**Done**";
}

function writeEvidence(runDir) {
  const state = readState(runDir);
  const checks = readChecks(runDir);
  const header = [
    `# Verify run ${state.run}`,
    "",
    `- Commit: ${state.commit}`,
    `- Branch: ${state.branch}`,
    `- Tree: ${state.dirty ? "dirty" : "clean"}`,
    ...(state.dirty ? ["", "~~~~", state.dirty, "~~~~"] : []),
    "",
    `Verdict: ${verdictLine(checks)}`,
    "",
  ];
  const sections = checks.flatMap((check) => [
    `## ${check.heading}`,
    "",
    `Verdict: **${check.verdict}**`,
    "",
    `Note: ${check.note || "-"}`,
    "",
    `Captured: ${check.captured.length ? check.captured.join(", ") : "command output below"}`,
    "",
    "~~~~",
    check.commands.trimEnd(),
    "~~~~",
    "",
  ]);
  writeFileSync(
    join(runDir, "evidence.md"),
    [...header, ...sections].join("\n"),
  );
}

function recordCheck(runDir, [heading, verdict, note = ""]) {
  if (!heading || !VERDICTS.includes(verdict)) {
    throw new Refused(
      `usage: check "<heading>" <${VERDICTS.join("|")}> "<note>"`,
    );
  }
  if (verdict !== "pass" && !note)
    throw new Refused(`a ${verdict} check needs a note`);
  const state = readState(runDir);
  if (fingerprint() !== state.fingerprint) {
    throw new Refused(
      "the working tree changed since this run started: its evidence is stale, start a new run",
    );
  }
  const checks = readChecks(runDir);
  if (checks.some((check) => check.heading === heading)) {
    throw new Refused(
      `"${heading}" is already recorded: a re-check belongs in a new run`,
    );
  }

  const transcript = readFileSync(join(runDir, "transcript.log"), "utf8");
  const from = checks.at(-1)?.transcriptEnd ?? 0;
  const commands = transcript.slice(from);
  if (verdict !== "not driven" && !commands.trim()) {
    throw new Refused(
      "no command has run since the last check: drive it first",
    );
  }
  const captured = [...commands.matchAll(/^saved (shots\/\S+)$/gm)].map(
    (match) => match[1],
  );
  checks.push({
    heading,
    verdict,
    note,
    captured,
    commands,
    transcriptEnd: transcript.length,
  });
  writeFileSync(checksPath(runDir), JSON.stringify(checks, null, 2) + "\n");
  writeEvidence(runDir);
  return `recorded: ${heading}: ${verdict}\nverdict so far: ${verdictLine(checks)}\n`;
}

// ------------------------------------------------- commands without a browser

async function waitForServerQuiet(runDir) {
  const size = () => statSync(join(runDir, "server.log")).size;
  let last = size();
  for (let quiet = 0; quiet < 8; quiet++) {
    await sleep(250);
    if (size() !== last) {
      last = size();
      quiet = -1;
    }
  }
}

async function runCommand(runDir, args) {
  const command = args.join(" ");
  if (!ALLOWED_RUN.some((allowed) => allowed.test(command))) {
    throw new Refused(
      `"${command}" is not something a run may execute. See "Out of reach" in the skill.`,
    );
  }
  const result = spawnSync(args[0], args.slice(1), {
    cwd: join(runDir, "site"),
    env: cleanEnv(runDir),
    encoding: "utf8",
    timeout: 300_000,
  });
  // A CLI that writes content sets off a dev server reload: let it land, so it
  // cannot interrupt the next step.
  await waitForServerQuiet(runDir);
  return {
    code: result.status ?? 1,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function grepped(text, pattern) {
  if (!pattern) return text;
  const regex = new RegExp(pattern);
  return (
    text
      .split("\n")
      .filter((line) => regex.test(line))
      .join("\n") + "\n"
  );
}

function readFromSite(runDir, args) {
  const [path, flag, pattern] = args;
  if (!path)
    throw new Refused("usage: read <path in the run's site> [--grep <regex>]");
  const target = siteFile(runDir, path);
  if (!existsSync(target))
    return { code: 1, output: `no such file: ${path}\n` };
  if (statSync(target).isDirectory()) {
    return { code: 0, output: readdirSync(target).join("\n") + "\n" };
  }
  return {
    code: 0,
    output: grepped(
      readFileSync(target, "utf8"),
      flag === "--grep" ? pattern : null,
    ),
  };
}

function siteFile(runDir, path) {
  const site = join(runDir, "site");
  const target = resolve(site, path);
  if (
    relative(site, target).startsWith("..") ||
    relative(site, target).startsWith("node_modules")
  ) {
    throw new Refused(`${path} is outside the run's copy of the site`);
  }
  return target;
}

/** What a person does in their editor, on the run's copy. */
function writeToSite(runDir, [path, content]) {
  if (!path || content === undefined)
    throw new Refused("usage: write <path> <content>");
  const target = siteFile(runDir, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
  return `wrote ${path}\n`;
}

function editInSite(runDir, [path, from, to]) {
  if (!path || from === undefined || to === undefined)
    throw new Refused("usage: edit <path> <old> <new>");
  const target = siteFile(runDir, path);
  const text = readFileSync(target, "utf8");
  if (!text.includes(from)) throw new Refused(`"${from}" is not in ${path}`);
  writeFileSync(target, text.replace(from, to));
  return `edited ${path}\n`;
}

function serverLog(runDir, [flag, pattern]) {
  return grepped(
    readFileSync(join(runDir, "server.log"), "utf8"),
    flag === "--grep" ? pattern : null,
  );
}

// ------------------------------------------------------------ browser driver

async function callDriver(state, name, args) {
  const response = await fetch(`http://127.0.0.1:${state.driverPort}/`, {
    method: "POST",
    body: JSON.stringify({ name, args }),
  });
  const { ok, output } = await response.json();
  if (!ok) throw new Error(output);
  return output;
}

/** Runs detached for the life of the run: it is what keeps the page alive. */
async function daemon(runDir) {
  const { chromium } = await import("playwright-core");
  const state = readState(runDir);
  const browser = await chromium.launch({ headless: true });
  const visitors = new Map();
  const external = new Map();
  const api = [];
  const consoleErrors = [];
  let current = "default";

  async function visitor(name) {
    if (visitors.has(name)) return visitors.get(name);
    // The server tells visitors apart by user agent, and the cookie is per
    // context, so each named visitor is a separate person to the site.
    const context = await browser.newContext({
      userAgent: `Mozilla/5.0 dn-verify/${name}`,
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
    });
    await context.route("**/*", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === state.url || !url.protocol.startsWith("http"))
        return route.continue();
      const line = `${request.method()} ${request.url()}${request.postData() ? ` body: ${request.postData()}` : ""}`;
      external.set(line, (external.get(line) ?? 0) + 1);
      return route.abort("blockedbyclient");
    });
    context.on("response", async (response) => {
      const request = response.request();
      const url = new URL(request.url());
      if (url.origin !== state.url || !url.pathname.startsWith("/api/")) return;
      api.push(
        `[${name}] ${request.method()} ${url.pathname}${url.search} -> ${response.status()}${request.postData() ? ` body: ${request.postData()}` : ""}`,
      );
    });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      // A request this driver blocked is reported by `requests`, not here.
      if (!message.location().url.startsWith(state.url)) return;
      consoleErrors.push(`[${name}] ${message.text()}`);
    });
    page.on("pageerror", (error) =>
      consoleErrors.push(`[${name}] ${error.message}`),
    );
    const entry = { context, page };
    visitors.set(name, entry);
    return entry;
  }

  const page = async () => (await visitor(current)).page;

  // client:load islands hydrate after the load event; a click before that is lost.
  async function settle(target) {
    const hydrated = await target
      .waitForFunction(
        () => !document.querySelector('astro-island[client="load"][ssr]'),
        null,
        { timeout: 20_000 },
      )
      .then(
        () => true,
        () => false,
      );
    return hydrated
      ? ""
      : "\nWARNING: an island did not hydrate, see `console`";
  }

  /** Scroll to it (client:visible islands hydrate on scroll), and wait for its island. */
  async function reach(locator) {
    await locator
      .first()
      .waitFor({ state: "attached", timeout: SEE_TIMEOUT_MS });
    await locator.first().scrollIntoViewIfNeeded();
    await locator.first().evaluate(
      (element) =>
        new Promise((done) => {
          const started = Date.now();
          const poll = () =>
            !element.closest("astro-island[ssr]") ||
            Date.now() - started > 10_000
              ? done()
              : setTimeout(poll, 50);
          poll();
        }),
    );
  }

  const role = async (name, label, exact) =>
    (await page()).getByRole(name, label ? { name: label, exact } : {});

  function flag(args, name) {
    const at = args.indexOf(name);
    if (at === -1) return { rest: args, value: null };
    return {
      rest: args.filter((_, i) => i !== at && i !== at + 1),
      value: args[at + 1],
    };
  }

  const sameOriginPath = (path) => {
    if (!path || !path.startsWith("/")) {
      throw new Refused(`refused: ${path} is not a path on this run's server`);
    }
    return path;
  };

  const commands = {
    where: async () => {
      const current_page = await page();
      return `visitor ${current}, ${current_page.url()}`;
    },
    visitor: async ([name]) => {
      if (!name) throw new Refused("usage: visitor <name>");
      current = name;
      await visitor(name);
      return `now visiting as ${name}`;
    },
    goto: async ([path]) => {
      const target = await page();
      const url = `${state.url}${sameOriginPath(path)}`;
      // A dev server reload landing mid-navigation leaves no response: go again.
      const response =
        (await target.goto(url, { waitUntil: "load" })) ??
        (await target.goto(url, { waitUntil: "load" }));
      const warning = await settle(target);
      return `${response?.status()} ${target.url()}\ntitle: ${await target.title()}${warning}`;
    },
    reload: async () => {
      const target = await page();
      const response = await target.reload({ waitUntil: "load" });
      const warning = await settle(target);
      return `${response.status()} ${target.url()}${warning}`;
    },
    click: async (args) => {
      const times = flag(args, "--times");
      const exact = times.rest.includes("--exact");
      const [name, label] = times.rest.filter((arg) => arg !== "--exact");
      const locator = await role(name, label, exact);
      await reach(locator);
      for (let i = 0; i < Number(times.value ?? 1); i++) {
        await locator.click({ timeout: SEE_TIMEOUT_MS });
      }
      return `clicked ${name} "${label}"${times.value ? ` ${times.value} times` : ""}`;
    },
    hover: async ([name, label]) => {
      const locator = await role(name, label);
      await reach(locator);
      await locator.hover({ timeout: SEE_TIMEOUT_MS });
      return `hovering ${name} "${label}"`;
    },
    fill: async ([label, value]) => {
      const locator = (await page()).getByLabel(label);
      await reach(locator);
      await locator.fill(value, { timeout: SEE_TIMEOUT_MS });
      return `filled "${label}"`;
    },
    press: async ([key]) => {
      await (await page()).keyboard.press(key);
      return `pressed ${key}`;
    },
    wait: async ([name, label]) => {
      const locator = await role(name, label);
      await reach(locator);
      await locator
        .first()
        .waitFor({ state: "visible", timeout: SEE_TIMEOUT_MS });
      return `visible: ${name} "${label}"`;
    },
    see: async ([text]) => {
      const locator = (await page()).getByText(text).filter({ visible: true });
      await reach(locator);
      await locator
        .first()
        .waitFor({ state: "visible", timeout: SEE_TIMEOUT_MS });
      return `seen: ${(await locator.first().innerText()).trim()}`;
    },
    absent: async ([text]) => {
      const count = await (
        await page()
      )
        .getByText(text)
        .filter({ visible: true })
        .count();
      if (count > 0)
        throw new Error(`"${text}" is on the page ${count} time(s)`);
      return `absent: ${text}`;
    },
    text: async ([name, label]) => {
      const target = await page();
      const locator = name ? await role(name, label) : target.locator("body");
      await reach(locator);
      return (await locator.first().innerText()).trim();
    },
    snapshot: async ([name, label]) => {
      const target = await page();
      const locator = name ? await role(name, label) : target.locator("body");
      await reach(locator);
      return locator.first().ariaSnapshot();
    },
    shot: async (args) => {
      const full = args.includes("--full");
      const [name] = args.filter((arg) => arg !== "--full");
      if (!/^[\w-]+$/.test(name ?? ""))
        throw new Refused("usage: shot <name> [--full]");
      await (
        await page()
      ).screenshot({
        path: join(runDir, "shots", `${name}.png`),
        fullPage: full,
      });
      return `saved shots/${name}.png`;
    },
    viewport: async ([width, height]) => {
      await (
        await page()
      ).setViewportSize({ width: Number(width), height: Number(height) });
      return `viewport ${width}x${height}`;
    },
    fetch: async (args) => {
      const { rest, value: pattern } = flag(args, "--grep");
      const [method, path, body] = rest;
      const { context } = await visitor(current);
      const response = await context.request.fetch(
        `${state.url}${sameOriginPath(path)}`,
        {
          method,
          ...(body
            ? {
                data: JSON.parse(body),
                headers: { "content-type": "application/json" },
              }
            : {}),
          maxRedirects: 0,
        },
      );
      const type = response.headers()["content-type"] ?? "";
      const location = response.headers().location;
      const summary = `${response.status()} ${type}${location ? ` -> ${location}` : ""}`;
      if (/json|text|xml/.test(type))
        return `${summary}\n${grepped(await response.text(), pattern)}`;
      return `${summary}\n${(await response.body()).length} bytes`;
    },
    "await-api": async ([method, path]) => {
      const wanted = `${method} ${path}`;
      const deadline = Date.now() + SEE_TIMEOUT_MS;
      const seen = api.length;
      while (Date.now() < deadline) {
        const match = api.slice(seen).find((line) => line.includes(wanted));
        if (match) return match;
        await sleep(100);
      }
      throw new Error(`no ${wanted} since this command started`);
    },
    requests: async () =>
      `api calls:\n${api.join("\n") || "(none)"}\nblocked external:\n${[...external].map(([line, count]) => `${count}x ${line}`).join("\n") || "(none)"}`,
    console: async () => consoleErrors.join("\n") || "(no console errors)",
    __quit: async () => {
      setTimeout(() => browser.close().finally(() => process.exit(0)), 10);
      return "quitting";
    },
  };

  const server = createServer((request, response) => {
    let raw = "";
    request.on("data", (chunk) => (raw += chunk));
    request.on("end", async () => {
      const { name, args } = JSON.parse(raw);
      try {
        const output = await commands[name](args);
        response.end(JSON.stringify({ ok: true, output }));
      } catch (error) {
        response.end(JSON.stringify({ ok: false, output: error.message }));
      }
    });
  });
  server.listen(0, "127.0.0.1", () => {
    writeState(runDir, {
      ...readState(runDir),
      driverPort: server.address().port,
    });
  });
}

// ---------------------------------------------------------------------- main

const BROWSER_COMMANDS = new Set([
  "where",
  "visitor",
  "goto",
  "reload",
  "click",
  "hover",
  "fill",
  "press",
  "wait",
  "see",
  "absent",
  "text",
  "snapshot",
  "shot",
  "viewport",
  "fetch",
  "await-api",
  "requests",
  "console",
]);

// Reading the output through `head` must not turn into a crash: it is logged.
process.stdout.on("error", (error) => {
  if (error.code !== "EPIPE") throw error;
});

async function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === "__daemon") return daemon(argv[1]);

  let named = null;
  if (argv[0] === "--run") {
    named = argv[1];
    argv.splice(0, 2);
  }
  const [command, ...args] = argv;

  if (command === "start") {
    const { runDir, output } = await start();
    log(runDir, argv, output, 0);
    process.stdout.write(output);
    return;
  }

  const runDir = resolveRun(named);
  let code = 0;
  let output;
  try {
    if (command === "doctor") {
      const result = await doctor(runDir);
      output = result.output;
      code = result.fit ? 0 : 1;
    } else if (command === "stop") {
      const result = await stop(runDir);
      output = result.output;
      code = result.fit ? 1 : 0;
    } else if (command === "restart") {
      output = await restart(runDir);
    } else if (command === "check") {
      output = recordCheck(runDir, args);
      process.stdout.write(output);
      return; // Not logged: the check closes the section the transcript fills.
    } else if (command === "run") {
      ({ code, output } = await runCommand(runDir, args));
    } else if (command === "read") {
      ({ code, output } = readFromSite(runDir, args));
    } else if (command === "write") {
      output = writeToSite(runDir, args);
    } else if (command === "edit") {
      output = editInSite(runDir, args);
    } else if (command === "logs") {
      output = serverLog(runDir, args);
    } else if (BROWSER_COMMANDS.has(command)) {
      const state = readState(runDir);
      if (!alive(state.driverPid)) throw new Refused("this run is stopped");
      output = `${await callDriver(state, command, args)}\n`;
    } else {
      throw new Refused(`unknown command: ${command}`);
    }
  } catch (error) {
    code = 1;
    output = `${error instanceof Refused ? "" : "error: "}${error.message}\n`;
  }
  log(runDir, argv, output, code);
  process.stdout.write(output);
  process.exitCode = code;
}

main().catch((error) => {
  console.error(error instanceof Refused ? error.message : error);
  process.exit(1);
});
