import { GridBounds, GridPoint } from '../motionPlan';
import type { RopeTraceFrame } from '../simulation';

export const GRIDLINE_MAX_SPAN = 40;

export interface CanvasPoint {
  readonly x: number;
  readonly y: number;
}

export interface CumulativeTailIndex {
  readonly cells: readonly GridPoint[];
  readonly prefixEnds: readonly number[];
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number, got ${value}`);
  }
  return value;
}

/** Pure Y-up lattice-to-canvas projection with zero stored derived state. */
export class RopeViewport {
  readonly bounds: GridBounds;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly paddingPx: number;

  constructor(bounds: GridBounds, widthPx: number, heightPx: number, paddingPx: number) {
    this.bounds = bounds;
    this.widthPx = requirePositiveFinite(widthPx, 'widthPx');
    this.heightPx = requirePositiveFinite(heightPx, 'heightPx');
    if (!Number.isFinite(paddingPx) || paddingPx < 0) {
      throw new RangeError(`paddingPx must be a non-negative finite number, got ${paddingPx}`);
    }
    if (this.widthPx <= paddingPx * 2 || this.heightPx <= paddingPx * 2) {
      throw new RangeError('Viewport dimensions must exceed twice paddingPx');
    }
    this.paddingPx = paddingPx;
    Object.freeze(this);
  }

  get cellSize(): number {
    return Math.min(
      (this.widthPx - 2 * this.paddingPx) / this.bounds.width,
      (this.heightPx - 2 * this.paddingPx) / this.bounds.height,
    );
  }

  get showGridlines(): boolean {
    return this.bounds.width <= GRIDLINE_MAX_SPAN && this.bounds.height <= GRIDLINE_MAX_SPAN;
  }

  cellCenter(point: GridPoint): CanvasPoint {
    const size = this.cellSize;
    const originX = (this.widthPx - this.bounds.width * size) / 2;
    const originY = (this.heightPx - this.bounds.height * size) / 2;
    return Object.freeze({
      x: originX + (point.x - this.bounds.minX + 0.5) * size,
      y: originY + (this.bounds.maxY - point.y + 0.5) * size,
    });
  }
}

/** Flattens uniquely visited tail cells and prefix end offsets in O(uniqueTailCells). */
export function buildCumulativeTailIndex(frames: readonly RopeTraceFrame[]): CumulativeTailIndex {
  const cells: GridPoint[] = [];
  const prefixEnds: number[] = [];
  for (const frame of frames) {
    for (const cell of frame.newlyVisitedTailCells) {
      cells.push(cell);
    }
    prefixEnds.push(cells.length);
  }
  return Object.freeze({
    cells: Object.freeze(cells),
    prefixEnds: Object.freeze(prefixEnds),
  });
}
