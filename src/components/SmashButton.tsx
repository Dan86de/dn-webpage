import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createSound, type Sound } from "@/lib/sound";

/**
 * The cheer button on the habits page: a big desk buzzer in brand orange,
 * drawn as stacked ellipses so the dome sinks into its housing on press.
 *
 * Smashes are counted optimistically and flushed to /api/smash on a debounce,
 * so hammering it fires one request, not thirty. The visitor's own tally is
 * kept in localStorage for the copy; the server keeps its own for the cap.
 */

const STORAGE_KEY = "smash:habits";
const MUTE_KEY = "smash:muted";
// Four cartoon impacts packed into one file, 300ms each.
const SOUND_URL = "/audio/smash-hits.mp3";
const SOUND_SLICES = 4;
const FLUSH_DELAY_MS = 700;
const DEFAULT_CAP = 16;

const WORDS = [
  "SMASH!",
  "POW!",
  "BAM!",
  "BOOM!",
  "WHAM!",
  "KAPOW!",
  "ZAP!",
  "OOF!",
  "THWACK!",
  "JEB!",
  "SLAP!",
];

// The buzzer is a physical object, so its colours are literal rather than
// theme tokens: it should look like the same object in light and dark, the
// way a photo of it would.
const DOME_LIT = "oklch(84% 0.13 55)";
const DOME_MID = "oklch(70% 0.204 41)";
const DOME_RIM = "oklch(55% 0.175 36)";
const DOME_EDGE = "oklch(47% 0.155 34)";
const DOME_SIDE = "oklch(41% 0.13 36)";
const BASE_LIT = "oklch(41% 0.012 60)";
const BASE_DIM = "oklch(27% 0.008 60)";
const BASE_SIDE = "oklch(20% 0.006 60)";
const WELL = "oklch(17% 0.005 60)";

const VB_W = 320;
const VB_H = 315;
const STAGE_W = 360;
const STAGE_H = 285;
// The dome starts well down the viewBox; crop the dead band above it.
const VB_Y = 52;

/*
 * Geometry, in viewBox units. Every horizontal circle on a real object shares
 * one squash ratio at a given viewing angle, so the housing ellipses and the
 * dome's rim all use ry/rx ~ 0.45: looking down on the desk at roughly 40
 * degrees, which is the angle those buzzers get photographed at.
 */
const CX = 160;
const RIM_Y = 160; // where the dome meets its housing
const DOME_RX = 118;
const DOME_RY = 53; // the rim ellipse, i.e. the viewing angle
const DOME_BULGE = 90; // how far the dome rises above that rim

const BASE_RX = 152;
const BASE_RY = 68;
const BASE_TOP_Y = 186;
const BASE_WALL = 34;

const PRESS_TOP = 18;
const PRESS_SKIRT = 7;
const HOVER_LIFT = 5;

/*
 * Timing, after Josh Comeau's 3D button. A real button goes down the instant
 * you touch it and comes back slowly, so the press and the release get very
 * different curves. The release bezier ends above 1 on purpose: it overshoots.
 */
const BOUNCE = [0.3, 0.7, 0.4, 1.5] as const;
const PRESS_IN = { duration: 0.034 };

/** A dome: arc over the top, then back along the front of its rim. */
const DOME_PATH = [
  `M${CX - DOME_RX},${RIM_Y}`,
  `A${DOME_RX},${DOME_BULGE} 0 0 1 ${CX + DOME_RX},${RIM_Y}`,
  `A${DOME_RX},${DOME_RY} 0 0 1 ${CX - DOME_RX},${RIM_Y}`,
  "Z",
].join(" ");

type Burst = { id: number; word: string; x: number; y: number; tilt: number };

const BALLOON_W = 232;
const BALLOON_H = 148;
const INK = "oklch(16% 0.02 40)";
const BALLOON_FILL = "oklch(88% 0.115 66)";

/*
 * Timing for the hit, from the animations.dev playbook: a comic impact slams
 * in oversized and snaps down rather than growing from nothing, holds just
 * long enough to read, then leaves faster than it arrived. Each hit is its own
 * element, so rapid smashing overlaps hits instead of restarting one.
 */
