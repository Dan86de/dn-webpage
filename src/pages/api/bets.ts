/**
 * The habits betting book: one bet per week.
 *
 * GET  -> BetsState for whoever is asking
 * POST -> { side, stake, nick? } => BetsState, or { error, message }
 *
 * The bets themselves are content (src/content/bets/<monday>.yaml), set by
 * Daniel. This endpoint only holds the money side: players, slips and pools.
 *
 * A player is a random id in an httpOnly cookie, created on their first bet
 * with the nickname they pick. Bets settle lazily: every request first settles
 * whatever the log has decided since the last one, so there is no cron to
 * run. Once recorded an outcome is final, so a day logged after the settle
 * time cannot flip a bet that already paid out.
 *
 * Rendered on demand and excluded from ISR (see astro.config.mjs): cached, the
 * pools would freeze.
 */
import type { APIRoute, AstroCookies } from "astro";
import { getCollection } from "astro:content";
import {
  SIDES,
  STARTING_COINS,
  betProblem,
  cleanNick,
  countTowards,
  localNow,
  marketStatus,
  settlesAt,
  weekStartOf,
  type MarketStatus,
  type Side,
} from "@/lib/betting";
import { addDays } from "@/lib/habits";
import { getStore, type BetStore } from "@/lib/bet-store";
import type { BetsError, BetsState, MarketView } from "@/lib/bets-view";
import { visitorId } from "@/lib/smash";

export const prerender = false;

const COOKIE = "dn_bettor";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // the most browsers allow
const PLAYER_ID = /^[0-9a-f-]{36}$/;
/** New players one visitor can create per day, so nobody farms fresh coins. */
const JOINS_PER_DAY = 3;
const BOARD_SIZE = 10;
const MAX_STAKE = 100_000;

type Bet = {
  week: string;
  habit: string;
  habitName: string;
  target: number;
  question: string;
  due: string;
  days: string[];
};

const json = (body: BetsState | BetsError, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

const fail = (status: number, error: string, message: string) =>
  json({ error, message }, status);

/** Every usable bet, by week. A broken file is skipped with a warning. */
async function loadBets(): Promise<Map<string, Bet>> {
  const [bets, habits] = await Promise.all([
    getCollection("bets"),
    getCollection("habits"),
  ]);
  const habitsById = new Map(habits.map((habit) => [habit.id, habit]));

  const usable = new Map<string, Bet>();
  for (const { id, data } of bets) {
    const habit = habitsById.get(data.habit);
    const problem = habit
      ? betProblem(id, data.due)
      : `there is no habit called "${data.habit}"`;
    if (problem || !habit) {
      console.warn(`bets: skipping src/content/bets/${id}.yaml: ${problem}`);
      continue;
    }
    usable.set(id, {
      week: id,
      habit: habit.id,
      habitName: habit.data.name,
      target: data.target,
      question: data.question,
      due: data.due,
      days: habit.data.days,
    });
  }
  return usable;
}

/**
 * Local Warsaw time. On the dev server `?now=YYYY-MM-DDTHH:MM` fakes it, to
 * walk a bet through closing and settling without waiting for the due date.
 */
function clock(url: URL): string {
  const fake = import.meta.env.DEV ? url.searchParams.get("now") : null;
  return fake && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fake) ? fake : localNow();
}

function readPlayerId(cookies: AstroCookies): string | null {
  const id = cookies.get(COOKIE)?.value;
  return id && PLAYER_ID.test(id) ? id : null;
}

function liveStatus(bet: Bet, now: string): MarketStatus {
  return marketStatus(bet.days, bet.week, bet.due, bet.target, now);
}

/** Pay out every bet the log has decided since anyone last looked. */
async function settleDue(store: BetStore, bets: Map<string, Bet>, now: string) {
  for (const { id } of await store.unsettledMarkets()) {
    const bet = bets.get(id);
    if (!bet) continue;
    const status = liveStatus(bet, now);
    if (status === "yes" || status === "no") await store.settle(id, status);
  }
}

