import type { PocketDimensionCount } from './policies';

/** 0 = inactive, 1 = surviving, 2 = born, 3 = dying. */
export type CellVisualState = 0 | 1 | 2 | 3;

export interface LatticeEnvelope {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
  readonly zMin: number;
  readonly zMax: number;
  readonly wMin: number;
  readonly wMax: number;
}

function countState(cells: Uint8Array, target: CellVisualState): number {
  let count = 0;
  for (const v of cells) {
    if (v === target) count += 1;
  }
  return count;
}

/** Immutable snapshot of a single (z, w) plane with cycle-transition diff states. */
export class PocketSliceSnapshot {
  readonly z: number;
  readonly w: number;
  readonly xMin: number;
  readonly yMin: number;
  readonly width: number;
  readonly height: number;
  readonly #cells: Uint8Array;

  constructor(
    z: number,
    w: number,
    xMin: number,
    yMin: number,
    width: number,
    height: number,
    cells: Uint8Array,
  ) {
    if (!Number.isInteger(width) || width < 1) {
      throw new RangeError(`width must be an integer >= 1, got ${width}`);
    }
    if (!Number.isInteger(height) || height < 1) {
      throw new RangeError(`height must be an integer >= 1, got ${height}`);
    }
    if (cells.length !== width * height) {
      throw new RangeError(`cells length (${cells.length}) must equal ${width * height}`);
    }
    this.z = z;
    this.w = w;
    this.xMin = xMin;
    this.yMin = yMin;
    this.width = width;
    this.height = height;
    this.#cells = new Uint8Array(cells);
    Object.freeze(this);
  }

  stateAt(col: number, row: number): CellVisualState {
    if (!Number.isInteger(col) || col < 0 || col >= this.width) {
      throw new RangeError(`col (${col}) out of bounds [0, ${this.width - 1}]`);
    }
    if (!Number.isInteger(row) || row < 0 || row >= this.height) {
      throw new RangeError(`row (${row}) out of bounds [0, ${this.height - 1}]`);
    }
    return this.#cells[row * this.width + col]! as CellVisualState;
  }

  get survivingCount(): number {
    return countState(this.#cells, 1);
  }

  get bornCount(): number {
    return countState(this.#cells, 2);
  }

  get dyingCount(): number {
    return countState(this.#cells, 3);
  }

  get activeCount(): number {
    return this.survivingCount + this.bornCount;
  }
}

function sumSliceMetric(
  slices: readonly PocketSliceSnapshot[],
  pick: (slice: PocketSliceSnapshot) => number,
): number {
  let total = 0;
  for (const slice of slices) {
    total += pick(slice);
  }
  return total;
}

/** Immutable cycle frame collecting all non-empty (plus z=0,w=0) plane snapshots. */
export class PocketCycleTraceFrame {
  readonly cycle: number;
  readonly totalCycles: number;
  readonly dimensions: PocketDimensionCount;
  readonly bounds: LatticeEnvelope;
  readonly slices: readonly PocketSliceSnapshot[];

  constructor(
    cycle: number,
    totalCycles: number,
    dimensions: PocketDimensionCount,
    bounds: LatticeEnvelope,
    slices: readonly PocketSliceSnapshot[],
  ) {
    this.cycle = cycle;
    this.totalCycles = totalCycles;
    this.dimensions = dimensions;
    this.bounds = Object.freeze({ ...bounds });
    this.slices = Object.freeze([...slices]);
    Object.freeze(this);
  }

  get survivingCount(): number {
    return sumSliceMetric(this.slices, (s) => s.survivingCount);
  }

  get bornCount(): number {
    return sumSliceMetric(this.slices, (s) => s.bornCount);
  }

  get dyingCount(): number {
    return sumSliceMetric(this.slices, (s) => s.dyingCount);
  }

  get activeCount(): number {
    return sumSliceMetric(this.slices, (s) => s.activeCount);
  }

  get wValues(): readonly number[] {
    return Object.freeze(
      Array.from(new Set(this.slices.map((s) => s.w))).sort((a, b) => a - b),
    );
  }

  slicesForW(w: number): readonly PocketSliceSnapshot[] {
    return Object.freeze(this.slices.filter((s) => s.w === w));
  }
}
