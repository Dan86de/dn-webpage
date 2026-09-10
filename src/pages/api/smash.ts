/**
 * The habits page smash counter.
 *
 * GET  -> { total }
 * POST -> { delta } => { total, mine }
 *
 * Rendered on demand rather than prerendered, so it is a real function on
 * Vercel instead of a build-time snapshot.
 */
import type { APIRoute } from "astro";
import {
  PER_VISITOR_CAP,
  addSmashes,
  readTotal,
  visitorId,
} from "@/lib/smash";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });

export const GET: APIRoute = async () => {
  try {
    return json({ total: await readTotal(), cap: PER_VISITOR_CAP });
  } catch (error) {
    console.error("smash: read failed", error);
    return json({ error: "unavailable" }, 503);
  }
};

export const POST: APIRoute = async ({ request }) => {
  let delta: unknown;
  try {
    ({ delta } = await request.json());
  } catch {
    return json({ error: "expected JSON body" }, 400);
  }

  if (
    typeof delta !== "number" ||
    !Number.isInteger(delta) ||
    delta < 1 ||
    delta > PER_VISITOR_CAP
  ) {
    return json({ error: `delta must be an integer 1-${PER_VISITOR_CAP}` }, 400);
  }

  try {
    const visitor = await visitorId(request);
    return json({ ...(await addSmashes(visitor, delta)), cap: PER_VISITOR_CAP });
  } catch (error) {
    console.error("smash: write failed", error);
    return json({ error: "unavailable" }, 503);
  }
};
