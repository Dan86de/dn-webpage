import { motion, useReducedMotion } from "motion/react";
import { balloonPoints } from "@/lib/balloon";
import { SIDES, isoWeek, payout, winningSide, type Pools, type Side } from "@/lib/betting";
import type { MarketView } from "@/lib/bets-view";
import { cn } from "@/lib/utils";
import { fmt, longTime, weekdayTime } from "./format";
import "./bet-slip.css";

/**
 * Your bet as a paper ticket. While the bet is open it shows what the slip
 * would pay right now; once settled it shows what it paid and gets stamped
 * with the same comic burst the smash button throws.
 */

const STAMP_W = 232;
const STAMP_H = 148;
// Literal, like the paper: the stamp is ink on the slip, not page chrome.
const BALLOON_WIN = "oklch(88% 0.115 66)";
const BALLOON_LOSS = "oklch(80% 0.01 60)";
// Slams in oversized and snaps down, as the smash hits do.
const SLAM_IN = [0.19, 1, 0.22, 1] as const;

const PICK_LABEL: Record<Side, string> = {
  believe: "He'll make it",
  doubt: "He'll fold",
};

/** What one coin on `side` returns if the pot settled as it stands. */
function multiple(side: Side, pools: Pools): string {
  const total = pools.believe + pools.doubt;
  return pools[side] > 0 ? `x${(total / pools[side]).toFixed(2)}` : "-";
}

export default function BetSlip({
  market,
  nick,
  label,
}: {
  market: MarketView;
  nick: string;
  label: string;
}) {
  const reduced = useReducedMotion();
  const slip = market.mine;
  if (!slip) return null;

  const outcome =
    market.status === "yes" || market.status === "no" ? market.status : null;
  const won = outcome !== null && slip.side === winningSide(outcome);
  // Nobody backed the winning side, so every stake came back.
  const refunded = outcome !== null && !won && (slip.paid ?? 0) > 0;
  const amount = outcome
    ? (slip.paid ?? 0)
    : payout(slip.side, slip.stake, slip.side === "believe" ? "yes" : "no", market.pools);

  const week = isoWeek(market.week);
  const ticket = String(slip.ticket).padStart(4, "0");
  const code = `${week}-${market.habit.slice(0, 2).toUpperCase()}-${ticket}`;
  const stamp = outcome ? (won ? "PAID!" : refunded ? "REFUND!" : "BUSTED!") : null;
  const tilt = won ? -8 : 7;

  const note =
    market.status === "open"
      ? `Odds move until ${weekdayTime(market.due)}. Settles the moment he logs it, or ${weekdayTime(market.settlesAt)} if he doesn't.`
      : market.status === "closed"
        ? `Betting closed. Settles from the log ${weekdayTime(market.settlesAt)}.`
        : null;

  return (
    <figure className="flex flex-col items-start gap-3">
      <figcaption className="caption text-gray-1000">{label}</figcaption>

      <div className="bet-slip-wrap">
        <article
          className="bet-slip"
          aria-label={`Slip ${ticket}: ${slip.stake} coins on "${PICK_LABEL[slip.side].toLowerCase()}"${stamp ? `, ${stamp.replace("!", "").toLowerCase()}` : ""}`}
        >
          <div className="flex items-baseline justify-between pt-1.5">
            <span className="bet-slip__brand">DN BOOK</span>
            <span className="bet-slip__soft">No. {ticket}</span>
          </div>
          <p className="bet-slip__soft">{longTime(slip.placedAt)}</p>

          <hr className="bet-slip__rule" />
          <p className="bet-slip__soft uppercase">
            {market.habitName} · WK {week}
          </p>
          <p className="bet-slip__question">{market.question}</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {SIDES.map((side) => (
              <li
                key={side}
                className={cn("flex justify-between gap-2", side === slip.side && "font-bold")}
              >
                <span>
                  <span className="mr-[1ch] whitespace-pre">
                    {side === slip.side ? "[x]" : "[ ]"}
                  </span>
                  {PICK_LABEL[side]}
                </span>
                <span className="tabular-nums">{multiple(side, market.pools)}</span>
              </li>
            ))}
          </ul>

          <hr className="bet-slip__rule" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tabular-nums">
            <dt className="bet-slip__label">Punter</dt>
            <dd className="truncate text-right">{nick}</dd>
            <dt className="bet-slip__label">Stake</dt>
            <dd className="text-right">{fmt(slip.stake)}</dd>
            <dt className="bet-slip__label">Pot</dt>
            <dd className="text-right">{fmt(market.pools.believe + market.pools.doubt)}</dd>
          </dl>

          <hr className="bet-slip__rule" />
          <div className="flex items-baseline justify-between">
            <span className="bet-slip__soft">{outcome ? "PAID OUT" : "TO WIN"}</span>
            <b className="bet-slip__total">{fmt(amount)}</b>
          </div>
          {note && <p className="bet-slip__soft mt-1.5 text-[11px] leading-4">{note}</p>}

          <div className="bet-slip__barcode" aria-hidden="true" />
          <div className="bet-slip__soft mt-1 flex justify-between gap-2 text-[11px] whitespace-nowrap">
            <span>NO CASH VALUE</span>
            <span>{code}</span>
          </div>
        </article>

        {stamp && (
          <motion.svg
            className="bet-slip__stamp"
            viewBox={`0 0 ${STAMP_W} ${STAMP_H}`}
            aria-hidden="true"
            initial={
              reduced
                ? { opacity: 0, rotate: tilt }
                : { opacity: 0, scale: 1.55, rotate: tilt * 1.7 }
            }
            whileInView={{ opacity: 1, scale: 1, rotate: tilt }}
            viewport={{ once: true, amount: 0.8 }}
            transition={
              reduced
                ? { duration: 0.3, ease: "linear" }
                : { duration: 0.46, ease: SLAM_IN, delay: 0.15 }
            }
          >
            <polygon
              points={balloonPoints(slip.ticket, STAMP_W, STAMP_H)}
              style={{ fill: won ? BALLOON_WIN : BALLOON_LOSS }}
            />
            <text
              x={STAMP_W / 2}
              y={STAMP_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: Math.min(40, 216 / stamp.length) }}
            >
              {stamp}
            </text>
          </motion.svg>
        )}
      </div>
    </figure>
  );
}
