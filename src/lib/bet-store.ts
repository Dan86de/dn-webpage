/**
 * Where the betting book keeps its state: players, slips, pools and outcomes.
 *
 * Two implementations behind one interface. Redis in production, where every
 * write that moves coins is a single Lua script so it is atomic; memory in
 * local dev without the store, so the page works unconfigured.
 */
import type { Outcome, Pools, Side } from "./betting.ts";
import { isConfigured } from "./redis";
import { createMemoryStore } from "./bet-store-memory.ts";
import { createRedisStore } from "./bet-store-redis.ts";

export type Slip = {
  market: string;
  side: Side;
  stake: number;
  ticket: number;
  /** Local Warsaw time the bet went in, "YYYY-MM-DDTHH:MM". */
  placedAt: string;
};

export type Player = {
  id: string;
  nick: string;
  balance: number;
  /** Bets placed, settled, and won. */
  bets: number;
  settled: number;
  wins: number;
  /** How many of those bets backed him. */
  believes: number;
};

export type PlaceResult =
  | { ok: true; slip: Slip; balance: number }
  | { ok: false; reason: "no-player" | "already-bet" | "insufficient" | "settled" };

export interface BetStore {
  getPlayer(id: string): Promise<Player | null>;
  /** "taken" when someone already has that nickname, in any case. */
  createPlayer(id: string, nick: string): Promise<"ok" | "taken">;
  /** Counts a new-player attempt for this visitor; false once over `limit` today. */
  allowJoin(visitor: string, limit: number): Promise<boolean>;
  placeBet(bet: {
    playerId: string;
    market: string;
    side: Side;
    stake: number;
    target: number;
    placedAt: string;
  }): Promise<PlaceResult>;
  /** A player's slips, and what each settled one paid out. */
  getSlips(playerId: string): Promise<{ slips: Slip[]; paid: Record<string, number> }>;
  getPools(markets: string[]): Promise<Record<string, Pools>>;
  /** Recorded outcomes; a market with none yet is simply absent. */
  getOutcomes(markets: string[]): Promise<Partial<Record<string, Outcome>>>;
  /** Markets that took bets and have not paid out yet, with their target. */
  unsettledMarkets(): Promise<{ id: string; target: number }[]>;
  /**
   * Record the outcome (unless one is already recorded, which wins) and pay
   * every slip on the market. Safe to call again: nothing is paid twice.
   */
  settle(market: string, outcome: Outcome): Promise<Outcome>;
  /** Players who have bet at least once, richest first. */
  board(limit: number): Promise<Player[]>;
}

let store: BetStore | undefined;

export function getStore(): BetStore {
  store ??= isConfigured ? createRedisStore() : createMemoryStore();
  return store;
}
