import type { VentBounds, VentSegment } from './types';

export const MAX_DENSE_GRID_CELLS = 4_000_000;
export type CoverageMode = 'dense' | 'sparse';

export interface CoverageObserver {
  onOverlap(x: number, y: number): void;
  onIntense(x: number, y: number): void;
}

export const NOOP_COVERAGE_OBSERVER: CoverageObserver = Object.freeze({
  onOverlap: () => {},
  onIntense: () => {},
});

export interface CoverageAccumulator {
  readonly mode: CoverageMode;
  readonly bounds: VentBounds;
  readonly coveredCount: number;
  readonly overlapCount: number;
  readonly intenseCount: number;
  readonly maxDepth: number;
  addSegment(segment: VentSegment): void;
}

/** Shared transition accounting for dense and sparse vent coverage maps. */
export abstract class BaseCoverageAccumulator implements CoverageAccumulator {
  abstract readonly mode: CoverageMode;
  readonly bounds: VentBounds;
  private readonly observer: CoverageObserver;
  private _coveredCount = 0;
  private _overlapCount = 0;
  private _intenseCount = 0;
  private _maxDepth = 0;

  constructor(bounds: VentBounds, observer: CoverageObserver) {
    this.bounds = bounds;
    this.observer = observer;
  }

  get coveredCount(): number { return this._coveredCount; }
  get overlapCount(): number { return this._overlapCount; }
  get intenseCount(): number { return this._intenseCount; }
  get maxDepth(): number { return this._maxDepth; }

  protected assertWithinBounds(segment: VentSegment): void {
    if (!this.bounds.contains(segment.start) || !this.bounds.contains(segment.end)) {
      throw new RangeError('Segment endpoint outside accumulator bounds');
    }
  }

  protected recordTransition(x: number, y: number, nextDepth: number): void {
    if (nextDepth === 1) this._coveredCount += 1;
    else if (nextDepth === 2) {
      this._overlapCount += 1;
      this.observer.onOverlap(x, y);
    } else if (nextDepth === 3) {
      this._intenseCount += 1;
      this.observer.onIntense(x, y);
    }
    if (nextDepth > this._maxDepth) this._maxDepth = nextDepth;
  }

  abstract addSegment(segment: VentSegment): void;
}

/** Dense flat Uint32Array coverage grid with O(1) linear-stride rasterization. */
export class DenseCoverageAccumulator extends BaseCoverageAccumulator {
  readonly mode: CoverageMode = 'dense';
  private readonly width: number;
  private readonly cells: Uint32Array;

  constructor(bounds: VentBounds, observer: CoverageObserver) {
    super(bounds, observer);
    this.width = Number(bounds.width);
    this.cells = new Uint32Array(Number(bounds.area));
  }

  addSegment(segment: VentSegment): void {
    this.assertWithinBounds(segment);
    const count = segment.pointCount;
    const sx = segment.stepX;
    const sy = segment.stepY;
    const stride = sy * this.width + sx;
    let x = segment.start.x;
    let y = segment.start.y;
    let idx = (y - this.bounds.minY) * this.width + (x - this.bounds.minX);
    for (let i = 0; i < count; i += 1) {
      const next = this.cells[idx]! + 1;
      this.cells[idx] = next;
      this.recordTransition(x, y, next);
      x += sx;
      y += sy;
      idx += stride;
    }
  }
}

/** Sparse Map coverage tracker for bounding boxes exceeding dense cell budget. */
export class SparseCoverageAccumulator extends BaseCoverageAccumulator {
  readonly mode: CoverageMode = 'sparse';
  private readonly counts = new Map<string, number>();

  addSegment(segment: VentSegment): void {
    this.assertWithinBounds(segment);
    const count = segment.pointCount;
    const sx = segment.stepX;
    const sy = segment.stepY;
    let x = segment.start.x;
    let y = segment.start.y;
    for (let i = 0; i < count; i += 1) {
      const key = `${x},${y}`;
      const prev = this.counts.get(key);
      const next = prev === undefined ? 1 : prev + 1;
      this.counts.set(key, next);
      this.recordTransition(x, y, next);
      x += sx;
      y += sy;
    }
  }
}

/** Selects dense Uint32Array or sparse Map coverage accumulator from bounds area. */
export function createCoverageAccumulator(
  bounds: VentBounds,
  maxDenseCells: number,
  observer: CoverageObserver,
): CoverageAccumulator {
  if (!Number.isSafeInteger(maxDenseCells) || maxDenseCells < 1) {
    throw new RangeError(`maxDenseCells must be a positive safe integer, got ${maxDenseCells}`);
  }
  return bounds.area <= BigInt(maxDenseCells)
    ? new DenseCoverageAccumulator(bounds, observer)
    : new SparseCoverageAccumulator(bounds, observer);
}
