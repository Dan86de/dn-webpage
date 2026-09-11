import type { BoardRow } from "@/lib/bets-view";
import { cn } from "@/lib/utils";
import { useBets } from "./bets-client";

/** The friends table: everyone who has placed a bet, richest first. */

const fmt = (value: number) => value.toLocaleString("en-US");

function record(row: BoardRow): string {
  const lean = row.believes * 2 >= row.bets ? "Believer" : "Doubter";
  const tally =
    row.settled === 0 ? `${row.bets} open` : `${row.wins} of ${row.settled} won`;
  return `${lean} · ${tally}`;
}

const cell = "border-t border-gray-400 py-2.5";

export default function Leaderboard() {
  const { state, failed } = useBets();

  if (!state) {
    return (
      <p className="min-h-6 text-gray-1000">
        {failed ? "The table is unavailable right now." : "Loading the table"}
      </p>
    );
  }

  if (state.board.length === 0) {
    return (
      <p className="text-gray-1100">
        Nobody has bet yet. The first slip in tops the table.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse tabular-nums">
        <thead>
          <tr>
            <th className="caption pb-2 text-left font-normal text-gray-1000">Punter</th>
            <th className="caption pb-2 text-left font-normal text-gray-1000">Record</th>
            <th className="caption pb-2 text-right font-normal text-gray-1000">Coins</th>
          </tr>
        </thead>
        <tbody>
          {state.board.map((row) => (
            <tr key={row.nick} className={cn(row.isMe && "text-orange-600")}>
              <td className={cn(cell, "pr-4 font-display font-medium")}>
                {row.nick}
                {row.isMe && " (you)"}
              </td>
              <td className={cn(cell, "pr-4 whitespace-nowrap", !row.isMe && "text-gray-1100")}>
                {record(row)}
              </td>
              <td className={cn(cell, "text-right")}>{fmt(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
