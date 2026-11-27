import type { AsteroidPoint } from './geometry';

/** Pure SVG coordinate layout for an asteroid field grid. */
export interface GridLayout {
  readonly width: number;
  readonly height: number;
  readonly cellSize: number;
  readonly padding: number;
  readonly svgWidth: number;
  readonly svgHeight: number;
  readonly asteroidRadius: number;
}

/** 2D SVG pixel center coordinates for an asteroid cell. */
export interface SvgCenter {
  readonly x: number;
  readonly y: number;
}

function assertPositiveDimension(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
}

/** Computes bounded SVG grid metrics from field dimensions `(width, height)`. */
export function computeGridLayout(width: number, height: number): GridLayout {
  assertPositiveDimension(width, 'width');
  assertPositiveDimension(height, 'height');
  const maxDim = Math.max(width, height);
  const cellSize = Math.max(10, Math.min(34, Math.floor(460 / maxDim)));
  const padding = 16;
  const svgWidth = padding * 2 + width * cellSize;
  const svgHeight = padding * 2 + height * cellSize;
  const asteroidRadius = Math.max(3, Math.floor(cellSize * 0.34));
  return Object.freeze({
    width,
    height,
    cellSize,
    padding,
    svgWidth,
    svgHeight,
    asteroidRadius,
  });
}

/** Maps a visibility count to a light-mode CSS variable color band. */
export function computeVisibilityColorBand(
  detected: number,
  minDetected: number,
  maxDetected: number,
  isBest: boolean,
): string {
  if (isBest) return 'var(--gold)';
  if (maxDetected <= minDetected) return 'var(--accent)';
  const ratio = (detected - minDetected) / (maxDetected - minDetected);
  if (ratio >= 0.75) return 'var(--ok)';
  if (ratio >= 0.4) return 'var(--accent)';
  return 'var(--muted)';
}

/** Returns the SVG pixel center for an `AsteroidPoint` inside `layout`. */
export function pointCenter(point: AsteroidPoint, layout: GridLayout): SvgCenter {
  return Object.freeze({
    x: layout.padding + (point.x + 0.5) * layout.cellSize,
    y: layout.padding + (point.y + 0.5) * layout.cellSize,
  });
}
