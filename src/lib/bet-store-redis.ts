/**
 * The betting book in Upstash Redis.
 *
 * Anything that moves coins is one Lua script, so it runs atomically on the
 * server: two quick taps cannot place the same bet twice or spend the same
 * coins on two markets, and settling a market twice never pays anyone twice.
 *
 * Keys, all under `bets:`:
 *   player:<id>        hash  nick, balance, bets, settled, wins, believes, joined
 *   nicks              hash  lowercased nick -> player id
 *   board              zset  player id scored by balance
 *   slips:<id>         hash  market -> slip JSON
 *   paid:<id>          hash  market -> coins paid out
 *   pool:<market>      hash  believe, doubt, believeCount, doubtCount
 *   bettors:<market>   set   player ids with a slip on the market
 *   market:<market>    hash  target
 *   outcome:<market>   str   yes | no, written once
 *   unsettled          set   markets with bets that have not paid out
 *   ticket             int   slip number counter
 *   joins:<visitor>    int   new players from one visitor today
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
import { type Command, pipeline, toCount, toRecord } from "./redis";

const key = {
  player: (id: string) => `bets:player:${id}`,
  nicks: "bets:nicks",
  board: "bets:board",
  slips: (id: string) => `bets:slips:${id}`,
  paid: (id: string) => `bets:paid:${id}`,
  pool: (market: string) => `bets:pool:${market}`,
  bettors: (market: string) => `bets:bettors:${market}`,
  market: (market: string) => `bets:market:${market}`,
  outcome: (market: string) => `bets:outcome:${market}`,
  unsettled: "bets:unsettled",
  ticket: "bets:ticket",
  joins: (visitor: string) => `bets:joins:${visitor}`,
};

const DAY_SECONDS = 60 * 60 * 24;

// KEYS: nicks, player, board. ARGV: nick key, id, nick, coins.
const CREATE_PLAYER = `
if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
if redis.call('HSETNX', KEYS[1], ARGV[1], ARGV[2]) == 0 then return 0 end
redis.call('HSET', KEYS[2], 'nick', ARGV[3], 'balance', ARGV[4], 'bets', 0,
  'settled', 0, 'wins', 0, 'believes', 0)
redis.call('ZADD', KEYS[3], ARGV[4], ARGV[2])
return 1
`;

// KEYS: player, slips, pool, bettors, unsettled, board, market, outcome.
// ARGV: market, side, stake, slip JSON, player id, target.
// Returns the new balance, or a negative code.
const PLACE_BET = `
if redis.call('EXISTS', KEYS[1]) == 0 then return -1 end
if redis.call('EXISTS', KEYS[8]) == 1 then return -4 end
if redis.call('HEXISTS', KEYS[2], ARGV[1]) == 1 then return -2 end
local stake = tonumber(ARGV[3])
local balance = tonumber(redis.call('HGET', KEYS[1], 'balance'))
if balance < stake then return -3 end
balance = redis.call('HINCRBY', KEYS[1], 'balance', -stake)
redis.call('HINCRBY', KEYS[1], 'bets', 1)
if ARGV[2] == 'believe' then redis.call('HINCRBY', KEYS[1], 'believes', 1) end
redis.call('HSET', KEYS[2], ARGV[1], ARGV[4])
redis.call('HINCRBY', KEYS[3], ARGV[2], stake)
redis.call('HINCRBY', KEYS[3], ARGV[2] .. 'Count', 1)
redis.call('SADD', KEYS[4], ARGV[5])
redis.call('SADD', KEYS[5], ARGV[1])
redis.call('ZADD', KEYS[6], balance, ARGV[5])
redis.call('HSETNX', KEYS[7], 'target', ARGV[6])
return balance
`;

const PLACE_ERRORS = {
  "-1": "no-player",
  "-2": "already-bet",
  "-3": "insufficient",
  "-4": "settled",
} as const;

// KEYS: paid, player, board. ARGV: market, coins, won (0/1), player id.
const PAY_SLIP = `
if redis.call('HSETNX', KEYS[1], ARGV[1], ARGV[2]) == 0 then return 0 end
local balance = redis.call('HINCRBY', KEYS[2], 'balance', ARGV[2])
redis.call('HINCRBY', KEYS[2], 'settled', 1)
redis.call('HINCRBY', KEYS[2], 'wins', ARGV[3])
redis.call('ZADD', KEYS[3], balance, ARGV[4])
return 1
`;

function toPlayer(id: string, record: Record<string, string>): Player | null {
  if (!record.nick) return null;
  return {
    id,
    nick: record.nick,
    balance: toCount(record.balance),
    bets: toCount(record.bets),
    settled: toCount(record.settled),
    wins: toCount(record.wins),
    believes: toCount(record.believes),
  };
}

function toPools(value: unknown): Pools {
  const record = toRecord(value);
  return {
    believe: toCount(record.believe ?? EMPTY_POOLS.believe),
    doubt: toCount(record.doubt ?? EMPTY_POOLS.doubt),
    believeCount: toCount(record.believeCount ?? EMPTY_POOLS.believeCount),
    doubtCount: toCount(record.doubtCount ?? EMPTY_POOLS.doubtCount),
  };
}

function parseSlip(value: unknown): Slip | null {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as Slip;
  } catch {
    return null;
  }
}

export function createRedisStore(): BetStore {
  return {
    async getPlayer(id) {
      const [record] = await pipeline([["HGETALL", key.player(id)]]);
      return toPlayer(id, toRecord(record));
    },

    async createPlayer(id, nick) {
      const [created] = await pipeline([
        [
          "EVAL",
          CREATE_PLAYER,
          3,
          key.nicks,
          key.player(id),
          key.board,
          nickKey(nick),
          id,
          nick,
          STARTING_COINS,
        ],
      ]);
      return toCount(created) === 1 ? "ok" : "taken";
    },

    async allowJoin(visitor, limit) {
      const [count] = await pipeline([
        ["INCR", key.joins(visitor)],
        ["EXPIRE", key.joins(visitor), DAY_SECONDS, "NX"],
      ]);
      return toCount(count) <= limit;
    },

    async placeBet({ playerId, market, side, stake, target, placedAt }) {
      const [ticket] = await pipeline([["INCR", key.ticket]]);
      const slip: Slip = { market, side, stake, ticket: toCount(ticket), placedAt };
      const [result] = await pipeline([
        [
          "EVAL",
          PLACE_BET,
          8,
          key.player(playerId),
          key.slips(playerId),
          key.pool(market),
          key.bettors(market),
          key.unsettled,
          key.board,
          key.market(market),
          key.outcome(market),
          market,
          side,
          stake,
          JSON.stringify(slip),
          playerId,
          target,
        ],
      ]);
      const code = toCount(result);
      if (code < 0) {
        return { ok: false, reason: PLACE_ERRORS[String(code) as keyof typeof PLACE_ERRORS] };
      }
      return { ok: true, slip, balance: code };
    },

    async getSlips(playerId) {
      const [slipsRaw, paidRaw] = await pipeline([
        ["HGETALL", key.slips(playerId)],
        ["HGETALL", key.paid(playerId)],
      ]);
      const slips = Object.values(toRecord(slipsRaw))
        .map(parseSlip)
        .filter((slip): slip is Slip => slip !== null);
      const paid = Object.fromEntries(
        Object.entries(toRecord(paidRaw)).map(([market, coins]) => [
          market,
          toCount(coins),
        ]),
      );
      return { slips, paid };
    },

    async getPools(markets) {
      const results = await pipeline(markets.map((id) => ["HGETALL", key.pool(id)]));
      return Object.fromEntries(markets.map((id, i) => [id, toPools(results[i])]));
    },

    async getOutcomes(markets) {
      const results = await pipeline(markets.map((id) => ["GET", key.outcome(id)]));
      const found: Record<string, Outcome> = {};
      markets.forEach((id, i) => {
        if (results[i] === "yes" || results[i] === "no") found[id] = results[i];
      });
      return found;
    },

    async unsettledMarkets() {
      const [ids] = await pipeline([["SMEMBERS", key.unsettled]]);
      const markets = Array.isArray(ids) ? ids.map(String) : [];
      const targets = await pipeline(
        markets.map((id) => ["HGET", key.market(id), "target"]),
      );
      return markets.map((id, i) => ({ id, target: toCount(targets[i]) || 1 }));
    },

    async settle(market, outcome) {
      const [, stored, bettorsRaw, poolRaw] = await pipeline([
        ["SET", key.outcome(market), outcome, "NX"],
        ["GET", key.outcome(market)],
        ["SMEMBERS", key.bettors(market)],
        ["HGETALL", key.pool(market)],
      ]);
      const final: Outcome = stored === "yes" || stored === "no" ? stored : outcome;
      const pool = toPools(poolRaw);
      const bettors = Array.isArray(bettorsRaw) ? bettorsRaw.map(String) : [];

      const slips = await pipeline(
        bettors.map((id) => ["HGET", key.slips(id), market]),
      );
      const payments: Command[] = [];
      bettors.forEach((id, i) => {
        const slip = parseSlip(slips[i]);
        if (!slip) return;
        const coins = payout(slip.side, slip.stake, final, pool);
        const won = slip.side === winningSide(final) ? 1 : 0;
        payments.push([
          "EVAL",
          PAY_SLIP,
          3,
          key.paid(id),
          key.player(id),
          key.board,
          market,
          coins,
          won,
          id,
        ]);
      });
      await pipeline(payments);
      // Only forget the market once everyone is paid, so a failed run is
      // retried on the next request.
      await pipeline([["SREM", key.unsettled, market]]);
      return final;
    },

    async board(limit) {
      // Fetch extra: players who joined but never bet sit on 100 and are
      // filtered out below.
      const [ranked] = await pipeline([
        ["ZREVRANGE", key.board, 0, limit * 4 - 1],
      ]);
      const ids = Array.isArray(ranked) ? ranked.map(String) : [];
      const records = await pipeline(ids.map((id) => ["HGETALL", key.player(id)]));
      return ids
        .map((id, i) => toPlayer(id, toRecord(records[i])))
        .filter((player): player is Player => player !== null && player.bets > 0)
        .slice(0, limit);
    },
  };
}
