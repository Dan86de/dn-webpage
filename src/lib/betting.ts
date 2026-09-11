/**
 * The rules of the habits betting book, with no storage and no framework, so
 * they can be tested on their own (`pnpm test`).
 *
 * One bet per week, set by Daniel in `src/content/bets/<monday>.yaml`: a habit,
 * a target and a due date, e.g. "two CrossFit sessions by Sunday 20:00?".
 * Believers say yes, Doubters say no. It is a shared pot: the winning side
 * splits everything that was staked, in proportion to what each winner put in.
 * The habit log settles it. Play coins only.
 *
 * Imports carry the .ts extension so Node can run this file directly.
 */
import { addDays, weekdayIndex } from "./habits.ts";

export type Side = "believe" | "doubt";
export const SIDES: readonly Side[] = ["believe", "doubt"];

/** A bet's outcome once it is final: did he hit the target? */
export type Outcome = "yes" | "no";

/**
 * - open: taking bets
 * - closed: past the due date, waiting for the log to settle it
 * - yes / no: settled
 */
export type MarketStatus = "open" | "closed" | Outcome;

export type Pools = {
  believe: number;
  doubt: number;
  believeCount: number;
  doubtCount: number;
};

export const EMPTY_POOLS: Pools = {
  believe: 0,
  doubt: 0,
  believeCount: 0,
  doubtCount: 0,
};

/** Coins every new player starts with. */
export const STARTING_COINS = 100;

const TIME_ZONE = "Europe/Warsaw";
/**
 * A "no" is only final at this time on the day after the due date, so a
 * session logged late still counts.
 */
const SETTLE_TIME = "12:00";

/** Local Warsaw time, "YYYY-MM-DDTHH:MM". Due dates use the same format. */
export const LOCAL_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** The current local time in Warsaw as "YYYY-MM-DDTHH:MM". */
export function localNow(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

/** The Monday that starts the week containing `day`. */
export function weekStartOf(day: string): string {
  return addDays(day, -weekdayIndex(day));
}

/** ISO 8601 week number of the week starting on Monday `weekStart`. */
export function isoWeek(weekStart: string): number {
  // The ISO week belongs to the year its Thursday falls in.
  const thursday = new Date(`${addDays(weekStart, 3)}T00:00:00Z`);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.floor((thursday.getTime() - yearStart) / (7 * 86_400_000)) + 1;
}

/** When a "no" becomes final: noon on the day after the due date. */
export function settlesAt(due: string): string {
  return `${addDays(due.slice(0, 10), 1)}T${SETTLE_TIME}`;
}

/**
 * Why a bet file cannot be used, or null when it is fine. The file is named
 * after the Monday of its week, which is what makes it one bet per week, and
 * its due date has to fall inside that week.
 */
export function betProblem(week: string, due: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || weekStartOf(week) !== week) {
    return `the file name must be a Monday (YYYY-MM-DD), not "${week}"`;
  }
  if (!LOCAL_TIME.test(due)) return `due must be "YYYY-MM-DDTHH:MM", not "${due}"`;
  if (weekStartOf(due.slice(0, 10)) !== week) {
    return `due ${due} is not in the week of ${week}`;
  }
  return null;
}

/** Days logged from the Monday of the bet's week up to its due date. */
export function countTowards(days: string[], week: string, due: string): number {
  const last = due.slice(0, 10);
  return days.filter((day) => day >= week && day <= last).length;
}

/**
 * Where a bet stands at local time `now`, judged from the log.
 *
 * A "yes" settles the moment the log shows the target hit. Betting closes at
 * the due date, and a "no" waits until noon the next day, because an unlogged
 * session is not a missed one until Daniel has had a chance to log it.
 */
export function marketStatus(
  days: string[],
  week: string,
  due: string,
  target: number,
  now: string,
): MarketStatus {
  if (countTowards(days, week, due) >= target) return "yes";
  if (now >= settlesAt(due)) return "no";
  if (now >= due) return "closed";
  return "open";
}

export function winningSide(outcome: Outcome): Side {
  return outcome === "yes" ? "believe" : "doubt";
}

export function otherSide(side: Side): Side {
  return side === "believe" ? "doubt" : "believe";
}

/**
 * What a slip pays back once its market has settled, stake included.
 *
 * Winners split the whole pot by stake. If nobody backed the winning side
 * there is nobody to pay, so every stake is returned rather than vanishing.
 * Fractions of a coin are dropped.
 */
export function payout(
  side: Side,
  stake: number,
  outcome: Outcome,
  pools: Pools,
): number {
  const winner = winningSide(outcome);
  const winnerPool = pools[winner];
  if (winnerPool === 0) return stake;
  if (side !== winner) return 0;
  return Math.floor((stake * (pools.believe + pools.doubt)) / winnerPool);
}

/**
 * What a new stake on `side` would pay back if the market settled right now,
 * counting that stake into the pot. With nobody on the other side it just
 * returns the stake.
 */
export function projectedPayout(side: Side, stake: number, pools: Pools): number {
  const withStake = { ...pools, [side]: pools[side] + stake };
  return payout(side, stake, side === "believe" ? "yes" : "no", withStake);
}

/** Share of the pot on the Believers' side, 0-100, or null for an empty pot. */
export function believerShare(pools: Pools): number | null {
  const total = pools.believe + pools.doubt;
  return total === 0 ? null : Math.round((pools.believe / total) * 100);
}

const NICK_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]*$/u;
export const NICK_MIN = 2;
export const NICK_MAX = 20;

/** A tidied nickname, or null when it cannot be one. */
export function cleanNick(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const nick = raw.normalize("NFC").trim().replace(/\s+/g, " ");
  if (nick.length < NICK_MIN || nick.length > NICK_MAX) return null;
  return NICK_PATTERN.test(nick) ? nick : null;
}

/** Nicknames are unique regardless of case: "Kuba" and "kuba" are one. */
export function nickKey(nick: string): string {
  return nick.toLocaleLowerCase("pl");
}
