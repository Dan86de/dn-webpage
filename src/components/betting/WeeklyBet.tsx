import { useEffect, useState } from "react";
import {
  NICK_MAX,
  NICK_MIN,
  SIDES,
  STARTING_COINS,
  believerShare,
  isoWeek,
  otherSide,
  projectedPayout,
  type Side,
} from "@/lib/betting";
import type { MarketView, Me } from "@/lib/bets-view";
import { cn } from "@/lib/utils";
import BetSlip from "./BetSlip";
import { placeBet, useBets } from "./bets-client";
import { fmt, weekdayTime } from "./format";

/**
 * This week's bet on /habits: the split bar (how the pot leans), then either
 * the bet form or your slip once you're in. Last week's slip stays up next to
 * this week's so you see it get stamped.
 */

const STAKES = [10, 25, 50];
const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;
const PICK_LABEL: Record<Side, string> = {
  believe: "He'll make it",
  doubt: "He'll fold",
};

function statusLine(market: MarketView): string {
  switch (market.status) {
    case "open":
      return `Closes ${weekdayTime(market.due)} · ${market.done} of ${market.target} logged`;
    case "closed":
      return `Betting closed · settles ${weekdayTime(market.settlesAt)}`;
    case "yes":
      return "Settled · he did it";
    case "no":
      return "Settled · he didn't";
  }
}

function Segment({
  side,
  share,
  lost,
  paid,
}: {
  side: Side;
  share: number;
  lost: boolean;
  paid: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-16 items-center gap-2 overflow-hidden rounded-[3px] px-3.5 whitespace-nowrap",
        "transition-[flex-grow] duration-600 ease-[cubic-bezier(0.3,0.7,0.4,1.2)] motion-reduce:transition-none",
        side === "believe"
          ? "bg-orange-500 text-white"
          : "flex-row-reverse bg-gray-1200 text-gray-100",
        lost &&
          "bg-[repeating-linear-gradient(135deg,var(--color-gray-400)_0_6px,var(--color-gray-300)_6px_12px)] text-gray-1000",
      )}
      style={{ flexGrow: share }}
    >
      <span className="font-display text-xl font-medium tabular-nums">
        {share}%
      </span>
      <span className="caption opacity-85 max-tablet:hidden">
        {paid ? "Paid" : side === "believe" ? "Believers" : "Doubters"}
      </span>
    </div>
  );
}

function SplitBar({ market }: { market: MarketView }) {
  const share = believerShare(market.pools);
  const winner =
    market.status === "yes" ? "believe" : market.status === "no" ? "doubt" : null;

  if (share === null) {
    return (
      <div className="caption grid h-12 place-items-center rounded-[3px] bg-gray-300 text-gray-1000">
        {winner ? "Nobody bet on this one" : "No bets yet"}
      </div>
    );
  }

  return (
    <div
      className="flex h-12 gap-[3px]"
      role="img"
      aria-label={`${share}% of the pot backs him, ${100 - share}% bets he folds`}
    >
      {SIDES.filter((side) => market.pools[side] > 0).map((side) => (
        <Segment
          key={side}
          side={side}
          share={side === "believe" ? share : 100 - share}
          lost={winner !== null && winner !== side}
          paid={winner === side}
        />
      ))}
    </div>
  );
}

function PoolsLine({ market }: { market: MarketView }) {
  const { pools } = market;
  if (pools.believe + pools.doubt === 0) {
    return (
      <p className="caption text-gray-1000">
        {market.status === "open" ? "The first bet sets the odds" : " "}
      </p>
    );
  }
  return (
    <p className="caption flex justify-between gap-4 text-gray-1000 tabular-nums">
      <span>
        {fmt(pools.believe)} coins · {plural(pools.believeCount, "believer")}
      </span>
      <span className="text-right">
        {plural(pools.doubtCount, "doubter")} · {fmt(pools.doubt)} coins
      </span>
    </p>
  );
}

