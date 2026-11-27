export const MAX_TARGET_COORD = 100_000;

const TARGET_PATTERN = /^target area:\s*x=(-?\d+)\.\.(-?\d+),\s*y=(-?\d+)\.\.(-?\d+)$/;

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${name} must be a finite integer, got ${value}`);
  }
}

/** Validated immutable rectangular submarine trench target region. */
export class TargetArea {
  constructor(
    readonly xMin: number,
    readonly xMax: number,
    readonly yMin: number,
    readonly yMax: number,
  ) {
    assertInteger(xMin, 'xMin');
    assertInteger(xMax, 'xMax');
    assertInteger(yMin, 'yMin');
    assertInteger(yMax, 'yMax');
    if (xMin < 1 || xMin > xMax || xMax > MAX_TARGET_COORD) {
      throw new RangeError(`Invalid x target bounds [${xMin}..${xMax}]`);
    }
    if (yMin < -MAX_TARGET_COORD || yMin > yMax || yMax > -1) {
      throw new RangeError(`Invalid y target bounds [${yMin}..${yMax}]`);
    }
    Object.freeze(this);
  }

  /** Number of integer x-columns inside the target area. */
  get width(): number {
    return this.xMax - this.xMin + 1;
  }

  /** Number of integer y-rows inside the target area. */
  get height(): number {
    return this.yMax - this.yMin + 1;
  }

  /** Smallest forward x-velocity whose triangular stopping distance reaches xMin. */
  get minFeasibleVx(): number {
    let vx = 1;
    while ((vx * (vx + 1)) / 2 < this.xMin) {
      vx += 1;
    }
    return vx;
  }

  /** Highest y-velocity that hits yMin on its next step after returning to y = 0. */
  get maxFeasibleVy(): number {
    return -this.yMin - 1;
  }

  /** Maximum step index at which any valid launch can still reside inside the target. */
  get maxStep(): number {
    return -2 * this.yMin;
  }

  /** Returns true when (x, y) lies inclusively inside the target rectangle. */
  contains(x: number, y: number): boolean {
    return x >= this.xMin && x <= this.xMax && y >= this.yMin && y <= this.yMax;
  }
}

/** Parses and validates a puzzle target area specification string. */
export function parseTargetArea(raw: string): TargetArea {
  const match = TARGET_PATTERN.exec(raw.trim());
  if (!match) {
    throw new Error('Invalid target area input: expected "target area: x=min..max, y=min..max"');
  }
  return new TargetArea(
    Number(match[1]!),
    Number(match[2]!),
    Number(match[3]!),
    Number(match[4]!),
  );
}
