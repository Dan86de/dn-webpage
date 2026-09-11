import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_POOLS,
  betProblem,
  believerShare,
  cleanNick,
  countTowards,
  isoWeek,
  localNow,
  marketStatus,
  nickKey,
  payout,
  projectedPayout,
  settlesAt,
  weekStartOf,
} from "./betting.ts";

const WEEK = "2026-09-07";

test("localNow reads the wall clock in Warsaw, across DST", () => {
  // CEST is UTC+2 in September, CET is UTC+1 in January.
  assert.equal(localNow(new Date("2026-09-13T18:00:00Z")), "2026-09-13T20:00");
  assert.equal(localNow(new Date("2026-01-04T23:30:00Z")), "2026-01-05T00:30");
});

test("weeks run Monday to Sunday", () => {
  assert.equal(weekStartOf("2026-09-07"), "2026-09-07");
  assert.equal(weekStartOf("2026-09-11"), "2026-09-07");
  assert.equal(weekStartOf("2026-09-13"), "2026-09-07");
  assert.equal(weekStartOf("2026-09-14"), "2026-09-14");
});

test("a no is final at noon the day after the due date", () => {
  assert.equal(settlesAt("2026-09-13T20:00"), "2026-09-14T12:00");
  assert.equal(settlesAt("2026-09-10T07:00"), "2026-09-11T12:00");
});

test("a bet file must be named after its Monday and be due that week", () => {
  assert.equal(betProblem(WEEK, "2026-09-13T20:00"), null);
  assert.equal(betProblem(WEEK, "2026-09-07T00:00"), null);
  assert.match(betProblem("2026-09-08", "2026-09-13T20:00") ?? "", /Monday/);
  assert.match(betProblem("next", "2026-09-13T20:00") ?? "", /Monday/);
  assert.match(betProblem(WEEK, "2026-09-14T09:00") ?? "", /not in the week/);
  assert.match(betProblem(WEEK, "Sunday 20:00") ?? "", /YYYY-MM-DDTHH:MM/);
});

test("only days from Monday to the due date count", () => {
  const days = ["2026-09-06", "2026-09-07", "2026-09-10", "2026-09-12"];
  assert.equal(countTowards(days, WEEK, "2026-09-13T20:00"), 3);
  assert.equal(countTowards(days, WEEK, "2026-09-10T18:00"), 2);
});

test("a bet is open until the due date, then waits for noon next day", () => {
  const due = "2026-09-12T18:00"; // Saturday
  const days = ["2026-09-01", "2026-09-03"]; // last week only
  assert.equal(marketStatus(days, WEEK, due, 2, "2026-09-11T14:32"), "open");
  assert.equal(marketStatus(days, WEEK, due, 2, "2026-09-12T17:59"), "open");
  assert.equal(marketStatus(days, WEEK, due, 2, "2026-09-12T18:00"), "closed");
  assert.equal(marketStatus(days, WEEK, due, 2, "2026-09-13T11:59"), "closed");
  assert.equal(marketStatus(days, WEEK, due, 2, "2026-09-13T12:00"), "no");
});

test("hitting the target settles yes straight away, even late-logged", () => {
  const due = "2026-09-13T20:00";
  assert.equal(marketStatus(["2026-09-08"], WEEK, due, 1, "2026-09-08T09:00"), "yes");
  // Sunday's session logged on Monday morning still counts.
  assert.equal(
    marketStatus(["2026-09-09", "2026-09-13"], WEEK, due, 2, "2026-09-14T08:00"),
    "yes",
  );
  // A session after the due date does not.
  assert.equal(
    marketStatus(["2026-09-09", "2026-09-13"], WEEK, "2026-09-12T18:00", 2, "2026-09-13T09:00"),
    "closed",
  );
});

test("winners split the whole pot by stake, losers get nothing", () => {
  const pools = { believe: 300, doubt: 100, believeCount: 3, doubtCount: 1 };
  assert.equal(payout("believe", 150, "yes", pools), 200);
  assert.equal(payout("believe", 100, "yes", pools), 133); // floors
  assert.equal(payout("doubt", 100, "yes", pools), 0);
  assert.equal(payout("doubt", 100, "no", pools), 400);
});

test("with nobody on the winning side, every stake comes back", () => {
  const pools = { believe: 0, doubt: 120, believeCount: 0, doubtCount: 2 };
  assert.equal(payout("doubt", 50, "yes", pools), 50);
});

test("projected payout counts the new stake into the pot", () => {
  const pools = { believe: 940, doubt: 1520, believeCount: 23, doubtCount: 41 };
  // 25 * (2460 + 25) / (940 + 25)
  assert.equal(projectedPayout("believe", 25, pools), 64);
  assert.equal(projectedPayout("doubt", 25, pools), 40);
  // First bet into an empty market just returns the stake.
  assert.equal(projectedPayout("believe", 25, EMPTY_POOLS), 25);
});

test("believer share is by coins and null for an empty pot", () => {
  assert.equal(believerShare(EMPTY_POOLS), null);
  assert.equal(
    believerShare({ believe: 940, doubt: 1520, believeCount: 1, doubtCount: 1 }),
    38,
  );
});

test("nicknames are tidied and validated", () => {
  assert.equal(cleanNick("  Kuba   Nowak "), "Kuba Nowak");
  assert.equal(cleanNick("Łukasz"), "Łukasz");
  assert.equal(cleanNick("o'neil-2"), "o'neil-2");
  assert.equal(cleanNick("K"), null);
  assert.equal(cleanNick("x".repeat(21)), null);
  assert.equal(cleanNick("<script>"), null);
  assert.equal(cleanNick("-dash"), null);
  assert.equal(cleanNick(42), null);
  assert.equal(nickKey("ŁUKASZ"), nickKey("łukasz"));
});

test("ISO week numbers, including the year boundary", () => {
  assert.equal(isoWeek("2026-09-07"), 37);
  assert.equal(isoWeek("2025-12-29"), 1); // Thursday is 1 Jan 2026
  assert.equal(isoWeek("2026-12-28"), 53);
});
