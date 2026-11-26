/** Immutable 2D integer vector backed by arbitrary-precision `bigint` coordinates. */
export class Vector2D {
  readonly x: bigint;
  readonly y: bigint;

  constructor(x: bigint, y: bigint) {
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }

  /** 2D determinant / cross product `this.x * other.y - this.y * other.x`. */
  cross(other: Vector2D): bigint {
    return this.x * other.y - this.y * other.x;
  }

  /** Shifts both coordinates uniformly by `offset`. */
  translate(offset: bigint): Vector2D {
    return new Vector2D(this.x + offset, this.y + offset);
  }
}

/** Rule configuration parameterizing prize coordinate shift and optional per-button press cap. */
export class ClawConfig {
  readonly prizeOffset: bigint;
  readonly maxPresses: bigint | null;

  constructor(prizeOffset: bigint, maxPresses: bigint | null) {
    if (prizeOffset < 0n) {
      throw new RangeError(`prizeOffset must be non-negative, got ${prizeOffset}`);
    }
    if (maxPresses !== null && maxPresses < 0n) {
      throw new RangeError(`maxPresses must be non-negative or null, got ${maxPresses}`);
    }
    this.prizeOffset = prizeOffset;
    this.maxPresses = maxPresses;
    Object.freeze(this);
  }
}

/** Valid non-negative button press counts for a winnable claw machine. */
export class ClawSolution {
  readonly pressesA: bigint;
  readonly pressesB: bigint;

  constructor(pressesA: bigint, pressesB: bigint) {
    if (pressesA < 0n || pressesB < 0n) {
      throw new RangeError(`Press counts must be non-negative, got (${pressesA}, ${pressesB})`);
    }
    this.pressesA = pressesA;
    this.pressesB = pressesB;
    Object.freeze(this);
  }

  /** Total token cost (`3 * pressesA + pressesB`), derived dynamically from source counts. */
  get tokens(): bigint {
    return 3n * this.pressesA + this.pressesB;
  }
}

/** Structural reason why a claw machine cannot be won under a given configuration. */
export type UnwinnableReason =
  | 'off-ray'
  | 'non-integer'
  | 'negative-presses'
  | 'exceeds-press-limit';

/** Result of solving a single claw machine: either a minimum-cost solution or a failure reason. */
export type MachineOutcome =
  | { readonly winnable: true; readonly solution: ClawSolution }
  | { readonly winnable: false; readonly reason: UnwinnableReason };
