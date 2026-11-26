/** Light-mode neutral RGB color used for free disk blocks. */
export const FREE_COLOR_RGB: readonly [number, number, number] = Object.freeze([234, 238, 242]);

const LIGHTNESS = 0.42;
const CHROMA = 0.72 * LIGHTNESS;

function hslChannel(hue: number, offset: number): number {
  const k = (offset + hue / 30) % 12;
  const value = LIGHTNESS - CHROMA * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  return Math.round(value * 255);
}

/** Maps a file ID (`>= 0`) or free sentinel (`< 0`) to a deterministic `[r, g, b]` triple. */
export function fileColorRgb(fileId: number): readonly [number, number, number] {
  if (fileId < 0) return FREE_COLOR_RGB;
  const hue = (fileId * 137.508) % 360;
  return [hslChannel(hue, 0), hslChannel(hue, 8), hslChannel(hue, 4)];
}

/** Formats the deterministic palette color for `fileId` as a CSS `rgb(...)` string. */
export function fileColorCss(fileId: number): string {
  const [r, g, b] = fileColorRgb(fileId);
  return `rgb(${r}, ${g}, ${b})`;
}
