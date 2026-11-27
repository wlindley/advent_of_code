/** Valid single-character navigation actions from AoC 2020 Day 12. */
export type NavigationAction = 'N' | 'S' | 'E' | 'W' | 'L' | 'R' | 'F';

/** Clockwise quarter-turn count modulo 4. */
export type QuarterTurn = 0 | 1 | 2 | 3;

const INSTRUCTION_PATTERN = /^([NSEWLRF])(\d+)$/;

/** Returns the non-negative magnitude of a BigInt integer. */
export function absBigInt(n: bigint): bigint {
  return n < 0n ? -n : n;
}

/** Immutable 2D BigInt vector in (east, north) ship coordinates. */
export class Vec2 {
  static readonly ORIGIN = new Vec2(0n, 0n);

  readonly east: bigint;
  readonly north: bigint;

  constructor(east: bigint, north: bigint) {
    this.east = east;
    this.north = north;
    Object.freeze(this);
  }

  /** L1 (Manhattan) norm |east| + |north|. */
  get manhattanNorm(): bigint {
    return absBigInt(this.east) + absBigInt(this.north);
  }

  /** Returns the vector sum `this + other`. */
  add(other: Vec2): Vec2 {
    return new Vec2(this.east + other.east, this.north + other.north);
  }

  /** Returns the scaled vector `this * factor`. */
  scale(factor: bigint): Vec2 {
    return new Vec2(this.east * factor, this.north * factor);
  }

  /** Rotates this vector clockwise by `turns` 90-degree increments. */
  rotateCw(turns: QuarterTurn): Vec2 {
    const coords: readonly [
      readonly [bigint, bigint],
      readonly [bigint, bigint],
      readonly [bigint, bigint],
      readonly [bigint, bigint],
    ] = [
      [this.east, this.north],
      [this.north, -this.east],
      [-this.east, -this.north],
      [-this.north, this.east],
    ];
    const [east, north] = coords[turns];
    return new Vec2(east, north);
  }
}

/** Validated immutable navigation instruction. */
export class NavigationInstruction {
  readonly action: NavigationAction;
  readonly value: bigint;

  constructor(action: NavigationAction, value: bigint) {
    if (value < 0n) {
      throw new RangeError(`Instruction value must be non-negative, got ${value}`);
    }
    if ((action === 'L' || action === 'R') && value % 90n !== 0n) {
      throw new RangeError(`Turn angle for ${action} must be a multiple of 90, got ${value}`);
    }
    this.action = action;
    this.value = value;
    Object.freeze(this);
  }

  /** Compact instruction label (e.g. `F10`, `L90`). */
  get label(): string {
    return `${this.action}${this.value}`;
  }
}

/** Immutable ship position and active vector (heading or waypoint) snapshot. */
export class ShipState {
  readonly position: Vec2;
  readonly vector: Vec2;

  constructor(position: Vec2, vector: Vec2) {
    this.position = position;
    this.vector = vector;
    Object.freeze(this);
  }

  /** Creates an initial state at the origin with the supplied vector. */
  static initial(vector: Vec2): ShipState {
    return new ShipState(Vec2.ORIGIN, vector);
  }

  /** Returns a new state with an updated ship position. */
  withPosition(position: Vec2): ShipState {
    return new ShipState(position, this.vector);
  }

  /** Returns a new state with an updated active vector. */
  withVector(vector: Vec2): ShipState {
    return new ShipState(this.position, vector);
  }

  /** Manhattan distance from the origin. */
  get manhattanDistance(): bigint {
    return this.position.manhattanNorm;
  }
}

function parseInstructionLine(rawLine: string, lineNumber: number): NavigationInstruction {
  const match = INSTRUCTION_PATTERN.exec(rawLine.trim());
  if (!match) {
    throw new Error(`Invalid navigation instruction on line ${lineNumber}: "${rawLine}"`);
  }
  return new NavigationInstruction(match[1]! as NavigationAction, BigInt(match[2]!));
}

/** Parses raw puzzle text into a frozen list of validated navigation instructions. */
export function parseNavigationInstructions(raw: string): readonly NavigationInstruction[] {
  const trimmed = raw.trim();
  if (trimmed === '') {
    throw new Error('Navigation input must not be empty');
  }
  const lines = trimmed.split(/\r?\n/);
  return Object.freeze(lines.map((line, index) => parseInstructionLine(line, index + 1)));
}
