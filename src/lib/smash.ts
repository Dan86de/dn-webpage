/**
 * Storage for the habits page smash counter, in Upstash Redis (see redis.ts).
 *
 * When the env vars are missing (local dev, a preview without the store
 * connected) it falls back to an in-memory counter so the button still works.
 * That count lives and dies with the process, which is fine for dev and
 * resets often enough that nobody mistakes it for the real number.
 */
import { type Command, isConfigured, pipeline, secret, toCount } from "./redis";

const TOTAL_KEY = "smash:habits:total";
const VISITOR_PREFIX = "smash:habits:visitor:";
const VISITOR_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

/** Most smashes a single visitor can ever add to the total. */
export const PER_VISITOR_CAP = 16;

/** Stand-in store used only when Redis is not configured. */
const memory = { total: 0, visitors: new Map<string, number>() };

export async function readTotal(): Promise<number> {
  if (!isConfigured) return memory.total;
  const [total] = await pipeline([["GET", TOTAL_KEY]]);
  return toCount(total);
}

/**
 * Add `delta` smashes for one visitor and return the new total.
 *
 * The visitor's own tally is kept alongside the total so the cap survives a
 * cleared localStorage. Anything over the cap is dropped rather than rejected:
 * the smashing still feels good client-side, it just stops moving the number.
 */
export async function addSmashes(
  visitor: string,
  delta: number,
): Promise<{ total: number; mine: number }> {
  const key = `${VISITOR_PREFIX}${visitor}`;

  if (!isConfigured) {
    const before = memory.visitors.get(visitor) ?? 0;
    const allowed = Math.max(0, Math.min(delta, PER_VISITOR_CAP - before));
    memory.visitors.set(visitor, before + allowed);
    memory.total += allowed;
    return { total: memory.total, mine: before + allowed };
  }

  const [mineRaw] = await pipeline([
    ["INCRBY", key, delta],
    ["EXPIRE", key, VISITOR_TTL_SECONDS],
  ]);
  const mineAfter = toCount(mineRaw);
  const before = mineAfter - delta;
  const allowed = Math.max(0, Math.min(delta, PER_VISITOR_CAP - before));

  // Wind the visitor key back to what actually counted, so a visitor who
  // spams past the cap is not permanently further over it.
  const commands: Command[] = [];
  if (allowed < delta) commands.push(["INCRBY", key, allowed - delta]);
  commands.push(["INCRBY", TOTAL_KEY, allowed]);

  const results = await pipeline(commands);
  return {
    total: toCount(results[results.length - 1]),
    mine: before + allowed,
  };
}

/**
 * A stable, non-reversible id for a visitor, so a limit has something to hang
 * on that is not a raw IP address. Salted with the Redis token, which is
 * already a secret this code holds.
 */
export async function visitorId(request: Request): Promise<string> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const agent = request.headers.get("user-agent") ?? "unknown";
  const data = new TextEncoder().encode(`${secret}:${ip}:${agent}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
