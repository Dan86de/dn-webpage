/** Labels for the betting islands. Times are local Warsaw "YYYY-MM-DDTHH:MM". */
import { formatLong } from "@/lib/habits";

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

export const fmt = (value: number) => value.toLocaleString("en-US");

/** "2026-09-13T20:00" -> "Sun 20:00" */
export function weekdayTime(local: string): string {
  const [day, time] = local.split("T");
  return `${WEEKDAY.format(new Date(`${day}T00:00:00Z`))} ${time}`;
}

/** "2026-09-11T14:32" -> "Fri 11 Sept 2026 · 14:32" */
export function longTime(local: string): string {
  const [day, time] = local.split("T");
  return `${formatLong(day).replace(",", "")} · ${time}`;
}