function BetForm({ market, me }: { market: MarketView; me: Me | null }) {
  const balance = me?.balance ?? STARTING_COINS;
  const [side, setSide] = useState<Side | null>(null);
  const [stake, setStake] = useState(Math.min(25, balance));
  const [nick, setNick] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Winnings or another tab can leave less than the chosen stake.
  useEffect(() => {
    if (stake > balance) setStake(balance);
  }, [balance, stake]);

  if (balance <= 0) {
    return (
      <p className="mt-2 text-gray-1100">
        You're out of coins. Whatever your open slips win lands back here when
        they settle.
      </p>
    );
  }

  const stakes = [
    ...STAKES.filter((value) => value < balance).map((value) => ({
      value,
      label: String(value),
    })),
    { value: balance, label: "All in" },
  ];

  async function submit() {
    if (!side || busy) return;
    setBusy(true);
    setError(null);
    const failure = await placeBet({ side, stake, nick: me ? undefined : nick });
    setBusy(false);
    if (failure) setError(failure.message);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-3"
    >
      <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Pick a side">
        {SIDES.map((option) => {
          const back = projectedPayout(option, stake, market.pools);
          const picked = side === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={picked}
              onClick={() => setSide(option)}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-0.5 rounded-lg border-[1.5px] border-gray-700 px-4 py-3 text-left transition-colors hover:border-gray-1000",
                picked &&
                  option === "believe" &&
                  "border-orange-500 bg-orange-100 hover:border-orange-500",
                picked &&
                  option === "doubt" &&
                  "border-gray-1200 bg-gray-300 hover:border-gray-1200",
              )}
            >
              <span className="font-display text-lg font-medium">
                {PICK_LABEL[option]}
              </span>
              <span className="caption text-gray-1000 tabular-nums">
                {/* With nobody on the other side there is nothing to win yet. */}
                {market.pools[otherSide(option)] === 0
                  ? "No takers yet"
                  : `Pays ${fmt(back)} · x${(back / stake).toFixed(2)}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Stake">
          {stakes.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={stake === option.value}
              onClick={() => setStake(option.value)}
              className={cn(
                "cursor-pointer rounded-full border border-gray-700 px-3 py-1.5 font-mono text-[13px] tracking-[0.02em] tabular-nums hover:border-gray-1000",
                stake === option.value &&
                  "border-gray-1200 bg-gray-1200 text-gray-100 hover:border-gray-1200",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {!me && (
            <label className="flex flex-col gap-1">
              <span className="caption text-gray-1000">Your nickname</span>
              <input
                value={nick}
                onChange={(event) => setNick(event.target.value)}
                required
                minLength={NICK_MIN}
                maxLength={NICK_MAX}
                autoComplete="nickname"
                placeholder="So your mates know"
                className="h-11 w-44 rounded-lg border border-gray-700 bg-transparent px-3 placeholder:text-gray-1000 focus-visible:border-orange-500"
              />
            </label>
          )}
          <button
            type="submit"
            disabled={!side || busy}
            className="bg-brand-gradient h-11 cursor-pointer rounded-lg px-5 font-display font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400 disabled:bg-none disabled:text-gray-1000"
          >
            {busy
              ? "Placing bet"
              : side
                ? `Bet ${stake} on ${side === "believe" ? "him" : "the couch"}`
                : "Pick a side"}
          </button>
        </div>
      </div>

      <p className="min-h-6 text-gray-1100" role="status">
        {error ? (
          <span className="text-orange-700">{error}</span>
        ) : me ? (
          <>
            Betting as <b className="text-gray-1200">{me.nick}</b> ·{" "}
            {fmt(balance)} coins left
          </>
        ) : (
          `New here? You get ${STARTING_COINS} coins to play with.`
        )}
      </p>
    </form>
  );
}

function Market({ market, me }: { market: MarketView; me: Me | null }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <p className="caption text-gray-1000">
            {market.habitName} · Week {isoWeek(market.week)}
          </p>
          <p className="font-display text-xl font-medium tablet:text-2xl">
            {market.question}
          </p>
        </div>
        <p className="caption text-gray-1000">{statusLine(market)}</p>
      </div>
      <SplitBar market={market} />
      <PoolsLine market={market} />
      {market.status === "open" && !market.mine && <BetForm market={market} me={me} />}
    </div>
  );
}

export default function WeeklyBet() {
  const { state, failed } = useBets();

  if (!state) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <p className="caption text-gray-1000">
          {failed ? "The betting book is unavailable right now" : "Loading this week's bet"}
        </p>
        <div className="h-12 rounded-[3px] bg-gray-300 motion-safe:animate-pulse" />
      </div>
    );
  }

  const { current, previous, me } = state;
  const slips = [
    current?.mine && { market: current, label: "Your slip" },
    previous?.mine && { market: previous, label: "Last week's slip" },
  ].filter((slip): slip is { market: MarketView; label: string } => Boolean(slip));

  return (
    <div className="flex flex-col gap-3">
      {current ? (
        <Market market={current} me={me} />
      ) : (
        <p className="text-gray-1100">
          No bet this week yet. When I set one, it shows up here.
        </p>
      )}

      {slips.length > 0 && (
        <div className="mt-4 grid items-start gap-8 tablet:grid-cols-2">
          {slips.map(({ market, label }) => (
            <BetSlip key={market.week} market={market} nick={me?.nick ?? ""} label={label} />
          ))}
        </div>
      )}
    </div>
  );
}
