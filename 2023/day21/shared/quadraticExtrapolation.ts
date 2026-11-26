/** Exact bigint Newton forward-difference quadratic sequence y(k) from samples y(0), y(1), y(2). */
export class QuadraticProgression {
  readonly y0: bigint;
  readonly y1: bigint;
  readonly y2: bigint;

  constructor(y0: bigint, y1: bigint, y2: bigint) {
    this.y0 = y0;
    this.y1 = y1;
    this.y2 = y2;
    Object.freeze(this);
  }

  get firstDifference(): bigint {
    return this.y1 - this.y0;
  }

  get secondDifference(): bigint {
    return this.y2 - 2n * this.y1 + this.y0;
  }

  evaluate(k: bigint): bigint {
    if (k < 0n) {
      throw new RangeError(`k must be non-negative, got ${k}`);
    }
    return this.y0 + k * this.firstDifference + ((k * (k - 1n)) / 2n) * this.secondDifference;
  }

  matchesSample(k: bigint, expected: bigint): boolean {
    return this.evaluate(k) === expected;
  }
}
