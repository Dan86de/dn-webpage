import { useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  dayDiff,
  addDays,
  project,
  valueOn,
  type ProjectionModel,
  type WeightPoint,
} from "@/lib/weight";

export type { WeightPoint };

type Props = {
  points: WeightPoint[];
  unit: string;
  projection?: ProjectionModel;
};

const WIDTH = 600;
const HEIGHT = 200;
const PAD_Y = 16;

// Fast spring while following the cursor, a slower one for the reset.
type Spring = { type: "spring"; stiffness: number; damping: number };
const FOLLOW_SPRING: Spring = { type: "spring", stiffness: 100, damping: 18 };
const RESET_SPRING: Spring = { type: "spring", stiffness: 100, damping: 40 };

function formatDate(iso: string, withYear = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Smooth line through the points as cubic beziers (Catmull-Rom). */
function smoothPath(coords: [number, number][]): string {
  if (coords.length === 1) {
    const [x, y] = coords[0];
    return `M${x} ${y} L${x} ${y}`;
  }
  let d = `M${coords[0][0]} ${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function polyline(coords: [number, number][]): string {
  return coords.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
}

type Hover =
  | { kind: "reading"; point: WeightPoint }
  | { kind: "projected"; point: WeightPoint };

export default function WeightChart({ points, unit, projection }: Props) {
  const [hovered, setHovered] = useState<Hover | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);

  // Percentage clipped from the right. 0 = full graph, the resting state.
  const clip = useMotionValue(0);
  const clipPath = useMotionTemplate`inset(0px ${clip}% 0px 0px)`;

  function moveClipTo(target: number, spring: Spring) {
    animationRef.current?.stop();
    animationRef.current = animate(clip, target, spring);
  }

  const first = points[0];
  const last = points[points.length - 1];
  // The projection is a fixed target line from the first reading, so the gap
  // between it and the readings shows whether the plan is ahead or behind.
  const projected = projection ? project(first, projection) : null;
  const arrival = projected ? projected[projected.length - 1] : last;
  const reachesGoal = !!projection && arrival.value <= projection.goal;
  const planNow = projected
    ? (valueOn(projected, last.date) ?? projection!.goal)
    : null;

  // Time on x: from the first reading to the end of the projection, or the
  // latest reading if that came later.
  const endDate = last.date > arrival.date ? last.date : arrival.date;
  const totalDays = dayDiff(first.date, endDate) || 1;
  const x = (date: string) => (dayDiff(first.date, date) / totalDays) * WIDTH;

  const values = points.map((p) => p.value);
  if (projection) values.push(projection.goal);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const y = (value: number) =>
    PAD_Y + (1 - (value - min) / span) * (HEIGHT - PAD_Y * 2);
  const toCoords = (ps: WeightPoint[]): [number, number][] =>
    ps.map((p) => [x(p.date), y(p.value)]);

  const line = smoothPath(toCoords(points));
  const area = `${line} L${x(last.date)} ${HEIGHT} L0 ${HEIGHT} Z`;

  const change = last.value - first.value;

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fromRight = Math.max(rect.right - e.clientX, 0);
    moveClipTo(Math.min((fromRight / rect.width) * 100, 100), FOLLOW_SPRING);

    const ratio = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1,
    );
    const date = addDays(first.date, Math.round(ratio * totalDays));
    const value =
      date > last.date && projected ? valueOn(projected, date) : null;

    if (value !== null) {
      setHovered({ kind: "projected", point: { date, value } });
      return;
    }
    // Nearest reading by date, the log can skip days.
    let nearest = points[0];
    for (const p of points) {
      if (
        Math.abs(dayDiff(p.date, date)) < Math.abs(dayDiff(nearest.date, date))
      ) {
        nearest = p;
      }
    }
    setHovered({ kind: "reading", point: nearest });
  }

  function onPointerEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function onPointerLeave() {
    setHovered(null);
    timeoutRef.current = setTimeout(() => moveClipTo(0, RESET_SPRING), 1000);
  }

  // Headline: the reading for the hovered (or latest) day next to what the
  // projection said for that day. Past the last reading only the projection
  // exists.
  const reading =
    hovered?.kind === "projected" ? null : (hovered?.point ?? last);
  const projectedShown =
    hovered?.kind === "projected"
      ? hovered.point
      : projected && reading
        ? {
            date: reading.date,
            value: valueOn(projected, reading.date) ?? projection!.goal,
          }
        : null;

  // Green when the reading beats the projection, red when it is above it.
  const readingTone =
    reading && projectedShown
      ? reading.value < projectedShown.value
        ? "text-green-500"
        : reading.value > projectedShown.value
          ? "text-red-500"
          : ""
      : "";

  const unitTag = <span className="caption text-gray-1000 ml-0.5">{unit}</span>;
  const numberClass =
    "font-display font-medium text-2xl leading-8 tabular-nums";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex gap-6 tablet:gap-8 whitespace-nowrap">
          {reading && (
            <div>
              <p className="caption text-gray-1000">
                {hovered ? formatDate(reading.date, true) : "Current"}
              </p>
              <p className={`${numberClass} ${readingTone}`}>
                {reading.value.toFixed(1)}
                {unitTag}
              </p>
            </div>
          )}
          {projectedShown && (
            <div>
              <p className="caption text-gray-1000">
                {reading
                  ? "Projected"
                  : `Projected, ${formatDate(projectedShown.date, true)}`}
              </p>
              <p className={numberClass}>
                {projectedShown.value.toFixed(1)}
                {unitTag}
              </p>
            </div>
          )}
        </div>
        <dl className="flex flex-wrap gap-x-6 tablet:gap-x-8 gap-y-4 whitespace-nowrap">
          <div>
            <dt className="caption text-gray-1000">
              Since {formatDate(first.date)}
            </dt>
            <dd className={numberClass}>
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}
              {unitTag}
            </dd>
          </div>
          {projection && planNow !== null ? (
            <>
              <div>
                <dt className="caption text-gray-1000">Vs projection</dt>
                <dd className={numberClass}>
                  {last.value - planNow > 0 ? "+" : ""}
                  {(last.value - planNow).toFixed(1)}
                  {unitTag}
                </dd>
              </div>
              <div>
                <dt className="caption text-gray-1000">
                  {projection.goal} {unit}, projected
                </dt>
                <dd className={numberClass}>
                  {reachesGoal ? formatDate(arrival.date) : "Never"}
                  {reachesGoal && (
                    <span className="caption text-gray-1000 ml-1">
                      {arrival.date.slice(0, 4)}
                    </span>
                  )}
                </dd>
              </div>
            </>
          ) : (
            <div>
              <dt className="caption text-gray-1000">Low</dt>
              <dd className={numberClass}>
                {min.toFixed(1)}
                {unitTag}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div
        className="mt-5 touch-pan-y select-none"
        onPointerMove={onPointerMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <div className="relative">
          {/* The goal line stays put; the readings and projection reveal on hover. */}
          {projection && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="none"
              className="absolute inset-0 block size-full"
              aria-hidden="true"
            >
              <path
                d={`M0 ${y(projection.goal)} L${WIDTH} ${y(projection.goal)}`}
                fill="none"
                strokeWidth={1}
                strokeDasharray="2 4"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: "var(--color-gray-800)" }}
              />
            </svg>
          )}

          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
            className="relative block w-full h-32 tablet:h-48"
            style={{ clipPath }}
            role="img"
            aria-label={
              projection && reachesGoal
                ? `Weight over time, ${first.value} to ${last.value} ${unit}, projected to reach ${projection.goal} ${unit} around ${formatDate(arrival.date, true)}`
                : `Weight over time, ${first.value} to ${last.value} ${unit}`
            }
          >
            <defs>
              <linearGradient id="weight-fill" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0"
                  style={{
                    stopColor: "var(--color-orange-500)",
                    stopOpacity: 0.35,
                  }}
                />
                <stop
                  offset="1"
                  style={{
                    stopColor: "var(--color-orange-500)",
                    stopOpacity: 0,
                  }}
                />
              </linearGradient>
            </defs>
            {projected && (
              <path
                d={polyline(toCoords(projected))}
                fill="none"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray="5 6"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: "var(--color-gray-900)" }}
              />
            )}
            <path d={area} fill="url(#weight-fill)" />
            <path
              d={line}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ stroke: "var(--color-orange-500)" }}
            />
          </motion.svg>

          {projection && (
            <>
              {/* Latest reading, in HTML so the non-uniform SVG scale cannot squash it. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 ring-2 ring-gray-100"
                style={{
                  left: `${(x(last.date) / WIDTH) * 100}%`,
                  top: `${(y(last.value) / HEIGHT) * 100}%`,
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0 caption text-gray-1000 -translate-y-full pb-1"
                style={{ top: `${(y(projection.goal) / HEIGHT) * 100}%` }}
              >
                {projection.goal} {unit}
              </span>
            </>
          )}
        </div>

        <div className="mt-2 flex justify-between caption text-gray-1000">
          <span>{formatDate(first.date, true)}</span>
          <span>{formatDate(endDate, true)}</span>
        </div>
      </div>
    </div>
  );
}