const SLAM_IN = [0.19, 1, 0.22, 1] as const; // ease-out-expo
const HIT_DURATION = 0.46;
const HIT_TIMES = [0, 0.24, 0.6, 1];

/** A hand-inked burst balloon: uneven spikes, uneven spacing. */
function balloonPoints(seed: number, spikes = 13) {
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const isTip = i % 2 === 0;
    // Cheap deterministic noise, so a balloon never reshuffles mid-animation
    // but no two of them are quite the same shape.
    const noise = (((i + 1) * 9301 + seed * 49297) % 233280) / 233280;
    const radius = isTip ? 0.84 + noise * 0.16 : 0.44 + noise * 0.14;
    const angle =
      (Math.PI * i) / spikes - Math.PI / 2 + (noise - 0.5) * 0.18;
    points.push(
      `${(BALLOON_W / 2 + Math.cos(angle) * radius * (BALLOON_W / 2)).toFixed(1)},` +
        `${(BALLOON_H / 2 + Math.sin(angle) * radius * (BALLOON_H / 2)).toFixed(1)}`,
    );
  }
  return points.join(" ");
}

const formatCount = (value: number) => value.toLocaleString("en-US");

export default function SmashButton() {
  const reduced = useReducedMotion();

  const [total, setTotal] = useState<number | null>(null);
  const [cap, setCap] = useState(DEFAULT_CAP);
  const [mine, setMine] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [shake, setShake] = useState(0);
  const [muted, setMuted] = useState(false);
  const [announced, setAnnounced] = useState("");

  const sound = useRef<Sound | null>(null);
  const pending = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const maxed = mine >= cap;

  /** Send whatever has piled up since the last flush. */
  const flush = useCallback(async () => {
    const delta = pending.current;
    if (!delta) return;
    pending.current = 0;

    try {
      const response = await fetch("/api/smash", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        total: number;
        mine: number;
        cap: number;
      };
      // Anything smashed while the request was in flight is not in the
      // server's number yet, so add it back on top.
      setTotal(data.total + pending.current);
      setCap(data.cap);
      setMine(Math.min(data.cap, data.mine + pending.current));
      setAnnounced(`${formatCount(data.total)} smashes`);
    } catch {
      // A dropped smash is not worth telling anyone about.
    }
  }, []);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Number.isFinite(stored) && stored > 0) setMine(stored);
    setMuted(localStorage.getItem(MUTE_KEY) === "1");
    sound.current = createSound(SOUND_URL, { volume: 0.5, slices: SOUND_SLICES });

    let cancelled = false;
    fetch("/api/smash")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setTotal(data.total);
        setCap(data.cap ?? DEFAULT_CAP);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mine > 0) localStorage.setItem(STORAGE_KEY, String(mine));
  }, [mine]);

  // Leaving the page mid-flush should still count. sendBeacon survives the
  // navigation in a way fetch does not.
  useEffect(() => {
    const onHide = () => {
      const delta = pending.current;
      if (!delta) return;
      pending.current = 0;
      navigator.sendBeacon?.(
        "/api/smash",
        new Blob([JSON.stringify({ delta })], { type: "application/json" }),
      );
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      onHide();
    };
  }, []);

  function smash() {
    if (maxed) {
      setShake((n) => n + 1);
      // A dull thud for a smash that goes nowhere.
      if (!muted) sound.current?.play(0.7);
      return;
    }

    // The pitch climbs as the combo builds, then settles once it is capped out.
    if (!muted) sound.current?.play(0.92 + Math.min(mine, 12) * 0.028);

    setMine((n) => n + 1);
    setTotal((n) => (n === null ? n : n + 1));
    pending.current += 1;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, FLUSH_DELAY_MS);

    if (!reduced) {
      const id = nextId.current++;
      setBursts((current) => [
        // Bigger than the old flying words, so fewer of them can stack up.
        ...current.slice(-3),
        {
          id,
          word: WORDS[id % WORDS.length],
          // Stamped around the dome, jittered so repeat hits never land
          // exactly on top of each other.
          x: -46 + Math.random() * 92,
          y: -96 + Math.random() * 46,
          tilt: -13 + Math.random() * 26,
        },
      ]);
    }
  }

  // The press is an affordance rather than decoration, so it survives reduced
  // motion; only the overshoot, the hover lift and the confetti drop away.
  const lift = pressed ? PRESS_TOP : hovered && !reduced ? -HOVER_LIFT : 0;
  const sink = pressed;
  const spring = reduced
    ? { duration: 0.1 }
    : pressed
      ? PRESS_IN
      : { duration: hovered ? 0.25 : 0.6, ease: BOUNCE };

  const label = maxed
    ? "You have maxed out this button"
    : total === null
      ? "Smash the cheer button"
      : `Smash the cheer button. ${formatCount(total)} smashes so far`;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative grid place-items-center"
        style={{ width: STAGE_W, height: STAGE_H }}
      >
        <motion.button
          type="button"
          onClick={smash}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerEnter={() => {
            setHovered(true);
            if (!muted) sound.current?.prime();
          }}
          onFocus={() => {
            if (!muted) sound.current?.prime();
          }}
          onPointerLeave={() => {
            setPressed(false);
            setHovered(false);
          }}
          onPointerCancel={() => setPressed(false)}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") setPressed(true);
          }}
          onKeyUp={() => setPressed(false)}
          onBlur={() => setPressed(false)}
          aria-label={label}
          className="relative cursor-pointer touch-manipulation select-none rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500"
          style={{ WebkitTapHighlightColor: "transparent" }}
          animate={shake && !reduced ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.32 }}
        >
          <svg
            viewBox={`0 ${VB_Y} ${VB_W} ${VB_H - VB_Y}`}
            width={VB_W}
            height={VB_H - VB_Y}
            aria-hidden="true"
            className="block max-w-full"
            style={{
              filter: hovered && !reduced ? "brightness(1.07)" : "none",
              transition: "filter 250ms",
            }}
          >
            <defs>
              <radialGradient id="smash-dome" cx="30%" cy="16%" r="88%">
                <stop offset="0%" style={{ stopColor: DOME_LIT }} />
                <stop offset="42%" style={{ stopColor: DOME_MID }} />
                <stop offset="86%" style={{ stopColor: DOME_RIM }} />
                <stop offset="100%" style={{ stopColor: DOME_EDGE }} />
              </radialGradient>
              <linearGradient id="smash-base" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: BASE_LIT }} />
                <stop offset="100%" style={{ stopColor: BASE_DIM }} />
              </linearGradient>
              {/* Across the wall, not down it: this is what rounds the side. */}
              <linearGradient id="smash-wall" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" style={{ stopColor: BASE_SIDE }} />
                <stop offset="34%" style={{ stopColor: BASE_DIM }} />
                <stop offset="70%" style={{ stopColor: BASE_SIDE }} />
                <stop offset="100%" style={{ stopColor: "oklch(14% 0.004 60)" }} />
              </linearGradient>
              <filter
                id="smash-cast"
                x="-20%"
                y="-80%"
                width="140%"
                height="260%"
              >
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <filter
                id="smash-gloss"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="11" />
              </filter>
            </defs>

            {/* Ground shadow. */}
            <motion.ellipse
              cx={CX}
              cy={BASE_TOP_Y + BASE_WALL + BASE_RY - 8}
              rx={BASE_RX - 8}
              filter="url(#smash-cast)"
              initial={false}
              animate={{ ry: 17 - lift / 4, opacity: 0.26 - lift / 260 }}
              transition={spring}
              style={{ fill: "var(--color-black)" }}
            />

            {/* Housing: side wall, top face, then the well the dome sits in. */}
            <ellipse
              cx={CX}
              cy={BASE_TOP_Y + BASE_WALL}
              rx={BASE_RX}
              ry={BASE_RY}
              fill="url(#smash-wall)"
            />
            <rect
              x={CX - BASE_RX}
              y={BASE_TOP_Y}
              width={BASE_RX * 2}
              height={BASE_WALL}
              fill="url(#smash-wall)"
            />
            <ellipse
              cx={CX}
              cy={BASE_TOP_Y}
              rx={BASE_RX}
              ry={BASE_RY}
              fill="url(#smash-base)"
              // A faint rim light so the housing still separates from the
              // page on the dark theme.
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
            <ellipse cx={CX} cy={BASE_TOP_Y} rx={124} ry={56} fill={WELL} />

            {/* The skirt of the dome compresses a little under the press... */}
            <motion.ellipse
              cx={CX}
              rx={DOME_RX}
              ry={DOME_RY}
              fill={DOME_SIDE}
              initial={false}
              animate={{ cy: RIM_Y + 9 + (sink ? PRESS_SKIRT : lift / 2) }}
              transition={spring}
            />

            {/* ...while the dome itself travels the full distance. */}
            <motion.g
              initial={false}
              animate={{ y: lift }}
              transition={spring}
              style={{ willChange: "transform" }}
            >
              <path d={DOME_PATH} fill="url(#smash-dome)" />
              <ellipse
                cx={110}
                cy={104}
                rx={52}
                ry={30}
                transform="rotate(-20 110 104)"
                filter="url(#smash-gloss)"
                style={{ fill: "var(--color-white)", opacity: 0.38 }}
              />
            </motion.g>
          </svg>
        </motion.button>

        {/* The hit: slams in over the dome, then it is gone. */}
        <AnimatePresence>
          {bursts.map((burst) => {
            // Longer words get a smaller face so every one fills the balloon.
            const fontSize = Math.min(40, 216 / burst.word.length);
            return (
              <motion.svg
                key={burst.id}
                width={BALLOON_W}
                height={BALLOON_H}
                viewBox={`0 0 ${BALLOON_W} ${BALLOON_H}`}
                className="pointer-events-none absolute"
                style={{ overflow: "visible", left: "50%", top: "50%" }}
                aria-hidden="true"
                initial={{
                  scale: 1.55,
                  opacity: 0,
                  x: burst.x - BALLOON_W / 2,
                  y: burst.y - BALLOON_H / 2,
                  rotate: burst.tilt * 1.7,
                }}
                animate={{
                  scale: [1.55, 1, 1, 1.14],
                  opacity: [0, 1, 1, 0],
                  rotate: [burst.tilt * 1.7, burst.tilt, burst.tilt, burst.tilt],
                }}
                transition={{
                  duration: HIT_DURATION,
                  times: HIT_TIMES,
                  ease: [SLAM_IN, "linear", "easeOut"],
                }}
                onAnimationComplete={() =>
                  setBursts((current) =>
                    current.filter((item) => item.id !== burst.id),
                  )
                }
              >
                <polygon
                  points={balloonPoints(burst.id)}
                  fill={BALLOON_FILL}
                  stroke={INK}
                  strokeWidth={5}
                  strokeLinejoin="round"
                />
                <text
                  x={BALLOON_W / 2}
                  y={BALLOON_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fill: "var(--color-white)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize,
                    letterSpacing: "0.01em",
                    paintOrder: "stroke fill",
                    stroke: INK,
                    strokeWidth: 5,
                    strokeLinejoin: "round",
                  }}
                >
                  {burst.word}
                </text>
              </motion.svg>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="text-center">
        <span
          className="font-display text-3xl font-medium tabular-nums"
          aria-hidden="true"
        >
          {total === null ? "···" : formatCount(total)}
        </span>
        <span className="caption text-gray-1000 ml-1.5" aria-hidden="true">
          smashes
        </span>
      </p>
      <p className="caption text-gray-1000 mt-1.5 flex items-center gap-2 text-center">
        <span>
          {maxed
            ? `You gave all ${cap}. Respect.`
            : mine > 0
              ? `You gave ${mine} of ${cap}`
              : "Go on, it counts"}
        </span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            localStorage.setItem(MUTE_KEY, next ? "1" : "0");
            if (!next) sound.current?.play(1);
          }}
          aria-pressed={muted}
          className="hover:text-gray-1200 cursor-pointer uppercase underline decoration-dotted underline-offset-4"
        >
          {muted ? "Sound off" : "Sound on"}
        </button>
      </p>

      <span className="sr-only" role="status">
        {announced}
      </span>
    </div>
  );
}
