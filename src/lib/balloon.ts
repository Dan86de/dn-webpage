/**
 * A hand-inked comic burst balloon as SVG polygon points: uneven spikes,
 * uneven spacing. Shared by the smash button's hits and the betting slip's
 * PAID! / BUSTED! stamp.
 *
 * The noise is deterministic per seed, so a balloon never reshuffles
 * mid-animation but no two seeds are quite the same shape.
 */
export function balloonPoints(
  seed: number,
  width: number,
  height: number,
  spikes = 13,
): string {
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const isTip = i % 2 === 0;
    const noise = (((i + 1) * 9301 + seed * 49297) % 233280) / 233280;
    const radius = isTip ? 0.84 + noise * 0.16 : 0.44 + noise * 0.14;
    const angle = (Math.PI * i) / spikes - Math.PI / 2 + (noise - 0.5) * 0.18;
    points.push(
      `${(width / 2 + Math.cos(angle) * radius * (width / 2)).toFixed(1)},` +
        `${(height / 2 + Math.sin(angle) * radius * (height / 2)).toFixed(1)}`,
    );
  }
  return points.join(" ");
}
