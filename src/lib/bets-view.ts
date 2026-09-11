/**
 * What /api/bets sends the betting islands. Shared by the endpoint and the
 * client so both sides agree on the shape.
 */
import type { MarketStatus, Pools, Side } from "./betting.ts";

export type SlipView = {
  side: Side;
  stake: number;
  ticket: number;
  placedAt: string;
  /** Coins paid out once settled, stake included. Null while open. */
  paid: number | null;
};

export type MarketView = {
  /** The Monday of the bet's week, which is also its id. */
  week: string;
  habit: string;
  habitName: string;
  question: string;
  target: number;
  /** Days logged from Monday up to the due date so far. */
  done: number;
  status: MarketStatus;
  /** Local Warsaw time betting closes, "YYYY-MM-DDTHH:MM". */
  due: string;
  /** When a "no" becomes final. */
  settlesAt: string;
  pools: Pools;
  mine: SlipView | null;
};

export type Me = {
  nick: string;
  balance: number;
  bets: number;
  settled: number;
  wins: number;
};

export type BoardRow = {
  nick: string;
  balance: number;
  bets: number;
  settled: number;
  wins: number;
  believes: number;
  isMe: boolean;
};

export type BetsState = {
  /** Server's local Warsaw time, "YYYY-MM-DDTHH:MM". */
  now: string;
  me: Me | null;
  /** This week's bet, or null when none is set. */
  current: MarketView | null;
  /** Last week's bet, only sent when you had a slip on it. */
  previous: MarketView | null;
  board: BoardRow[];
};

export type BetsError = { error: string; message: string };
