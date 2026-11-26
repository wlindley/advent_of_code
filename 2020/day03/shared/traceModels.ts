import { LandingStep, Slope } from './slope';

function assertSafeIntInRange(value: number, min: number, max: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a safe integer in [${min}, ${max}], got ${value}`);
  }
  return value;
}

/** Immutable cumulative progress for one slope at a single trace row. */
export class SlopeProgress {
  readonly #slope: Slope;
  readonly #stepsCompleted: number;
  readonly #treeCount: number;
  readonly #activeLanding: LandingStep | null;

  constructor(
    slope: Slope,
    stepsCompleted: number,
    treeCount: number,
    activeLanding: LandingStep | null,
  ) {
    const validSteps = assertSafeIntInRange(stepsCompleted, 0, Number.MAX_SAFE_INTEGER, 'stepsCompleted');
    const validTrees = assertSafeIntInRange(treeCount, 0, validSteps, 'treeCount');
    if (activeLanding !== null) {
      if (activeLanding.slope !== slope) {
        throw new RangeError(`Active landing slope ${activeLanding.slope.label} does not match ${slope.label}`);
      }
      if (activeLanding.stepIndex !== validSteps) {
        throw new RangeError(`Active landing stepIndex ${activeLanding.stepIndex} must equal ${validSteps}`);
      }
    }
    this.#slope = slope;
    this.#stepsCompleted = validSteps;
    this.#treeCount = validTrees;
    this.#activeLanding = activeLanding;
    Object.freeze(this);
  }

  get slope(): Slope {
    return this.#slope;
  }

  get stepsCompleted(): number {
    return this.#stepsCompleted;
  }

  get treeCount(): number {
    return this.#treeCount;
  }

  get openCount(): number {
    return this.#stepsCompleted - this.#treeCount;
  }

  get activeLanding(): LandingStep | null {
    return this.#activeLanding;
  }
}

/** Immutable snapshot across all tracked slopes at one forest row. */
export class TrajectoryTraceFrame {
  readonly #row: number;
  readonly #totalRows: number;
  readonly #slopes: readonly SlopeProgress[];

  constructor(row: number, totalRows: number, slopes: readonly SlopeProgress[]) {
    const validTotal = assertSafeIntInRange(totalRows, 1, Number.MAX_SAFE_INTEGER, 'totalRows');
    const validRow = assertSafeIntInRange(row, 0, validTotal - 1, 'row');
    if (slopes.length === 0) {
      throw new RangeError('TrajectoryTraceFrame requires at least one SlopeProgress');
    }
    for (let i = 0; i < slopes.length; i += 1) {
      const landing = slopes[i]!.activeLanding;
      if (landing !== null && landing.row !== validRow) {
        throw new RangeError(`Active landing row ${landing.row} does not match frame row ${validRow}`);
      }
    }
    this.#row = validRow;
    this.#totalRows = validTotal;
    this.#slopes = Object.freeze(slopes.slice());
    Object.freeze(this);
  }

  get row(): number {
    return this.#row;
  }

  get totalRows(): number {
    return this.#totalRows;
  }

  get slopes(): readonly SlopeProgress[] {
    return this.#slopes;
  }

  get treeProduct(): bigint {
    let product = 1n;
    for (let i = 0; i < this.#slopes.length; i += 1) {
      product *= BigInt(this.#slopes[i]!.treeCount);
    }
    return product;
  }
}
