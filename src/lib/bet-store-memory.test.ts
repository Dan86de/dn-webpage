import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "./bet-store-memory.ts";

const MARKET = "2026-09-07";
const at = "2026-09-11T14:32";

async function withPlayers(...nicks: string[]) {
  const store = createMemoryStore();
  for (const nick of nicks) {
    assert.equal(await store.createPlayer(nick.toLowerCase(), nick), "ok");
  }
  return store;
}

const bet = (playerId: string, side: "believe" | "doubt", stake: number) => ({
  playerId,
  market: MARKET,
  side,
  stake,
  target: 2,
  placedAt: at,
});

test("nicknames are unique regardless of case", async () => {
  const store = await withPlayers("Kuba");
  assert.equal(await store.createPlayer("other", "KUBA"), "taken");
});

test("a bet moves coins into the pool, once per market", async () => {
  const store = await withPlayers("Kuba");
  const placed = await store.placeBet(bet("kuba", "believe", 25));
  assert.ok(placed.ok);
  assert.equal(placed.balance, 75);
  assert.deepEqual(await store.getPools([MARKET]), {
    [MARKET]: { believe: 25, doubt: 0, believeCount: 1, doubtCount: 0 },
  });
  assert.deepEqual(await store.placeBet(bet("kuba", "doubt", 10)), {
    ok: false,
    reason: "already-bet",
  });
});

test("nobody can stake more than they have", async () => {
  const store = await withPlayers("Kuba");
  assert.deepEqual(await store.placeBet(bet("kuba", "believe", 101)), {
    ok: false,
    reason: "insufficient",
  });
  assert.deepEqual(await store.placeBet(bet("ghost", "believe", 10)), {
    ok: false,
    reason: "no-player",
  });
});

test("settling pays winners from the pot, once, and closes the market", async () => {
  const store = await withPlayers("Kuba", "Ola", "Marek");
  await store.placeBet(bet("kuba", "believe", 50));
  await store.placeBet(bet("ola", "believe", 25));
  await store.placeBet(bet("marek", "doubt", 75));
  assert.deepEqual(await store.unsettledMarkets(), [{ id: MARKET, target: 2 }]);

  assert.equal(await store.settle(MARKET, "yes"), "yes");
  // Pot of 150 split 50:25 between the believers.
  assert.equal((await store.getPlayer("kuba"))?.balance, 50 + 100);
  assert.equal((await store.getPlayer("ola"))?.balance, 75 + 50);
  assert.equal((await store.getPlayer("marek"))?.balance, 25);
  assert.deepEqual((await store.getSlips("kuba")).paid, { [MARKET]: 100 });

  // A second settle, even with a different outcome, changes nothing.
  assert.equal(await store.settle(MARKET, "no"), "yes");
  assert.equal((await store.getPlayer("kuba"))?.balance, 150);
  assert.deepEqual(await store.unsettledMarkets(), []);
  assert.deepEqual(await store.placeBet(bet("ola", "doubt", 10)), {
    ok: false,
    reason: "settled",
  });

  const kuba = await store.getPlayer("kuba");
  assert.equal(kuba?.wins, 1);
  assert.equal(kuba?.settled, 1);
  assert.equal((await store.getPlayer("marek"))?.wins, 0);
});

test("the board lists only players who bet, richest first", async () => {
  const store = await withPlayers("Kuba", "Ola", "Lurker");
  await store.placeBet(bet("kuba", "believe", 50));
  await store.placeBet(bet("ola", "doubt", 10));
  const board = await store.board(10);
  assert.deepEqual(
    board.map((player) => [player.nick, player.balance]),
    [
      ["Ola", 90],
      ["Kuba", 50],
    ],
  );
});

test("joins are rate limited per visitor", async () => {
  const store = createMemoryStore();
  assert.equal(await store.allowJoin("v", 2), true);
  assert.equal(await store.allowJoin("v", 2), true);
  assert.equal(await store.allowJoin("v", 2), false);
  assert.equal(await store.allowJoin("w", 2), true);
});
