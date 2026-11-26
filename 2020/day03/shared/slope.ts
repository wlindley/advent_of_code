function assertSafeIntAtLeast(value: number, min: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new RangeError(`${name} must be a safe integer >= ${min}, got ${value}`);
  }
  return value;
}

/** Immutable toboggan trajectory step delta `(right, down)`. */
export class Slope {
  readonly #right: number;
  readonly #down: number;

  constructor(right: number, down: number) {
    this.#right = assertSafeIntAtLeast(right, 0, 'right');
    this.#down = assertSafeIntAtLeast(down, 1, 'down');
    Object.freeze(this);
  }

  get right(): number {
    return this.#right;
  }

  get down(): number {
    return this.#down;
  }

  get label(): string {
    return `Right ${this.#right}, Down ${this.#down}`;
  }

  stepCountForRows(rows: number): number {
    const validRows = assertSafeIntAtLeast(rows, 1, 'rows');
    return Math.floor((validRows - 1) / this.#down);
  }
}

/** Immutable single landing point after `(0, 0)` along a `Slope`. */
export class LandingStep {
  readonly #stepIndex: number;
  readonly #slope: Slope;
  readonly #forestCols: number;
  readonly #isTree: boolean;

  constructor(stepIndex: number, slope: Slope, forestCols: number, isTree: boolean) {
    this.#stepIndex = assertSafeIntAtLeast(stepIndex, 1, 'stepIndex');
    this.#forestCols = assertSafeIntAtLeast(forestCols, 1, 'forestCols');
    if (!Number.isSafeInteger(stepIndex * slope.right) || !Number.isSafeInteger(stepIndex * slope.down)) {
      throw new RangeError(`Landing coordinates overflow safe integers at step ${stepIndex}`);
    }
    this.#slope = slope;
    this.#isTree = isTree;
    Object.freeze(this);
  }

  get stepIndex(): number {
    return this.#stepIndex;
  }

  get slope(): Slope {
    return this.#slope;
  }

  get row(): number {
    return this.#stepIndex * this.#slope.down;
  }

  get col(): number {
    return this.#stepIndex * this.#slope.right;
  }

  get wrappedCol(): number {
    return this.col % this.#forestCols;
  }

  get tileRepeat(): number {
    return Math.floor(this.col / this.#forestCols);
  }

  get isTree(): boolean {
    return this.#isTree;
  }
}

export const PART1_SLOPES: readonly Slope[] = Object.freeze([new Slope(3, 1)]);

export const PART2_SLOPES: readonly Slope[] = Object.freeze([
  new Slope(1, 1),
  new Slope(3, 1),
  new Slope(5, 1),
  new Slope(7, 1),
  new Slope(1, 2),
]);

/** Validates a non-empty slope list and returns a frozen defensive copy. */
export function validateSlopes(slopes: readonly Slope[]): readonly Slope[] {
  if (slopes.length === 0) {
    throw new RangeError('At least one slope is required');
  }
  return Object.freeze(slopes.slice());
}
