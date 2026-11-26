export type NumericKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'A';
export type MoveDirection = '^' | 'v' | '<' | '>';
export type DirectionalKey = MoveDirection | 'A';

export const PART1_DIRECTIONAL_ROBOTS = 2;
export const PART2_DIRECTIONAL_ROBOTS = 25;

export const NUMERIC_KEYS: readonly NumericKey[] = Object.freeze([
  '7', '8', '9', '4', '5', '6', '1', '2', '3', '0', 'A',
]);

export const DIRECTIONAL_KEYS: readonly DirectionalKey[] = Object.freeze([
  '^', 'A', '<', 'v', '>',
]);

/** Immutable integer grid coordinate (allows negative offsets for deltas). */
export class GridCoord {
  readonly row: number;
  readonly col: number;

  constructor(row: number, col: number) {
    if (!Number.isSafeInteger(row) || !Number.isSafeInteger(col)) {
      throw new RangeError(`GridCoord requires safe integers, got (${row}, ${col})`);
    }
    this.row = row;
    this.col = col;
    Object.freeze(this);
  }

  equals(other: GridCoord): boolean {
    return this.row === other.row && this.col === other.col;
  }
}

export const DIRECTION_DELTAS: Readonly<Record<MoveDirection, GridCoord>> = Object.freeze({
  '^': new GridCoord(-1, 0),
  'v': new GridCoord(1, 0),
  '<': new GridCoord(0, -1),
  '>': new GridCoord(0, 1),
});

/** Validated door code matching digits followed by 'A'. */
export class DoorCode {
  readonly raw: string;

  constructor(raw: string) {
    if (!/^\d+A$/.test(raw)) {
      throw new RangeError(`Invalid door code: "${raw}"`);
    }
    this.raw = raw;
    Object.freeze(this);
  }

  get numericValue(): bigint {
    return BigInt(this.raw.slice(0, -1));
  }

  get keys(): readonly NumericKey[] {
    return Object.freeze([...this.raw] as NumericKey[]);
  }
}

/** Configuration specifying how many directional robot keypads sit between human and numeric pad. */
export class KeypadConfig {
  readonly directionalRobots: number;

  constructor(directionalRobots: number) {
    if (!Number.isSafeInteger(directionalRobots) || directionalRobots < 0) {
      throw new RangeError(`directionalRobots must be a non-negative integer, got ${directionalRobots}`);
    }
    this.directionalRobots = directionalRobots;
    Object.freeze(this);
  }
}

/** Shortest human command length and derived complexity for a single door code. */
export class CodeComplexity {
  readonly code: DoorCode;
  readonly shortestLength: bigint;

  constructor(code: DoorCode, shortestLength: bigint) {
    if (shortestLength < 1n) {
      throw new RangeError(`shortestLength must be >= 1n, got ${shortestLength}`);
    }
    this.code = code;
    this.shortestLength = shortestLength;
    Object.freeze(this);
  }

  get complexity(): bigint {
    return this.code.numericValue * this.shortestLength;
  }
}

/** Aggregate result for a list of door codes under a given KeypadConfig. */
export class ChainSolveResult {
  readonly config: KeypadConfig;
  readonly entries: readonly CodeComplexity[];

  constructor(config: KeypadConfig, entries: readonly CodeComplexity[]) {
    this.config = config;
    this.entries = Object.freeze([...entries]);
    Object.freeze(this);
  }

  get totalComplexity(): bigint {
    let total = 0n;
    for (const entry of this.entries) {
      total += entry.complexity;
    }
    return total;
  }
}
