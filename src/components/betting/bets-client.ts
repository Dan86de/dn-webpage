/**
 * Client state for the betting islands.
 *
 * The weekly bet and the leaderboard are separate islands, but they share
 * this module, so the page makes one GET however many of them hydrate, and a
 * bet placed in one updates the other.
 */
import { useSyncExternalStore } from "react";
import type { Side } from "@/lib/betting";
import type { BetsError, BetsState } from "@/lib/bets-view";

type Snapshot = { state: BetsState | null; failed: boolean };

// On the dev server, `/habits?now=2026-09-14T12:30` fakes the API's clock.
const ENDPOINT =
  import.meta.env.DEV && typeof location !== "undefined"
    ? `/api/bets${location.search}`
    : "/api/bets";

const INITIAL: Snapshot = { state: null, failed: false };
let snapshot: Snapshot = INITIAL;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function load() {
  loading ??= fetch(ENDPOINT)
    .then((response) => (response.ok ? response.json() : Promise.reject()))
    .then((state: BetsState) => publish({ state, failed: false }))
    .catch(() => publish({ state: snapshot.state, failed: true }));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

export function useBets(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => INITIAL,
  );
}

/** Place a bet. Resolves to an error to show, or null once it is in. */
export async function placeBet(bet: {
  side: Side;
  stake: number;
  nick?: string;
}): Promise<BetsError | null> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bet),
    });
    const body = (await response.json()) as BetsState | BetsError;
    if (!response.ok || "error" in body) return body as BetsError;
    publish({ state: body, failed: false });
    return null;
  } catch {
    return {
      error: "network",
      message: "Couldn't reach the betting book. Check your connection and try again.",
    };
  }
}
