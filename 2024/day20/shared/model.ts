export const UNREACHABLE = -1;

function assertIntAtLeast(value: number, min: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new RangeError(`${label} must be an integer >= ${min}, got ${value}`);
  }
}

/** Validated cheat search parameters: maximum cheat Manhattan span and minimum picosecond saving. */
export class CheatConfig {
  readonly maxDuration: number;
  readonly minSaving: number;

  constructor(maxDuration: number, minSaving: number) {
    assertIntAtLeast(maxDuration, 2, 'maxDuration');
    assertIntAtLeast(minSaving, 1, 'minSaving');
    this.maxDuration = maxDuration;
    this.minSaving = minSaving;
    Object.freeze(this);
  }
}

export const PART1_DEFAULT_CONFIG = new CheatConfig(2, 100);
export const PART1_EXAMPLE_CONFIG = new CheatConfig(2, 2);
export const PART2_DEFAULT_CONFIG = new CheatConfig(20, 100);
export const PART2_EXAMPLE_CONFIG = new CheatConfig(20, 50);

/** Immutable non-negative integer grid coordinate `(row, col)`. */
export class GridPoint {
  readonly row: number;
  readonly col: number;

  constructor(row: number, col: number) {
    assertIntAtLeast(row, 0, 'row');
    assertIntAtLeast(col, 0, 'col');
    this.row = row;
    this.col = col;
    Object.freeze(this);
  }

  manhattanTo(other: GridPoint): number {
    return Math.abs(this.row - other.row) + Math.abs(this.col - other.col);
  }
}

/** Immutable cheat jump between two track cells with a positive picosecond saving. */
export class Cheat {
  readonly start: GridPoint;
  readonly end: GridPoint;
  readonly saving: number;

  constructor(start: GridPoint, end: GridPoint, saving: number) {
    assertIntAtLeast(saving, 1, 'saving');
    if (start.manhattanTo(end) < 2) {
      throw new RangeError('Cheat endpoints must have Manhattan distance >= 2');
    }
    this.start = start;
    this.end = end;
    this.saving = saving;
    Object.freeze(this);
  }

  get duration(): number {
    return this.start.manhattanTo(this.end);
  }
}

/** Immutable rectangular racetrack grid with start `S`, end `E`, and binary wall mask. */
export class Racetrack {
  readonly rows: number;
  readonly cols: number;
  readonly start: GridPoint;
  readonly end: GridPoint;
  private readonly wallMask: Uint8Array;

  constructor(rows: number, cols: number, start: GridPoint, end: GridPoint, wallMask: Uint8Array) {
    assertIntAtLeast(rows, 1, 'rows');
    assertIntAtLeast(cols, 1, 'cols');
    if (wallMask.length !== rows * cols) {
      throw new RangeError(`Expected ${rows * cols} wallMask entries, got ${wallMask.length}`);
    }
    this.rows = rows;
    this.cols = cols;
    this.start = start;
    this.end = end;
    // Defensive copy of caller buffer; never freeze TypedArrays (TypeError in strict mode).
    this.wallMask = wallMask.slice();
    if (this.isWall(start.row, start.col)) {
      throw new Error('Start cell cannot be a wall');
    }
    if (this.isWall(end.row, end.col)) {
      throw new Error('End cell cannot be a wall');
    }
    Object.freeze(this);
  }

  get cellCount(): number {
    return this.rows * this.cols;
  }

  get startIndex(): number {
    return this.start.row * this.cols + this.start.col;
  }

  get endIndex(): number {
    return this.end.row * this.cols + this.end.col;
  }

  inBounds(row: number, col: number): boolean {
    return (
      Number.isSafeInteger(row) &&
      Number.isSafeInteger(col) &&
      row >= 0 &&
      row < this.rows &&
      col >= 0 &&
      col < this.cols
    );
  }

  indexOf(row: number, col: number): number {
    if (!this.inBounds(row, col)) {
      throw new RangeError(`Coordinate (${row}, ${col}) out of bounds for ${this.rows}x${this.cols}`);
    }
    return row * this.cols + col;
  }

  pointAt(index: number): GridPoint {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.cellCount) {
      throw new RangeError(`Cell index ${index} out of bounds for ${this.cellCount} cells`);
    }
    const col = index % this.cols;
    return new GridPoint((index - col) / this.cols, col);
  }

  isWall(row: number, col: number): boolean {
    return this.wallMask[this.indexOf(row, col)]! !== 0;
  }

  copyWallMask(): Uint8Array {
    return this.wallMask.slice();
  }
}
