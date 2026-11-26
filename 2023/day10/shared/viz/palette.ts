/** High-contrast light-mode colors aligned with root `site/styles.css` tokens. */
export const PALETTE = Object.freeze({
  bg: '#f6f8fa',
  surface: '#ffffff',
  border: '#d0d7de',
  text: '#1f2328',
  muted: '#59636e',
  clutter: '#9aa4b2',
  accent: '#0969da',
  ok: '#1a7f37',
  gold: '#9a6700',
  enclosedFill: 'rgba(26, 127, 55, 0.22)',
  scanLine: 'rgba(9, 105, 218, 0.14)',
});

type Rgb = readonly [number, number, number];
const STOP_START: Rgb = [9, 105, 218];
const STOP_MID: Rgb = [26, 127, 55];
const STOP_END: Rgb = [154, 103, 0];

function lerpRgb(a: Rgb, b: Rgb, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Maps normalized loop distance `[0, 1]` to a high-contrast accent -> ok -> gold ramp. */
export function distanceColor(ratio: number): string {
  const clamped = Math.min(1, Math.max(0, ratio));
  return clamped <= 0.5
    ? lerpRgb(STOP_START, STOP_MID, clamped * 2)
    : lerpRgb(STOP_MID, STOP_END, (clamped - 0.5) * 2);
}
