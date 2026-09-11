/**
 * A minimal Upstash Redis client over its REST API: no client library and no
 * TCP pool, which is what a serverless function wants. Every call is a single
 * fetch and nothing has to survive a cold start.
 */

/*
 * Vercel's Upstash integration injects the KV_* pair; a store wired up by hand
 * uses the UPSTASH_* names. Accept either, so the deploy works whichever way
 * the store got connected.
 *
 * These are spelled out rather than looked up by name on purpose: Vite only
 * inlines `import.meta.env.X` when X is written literally, so a dynamic lookup
 * would come back undefined under `astro dev`. process.env is the runtime
 * source on Vercel; import.meta.env is what reads .env locally.
 */
const processEnv: Record<string, string | undefined> =
  typeof process !== "undefined" && process.env ? process.env : {};

const REST_URL =
  processEnv.KV_REST_API_URL ??
  processEnv.UPSTASH_REDIS_REST_URL ??
  import.meta.env.KV_REST_API_URL ??
  import.meta.env.UPSTASH_REDIS_REST_URL;

const REST_TOKEN =
  processEnv.KV_REST_API_TOKEN ??
  processEnv.UPSTASH_REDIS_REST_TOKEN ??
  import.meta.env.KV_REST_API_TOKEN ??
  import.meta.env.UPSTASH_REDIS_REST_TOKEN;

/** False in local dev without the store: callers fall back to memory. */
export const isConfigured = Boolean(REST_URL && REST_TOKEN);

/** A secret this code already holds, for salting hashes. */
export const secret = REST_TOKEN ?? "dev";

export type Command = (string | number)[];

/** Run commands in one round trip. Throws if any of them failed. */
export async function pipeline(commands: Command[]): Promise<unknown[]> {
  if (commands.length === 0) return [];
  const response = await fetch(`${REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!response.ok) {
    throw new Error(`Upstash ${response.status}: ${await response.text()}`);
  }
  const results = (await response.json()) as {
    result?: unknown;
    error?: string;
  }[];
  const failed = results.find((entry) => entry.error);
  if (failed) throw new Error(`Upstash: ${failed.error}`);
  return results.map((entry) => entry.result);
}

export function toCount(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** HGETALL comes back as a flat [field, value, field, value] list. */
export function toRecord(value: unknown): Record<string, string> {
  const record: Record<string, string> = {};
  if (!Array.isArray(value)) return record;
  for (let i = 0; i + 1 < value.length; i += 2) {
    record[String(value[i])] = String(value[i + 1]);
  }
  return record;
}
