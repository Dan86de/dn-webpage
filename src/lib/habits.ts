/**
 * Pure date helpers for the habit tracker.
 * All dates are ISO day strings (YYYY-MM-DD) to avoid timezone drift.
 */

const TIME_ZONE = "Europe/Warsaw";
const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEKS = 53;

export type DayCell = {
  date: string;
  done: boolean;
  isFuture: boolean;
  isToday: boolean;
};

export type MonthLabel = {
  label: string;
  column: number;
};

export type Stat = { label: string; value: number; unit: string };

/** Today's date as YYYY-MM-DD in the site's home timezone. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

function toUTC(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toISO(new Date(toUTC(iso).getTime() + days * DAY_MS));
}

/** ISO weekday, Monday = 0 ... Sunday = 6. */
export function weekdayIndex(iso: string): number {
  return (toUTC(iso).getUTCDay() + 6) % 7;
}

export function formatLong(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUTC(iso));
}

/**
 * A rolling year of weeks ending on the current week (Monday-first).
 * Returns `WEEKS` columns of 7 cells each, oldest first.
 */
export function buildWeeks(days: string[], today: string): DayCell[][] {
  const done = new Set(days);
  const endOfWeek = addDays(today, 6 - weekdayIndex(today));
  const start = addDays(endOfWeek, -(WEEKS * 7 - 1));

  const weeks: DayCell[][] = [];
  let cursor = start;
  for (let w = 0; w < WEEKS; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        date: cursor,
        done: done.has(cursor),
        isFuture: cursor > today,
        isToday: cursor === today,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Month labels for the columns whose Monday starts a new month. */
export function monthLabels(weeks: DayCell[][]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let previousMonth = weeks[0][0].date.slice(0, 7);

  weeks.forEach((week, column) => {
    const month = week[0].date.slice(0, 7);
    if (month === previousMonth) return;
    previousMonth = month;
    labels.push({
      label: new Intl.DateTimeFormat("en-GB", {
        month: "short",
        timeZone: "UTC",
      }).format(toUTC(week[0].date)),
      column,
    });
  });

  // Drop a label that would collide with the next one (short first month).
  return labels.filter(
    (label, i) => i === labels.length - 1 || labels[i + 1].column - label.column >= 3,
  );
}

function countBetween(days: string[], from: string, to: string): number {
  return days.filter((d) => d >= from && d <= to).length;
}

function windowStats(days: string[], today: string): Stat[] {
  return [
    {
      label: "Last 30",
      value: countBetween(days, addDays(today, -29), today),
      unit: "/ 30",
    },
    {
      label: "Year",
      value: countBetween(days, addDays(today, -364), today),
      unit: "days",
    },
  ];
}

/** Stats for a daily habit: day streaks plus rolling windows. */
export function dailyStats(days: string[], today: string): Stat[] {
  const done = new Set(days);

  let currentStreak = 0;
  // A streak is still alive if today is not logged yet, so start at yesterday
  // when today is missing.
  let cursor = done.has(today) ? today : addDays(today, -1);
  while (done.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  let longestStreak = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of [...done].sort()) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = day;
  }

  return [
    { label: "Streak", value: currentStreak, unit: "days" },
    { label: "Best", value: longestStreak, unit: "days" },
    ...windowStats(days, today),
  ];
}

/**
 * Stats for a habit with a weekly target: progress this week and how many
 * consecutive weeks (Monday to Sunday) hit the target.
 */
export function weeklyStats(
  days: string[],
  today: string,
  target: number,
): Stat[] {
  const weekStart = addDays(today, -weekdayIndex(today));
  const thisWeek = countBetween(days, weekStart, today);

  let weekStreak = 0;
  // The current week only counts once it is already on target.
  let cursor = thisWeek >= target ? weekStart : addDays(weekStart, -7);
  while (countBetween(days, cursor, addDays(cursor, 6)) >= target) {
    weekStreak++;
    cursor = addDays(cursor, -7);
  }

  return [
    { label: "This week", value: thisWeek, unit: `/ ${target}` },
    { label: "Weeks on target", value: weekStreak, unit: "in a row" },
    ...windowStats(days, today),
  ];
}
