import { euclideanMod } from '../../../shared/core';

function assertPositiveSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
}

function assertInBoundsIndex(value: number, limit: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value >= limit) {
    throw new RangeError(`${label} must be an integer in [0, ${limit}), got ${value}`);
  }
}

/** Immutable parsed garden grid with start coordinate and rock bitmask. */
export class GardenMap {
  readonly width: number;
  readonly height: number;
  readonly startRow: number;
  readonly startCol: number;
  private readonly rocks: Uint8Array;

  constructor(width: number, height: number, startRow: number, startCol: number, rocks: Uint8Array) {
    assertPositiveSafeInt(width, 'width');
    assertPositiveSafeInt(height, 'height');
    assertInBoundsIndex(startRow, height, 'startRow');
    assertInBoundsIndex(startCol, width, 'startCol');
    if (rocks.length !== width * height) {
      throw new RangeError(`rocks length ${rocks.length} must equal ${width * height}`);
    }
    if (rocks[startRow * width + startCol] !== 0) {
      throw new RangeError('Start cell cannot be a rock');
    }
    this.width = width;
    this.height = height;
    this.startRow = startRow;
    this.startCol = startCol;
    this.rocks = new Uint8Array(rocks);
    Object.freeze(this);
  }

  get size(): number {
    return this.width * this.height;
  }

  inBounds(row: number, col: number): boolean {
    return (
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      row >= 0 &&
      row < this.height &&
      col >= 0 &&
      col < this.width
    );
  }

  isRock(row: number, col: number): boolean {
    if (!this.inBounds(row, col)) {
      throw new RangeError(`Cell (${row}, ${col}) is out of bounds`);
    }
    return this.rocks[row * this.width + col] !== 0;
  }

  isRockWrapped(row: number, col: number): boolean {
    const r = euclideanMod(row, this.height);
    const c = euclideanMod(col, this.width);
    return this.rocks[r * this.width + c] !== 0;
  }

  hasClearCardinalCross(): boolean {
    for (let col = 0; col < this.width; col += 1) {
      if (this.isRock(this.startRow, col)) return false;
    }
    for (let row = 0; row < this.height; row += 1) {
      if (this.isRock(row, this.startCol)) return false;
    }
    return true;
  }

  hasClearOuterBorder(): boolean {
    for (let col = 0; col < this.width; col += 1) {
      if (this.isRock(0, col) || this.isRock(this.height - 1, col)) return false;
    }
    for (let row = 0; row < this.height; row += 1) {
      if (this.isRock(row, 0) || this.isRock(row, this.width - 1)) return false;
    }
    return true;
  }

  isQuadraticPeriodicReady(): boolean {
    return (
      this.width === this.height &&
      this.width % 2 === 1 &&
      this.startRow === (this.height - 1) / 2 &&
      this.startCol === (this.width - 1) / 2 &&
      this.hasClearCardinalCross() &&
      this.hasClearOuterBorder()
    );
  }
}

function parseRowCells(
  line: string,
  row: number,
  width: number,
  rocks: Uint8Array,
): number | null {
  if (line.length !== width) {
    throw new Error(`Row ${row} length ${line.length} does not match expected width ${width}`);
  }
  let startCol: number | null = null;
  for (let col = 0; col < width; col += 1) {
    const ch = line[col];
    if (ch === '#') {
      rocks[row * width + col] = 1;
    } else if (ch === 'S') {
      if (startCol !== null) throw new Error('Multiple start positions S found');
      startCol = col;
    } else if (ch !== '.') {
      throw new Error(`Invalid character "${ch}" at (${row}, ${col})`);
    }
  }
  return startCol;
}

/** Parses a rectangular AoC Day 21 garden map containing `.`, `#`, and exactly one `S`. */
export function parseGardenMap(raw: string): GardenMap {
  // Strip only trailing line endings so leading spaces are rejected rather than trimmed.
  const normalized = raw.replace(/(?:\r?\n)+$/, '');
  if (normalized.length === 0) {
    throw new Error('Garden map input must not be empty');
  }
  const rows = normalized.split(/\r?\n/);
  const height = rows.length;
  const width = rows[0]!.length;
  if (width === 0) {
    throw new Error('Garden map rows must not be empty');
  }
  const rocks = new Uint8Array(width * height);
  let startRow = -1;
  let startCol = -1;
  for (let row = 0; row < height; row += 1) {
    const foundCol = parseRowCells(rows[row]!, row, width, rocks);
    if (foundCol !== null) {
      if (startRow !== -1) throw new Error('Multiple start positions S found');
      startRow = row;
      startCol = foundCol;
    }
  }
  if (startRow === -1) throw new Error('Garden map must contain a start position S');
  return new GardenMap(width, height, startRow, startCol, rocks);
}
