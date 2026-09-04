import { useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  type AnimationPlaybackControls,
} from "motion/react";

export type WeightPoint = { date: string; value: number };

type Props = {
  points: WeightPoint[];
  unit: string;
};

const WIDTH = 600;
const HEIGHT = 200;
const PAD_Y = 16;

// Fast spring while following the cursor, a slower one for the reset.
type Spring = { type: "spring"; stiffness: number; damping: number };
const FOLLOW_SPRING: Spring = { type: "spring", stiffness: 100, damping: 18 };
const RESET_SPRING: Spring = { type: "spring", stiffness: 100, damping: 40 };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** Smooth line through the points as cubic beziers (Catmull-Rom). */
function linePath(coords: [number, number][]): string {
  if (coords.length === 1) {
    const [, y] = coords[0];
    return `M0 ${y} L${WIDTH} ${y}`;
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

export default function WeightChart({ points, unit }: Props) {
  const [hovered, setHovered] = useState<WeightPoint | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);

  // Percentage clipped from the right. 0 = full graph, the resting state.
  const clip = useMotionValue(0);
  const clipPath = useMotionTemplate`inset(0px ${clip}% 0px 0px)`;

  function moveClipTo(target: number, spring: Spring) {
    animationRef.current?.stop();
    animationRef.current = animate(clip, target, spring);
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords: [number, number][] = points.map((p, i) => [
    points.length === 1 ? WIDTH / 2 : (i / (points.length - 1)) * WIDTH,
    PAD_Y + (1 - (p.value - min) / span) * (HEIGHT - PAD_Y * 2),
  ]);

  const line = linePath(coords);
  const area = `${line} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const shown = hovered ?? last;
  const change = last.value - first.value;

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const fromRight = Math.max(rect.right - e.clientX, 0);
    moveClipTo(Math.min((fromRight / rect.width) * 100, 100), FOLLOW_SPRING);

    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const index = Math.round(ratio * (points.length - 1));
    setHovered(points[index]);
  }

  function onPointerEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function onPointerLeave() {
    setHovered(null);
    timeoutRef.current = setTimeout(() => moveClipTo(0, RESET_SPRING), 1000);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="whitespace-nowrap">
          <p className="caption text-gray-1000">
            {hovered ? formatDate(shown.date) : "Current"}
          </p>
          <p className="font-display font-medium text-2xl leading-8 tabular-nums">
            {shown.value.toFixed(1)}
            <span className="caption text-gray-1000 ml-0.5">{unit}</span>
          </p>
        </div>
        <dl className="flex gap-6 tablet:gap-8 whitespace-nowrap">
          <div>
            <dt className="caption text-gray-1000">Since {formatDate(first.date)}</dt>
            <dd className="font-display font-medium text-2xl leading-8 tabular-nums">
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}
              <span className="caption text-gray-1000 ml-0.5">{unit}</span>
            </dd>
          </div>
          <div>
            <dt className="caption text-gray-1000">Low</dt>
            <dd className="font-display font-medium text-2xl leading-8 tabular-nums">
              {min.toFixed(1)}
              <span className="caption text-gray-1000 ml-0.5">{unit}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div
        className="mt-5 touch-pan-y select-none"
        onPointerMove={onPointerMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="block w-full h-32 tablet:h-48"
          style={{ clipPath }}
          role="img"
          aria-label={`Weight over time, ${first.value} to ${last.value} ${unit}`}
        >
          <defs>
            <linearGradient id="weight-fill" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0"
                style={{ stopColor: "var(--color-orange-500)", stopOpacity: 0.35 }}
              />
              <stop
                offset="1"
                style={{ stopColor: "var(--color-orange-500)", stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>
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
        <div className="mt-2 flex justify-between caption text-gray-1000">
          <span>{formatDate(first.date)}</span>
          <span>{formatDate(last.date)}</span>
        </div>
      </div>
    </div>
  );
}
