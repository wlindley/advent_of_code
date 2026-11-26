import { IMPASSABLE_HEIGHT, MAX_HEIGHT } from '../index';

// Light-mode hypsometric ramp: slate barrier (-1), cool valley (0..3), warm ridge (4..8), summit gold (9).
const ELEVATION_COLORS: readonly string[] = Object.freeze([
  '#d0d7de',
  '#dcefe2',
  '#bfe2cb',
  '#a0d3b2',
  '#cbe09e',
  '#ede49f',
  '#f4d18b',
  '#f2b678',
  '#e7946e',
  '#d8736a',
  '#fde68a',
]);

/** High-contrast light-mode overlay colors for trailhead, basin, and summit markers. */
export const TRAIL_OVERLAY_COLORS = Object.freeze({
  trailhead: '#0969da',
  reachableFill: 'rgba(9, 105, 218, 0.24)',
  reachableStroke: '#0969da',
  peakFill: '#9a6700',
  peakStroke: '#1f2328',
  labelInk: '#1f2328',
  badgeBg: '#ffffff',
});

/** Maps a cell elevation (`-1` impassable or `0..9`) to its light-mode hex color. */
export function elevationColor(height: number): string {
  if (!Number.isInteger(height) || height < IMPASSABLE_HEIGHT || height > MAX_HEIGHT) {
    throw new RangeError(
      `Elevation must be an integer in [${IMPASSABLE_HEIGHT}, ${MAX_HEIGHT}], got ${height}`,
    );
  }
  return ELEVATION_COLORS[height + 1]!;
}