async function buildState(
  store: BetStore,
  bets: Map<string, Bet>,
  playerId: string | null,
  now: string,
): Promise<BetsState> {
  const player = playerId ? await store.getPlayer(playerId) : null;
  const { slips, paid } = player
    ? await store.getSlips(player.id)
    : { slips: [], paid: {} as Record<string, number> };
  const slipByWeek = new Map(slips.map((slip) => [slip.market, slip]));

  const thisWeek = weekStartOf(now.slice(0, 10));
  const lastWeek = addDays(thisWeek, -7);
  const current = bets.get(thisWeek) ?? null;
  // Last week's bet only matters to someone who had a slip on it.
  const previous = slipByWeek.has(lastWeek) ? (bets.get(lastWeek) ?? null) : null;
  const shown = [current, previous].filter((bet): bet is Bet => bet !== null);
  const ids = shown.map((bet) => bet.week);

  const [pools, outcomes, board] = await Promise.all([
    store.getPools(ids),
    store.getOutcomes(ids),
    store.board(BOARD_SIZE),
  ]);

  const view = (bet: Bet): MarketView => {
    const slip = slipByWeek.get(bet.week);
    return {
      week: bet.week,
      habit: bet.habit,
      habitName: bet.habitName,
      question: bet.question,
      target: bet.target,
      done: countTowards(bet.days, bet.week, bet.due),
      // A recorded outcome is final, whatever the log says now.
      status: outcomes[bet.week] ?? liveStatus(bet, now),
      due: bet.due,
      settlesAt: settlesAt(bet.due),
      pools: pools[bet.week],
      mine: slip
        ? {
            side: slip.side,
            stake: slip.stake,
            ticket: slip.ticket,
            placedAt: slip.placedAt,
            paid: paid[bet.week] ?? null,
          }
        : null,
    };
  };

  return {
    now,
    me: player
      ? {
          nick: player.nick,
          balance: player.balance,
          bets: player.bets,
          settled: player.settled,
          wins: player.wins,
        }
      : null,
    current: current && view(current),
    previous: previous && view(previous),
    board: board.map((row) => ({
      nick: row.nick,
      balance: row.balance,
      bets: row.bets,
      settled: row.settled,
      wins: row.wins,
      believes: row.believes,
      isMe: row.id === player?.id,
    })),
  };
}

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const store = getStore();
    const bets = await loadBets();
    const now = clock(url);
    await settleDue(store, bets, now);
    return json(await buildState(store, bets, readPlayerId(cookies), now));
  } catch (error) {
    console.error("bets: read failed", error);
    return fail(503, "unavailable", "The betting book is down. Try again in a minute.");
  }
};

export const POST: APIRoute = async ({ request, cookies, url }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail(400, "bad-request", "Expected a JSON body.");
  }

  const { side, stake } = body;
  if (!SIDES.includes(side as Side)) {
    return fail(400, "bad-request", "Pick a side: believe or doubt.");
  }
  if (typeof stake !== "number" || !Number.isInteger(stake) || stake < 1 || stake > MAX_STAKE) {
    return fail(400, "bad-request", "Stake a whole number of coins.");
  }

  try {
    const store = getStore();
    const bets = await loadBets();
    const now = clock(url);
    await settleDue(store, bets, now);

    // Check the bet before anything else, so a slip that cannot go in never
    // leaves a half-made player behind.
    const bet = bets.get(weekStartOf(now.slice(0, 10)));
    if (!bet) return fail(404, "no-bet", "There's no bet this week yet.");
    const status = (await store.getOutcomes([bet.week]))[bet.week] ?? liveStatus(bet, now);
    if (status !== "open") {
      return fail(409, "closed", "Betting on this one is closed.");
    }

    let playerId = readPlayerId(cookies);
    if (!playerId || !(await store.getPlayer(playerId))) {
      const nick = cleanNick(body.nick);
      if (!nick) {
        return fail(400, "nick", "Pick a nickname first: 2 to 20 letters or numbers.");
      }
      if (stake > STARTING_COINS) {
        return fail(400, "insufficient", `You start with ${STARTING_COINS} coins.`);
      }
      if (!(await store.allowJoin(await visitorId(request), JOINS_PER_DAY))) {
        return fail(429, "too-many-players", "That's enough new players from you for today.");
      }
      playerId = crypto.randomUUID();
      if ((await store.createPlayer(playerId, nick)) === "taken") {
        return fail(409, "nick-taken", `"${nick}" is taken. Try another nickname.`);
      }
      cookies.set(COOKIE, playerId, {
        path: "/api/bets",
        httpOnly: true,
        sameSite: "lax",
        secure: import.meta.env.PROD,
        maxAge: COOKIE_MAX_AGE,
      });
    }

    const placed = await store.placeBet({
      playerId,
      market: bet.week,
      side: side as Side,
      stake,
      target: bet.target,
      placedAt: now,
    });
    if (!placed.ok) {
      const messages = {
        "no-player": "Your player is gone. Reload the page and pick a nickname.",
        "already-bet": "You already have a slip on this one.",
        insufficient: "You don't have that many coins.",
        settled: "Betting on this one is closed.",
      } as const;
      return fail(409, placed.reason, messages[placed.reason]);
    }

    return json(await buildState(store, bets, playerId, now));
  } catch (error) {
    console.error("bets: write failed", error);
    return fail(503, "unavailable", "The betting book is down. Try again in a minute.");
  }
};
