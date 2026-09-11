/**
 * The betting book in process memory, for local dev without Redis. It follows
 * the same rules as the Redis store, and JavaScript being single-threaded is
 * what makes each method atomic here.
 */
import {
  EMPTY_POOLS,
  STARTING_COINS,
  nickKey,
  payout,
  winningSide,
  type Outcome,
  type Pools,
} from "./betting.ts";
import type { BetStore, Player, Slip } from "./bet-store.ts";

export function createMemoryStore(): BetStore {
  const players = new Map<string, Player>();
  const nicks = new Map<string, string>();
  const joins = new Map<string, number>();
  const slips = new Map<string, Map<string, Slip>>();
  const paid = new Map<string, Map<string, number>>();
  const pools = new Map<string, Pools>();
  const bettors = new Map<string, Set<string>>();
  const targets = new Map<string, number>();
  const outcomes = new Map<string, Outcome>();
  const unsettled = new Set<string>();
  let ticket = 0;

  const copy = (player: Player): Player => ({ ...player });

  return {
    async getPlayer(id) {
      const player = players.get(id);
      return player ? copy(player) : null;
    },

    async createPlayer(id, nick) {
      if (players.has(id) || nicks.has(nickKey(nick))) return "taken";
      nicks.set(nickKey(nick), id);
      players.set(id, {
        id,
        nick,
        balance: STARTING_COINS,
        bets: 0,
        settled: 0,
        wins: 0,
        believes: 0,
      });
      return "ok";
    },

    async allowJoin(visitor, limit) {
      const count = (joins.get(visitor) ?? 0) + 1;
      joins.set(visitor, count);
      return count <= limit;
    },

    async placeBet({ playerId, market, side, stake, target, placedAt }) {
      const player = players.get(playerId);
      if (!player) return { ok: false, reason: "no-player" };
      if (outcomes.has(market)) return { ok: false, reason: "settled" };
      const mine = slips.get(playerId) ?? new Map<string, Slip>();
      if (mine.has(market)) return { ok: false, reason: "already-bet" };
      if (player.balance < stake) return { ok: false, reason: "insufficient" };

      const slip: Slip = { market, side, stake, ticket: ++ticket, placedAt };
      mine.set(market, slip);
      slips.set(playerId, mine);
      player.balance -= stake;
      player.bets += 1;
      if (side === "believe") player.believes += 1;

      const pool = { ...(pools.get(market) ?? EMPTY_POOLS) };
      pool[side] += stake;
      pool[`${side}Count`] += 1;
      pools.set(market, pool);
      bettors.set(market, (bettors.get(market) ?? new Set()).add(playerId));
      if (!targets.has(market)) targets.set(market, target);
      unsettled.add(market);

      return { ok: true, slip, balance: player.balance };
    },

    async getSlips(playerId) {
      return {
        slips: [...(slips.get(playerId)?.values() ?? [])],
        paid: Object.fromEntries(paid.get(playerId) ?? []),
      };
    },

    async getPools(markets) {
      return Object.fromEntries(
        markets.map((id) => [id, { ...(pools.get(id) ?? EMPTY_POOLS) }]),
      );
    },

    async getOutcomes(markets) {
      const found: Record<string, Outcome> = {};
      for (const id of markets) {
        const outcome = outcomes.get(id);
        if (outcome) found[id] = outcome;
      }
      return found;
    },

    async unsettledMarkets() {
      return [...unsettled].map((id) => ({ id, target: targets.get(id) ?? 1 }));
    },

    async settle(market, outcome) {
      const final = outcomes.get(market) ?? outcome;
      outcomes.set(market, final);
      const pool = pools.get(market) ?? EMPTY_POOLS;

      for (const playerId of bettors.get(market) ?? []) {
        const slip = slips.get(playerId)?.get(market);
        const player = players.get(playerId);
        if (!slip || !player) continue;
        const mine = paid.get(playerId) ?? new Map<string, number>();
        if (mine.has(market)) continue;

        const amount = payout(slip.side, slip.stake, final, pool);
        mine.set(market, amount);
        paid.set(playerId, mine);
        player.balance += amount;
        player.settled += 1;
        if (slip.side === winningSide(final)) player.wins += 1;
      }

      unsettled.delete(market);
      return final;
    },

    async board(limit) {
      return [...players.values()]
        .filter((player) => player.bets > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, limit)
        .map(copy);
    },
  };
}
