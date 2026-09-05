/**
 * Pure helpers for the weight chart: a day-by-day projection from the latest
 * reading to a goal weight, driven by a small energy-balance model.
 */

export type WeightPoint = { date: string; value: number };

export type BurnAnchor = { weight: number; kcal: number };

export type ProjectionModel = {
  goal: number;
  intake: number;
  burn: [BurnAnchor, BurnAnchor];
  /** Share of the modelled deficit actually hit on an average week, (0, 1]. */
  adherence: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const KCAL_PER_KG = 7700;
// Hard stop so a deficit that never closes cannot loop forever.
const MAX_DAYS = 3 * 365;

export function dayDiff(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Daily burn at a weight, interpolated linearly between the two anchors. */
export function burnAt(weight: number, [a, b]: [BurnAnchor, BurnAnchor]): number {
  if (a.weight === b.weight) return a.kcal;
  const t = (weight - a.weight) / (b.weight - a.weight);
  return a.kcal + t * (b.kcal - a.kcal);
}

/**
 * Walk forward one day at a time from `start` until the goal is reached.
 * The deficit shrinks as the weight drops, so the line flattens on its own.
 * The last point is clamped to the goal so every scenario ends on the line.
 */
export function project(start: WeightPoint, model: ProjectionModel): WeightPoint[] {
  const points: WeightPoint[] = [start];
  let weight = start.value;
  for (let day = 1; weight > model.goal && day <= MAX_DAYS; day++) {
    const deficit = burnAt(weight, model.burn) - model.intake;
    if (deficit <= 0) break;
    weight = Math.max(weight - (model.adherence * deficit) / KCAL_PER_KG, model.goal);
    points.push({ date: addDays(start.date, day), value: weight });
  }
  return points;
}

/** Projected value on a date, or null when the date is off the series. */
export function valueOn(series: WeightPoint[], date: string): number | null {
  const index = dayDiff(series[0].date, date);
  return index >= 0 && index < series.length ? series[index].value : null;
}
