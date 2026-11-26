function assertValidCellIndex(index: number, size: number, label: string): void {
  if (!Number.isInteger(index) || index < 0 || index >= size) {
    throw new RangeError(`${label} ${index} out of bounds for grid size ${size}`);
  }
}

/** Immutable elevation grid (`0..25`) with designated start (`S`) and goal (`E`) cell indices. */
export class HeightMap {
  readonly rows: number;
  readonly cols: number;
  readonly startIndex: number;
  readonly goalIndex: number;
  private readonly heights: Uint8Array;

  constructor(
    rows: number,
    cols: number,
    heights: Uint8Array,
    startIndex: number,
    goalIndex: number,
  ) {
    if (!Number.isInteger(rows) || rows <= 0 || !Number.isInteger(cols) || cols <= 0) {
      throw new RangeError(`HeightMap dimensions must be positive integers, got ${rows}x${cols}`);
    }
    const expectedSize = rows * cols;
    if (heights.length !== expectedSize) {
      throw new RangeError(`Expected ${expectedSize} heights for ${rows}x${cols} grid, got ${heights.length}`);
    }
    for (let i = 0; i < heights.length; i += 1) {
      if (heights[i]! > 25) {
        throw new RangeError(`Height at index ${i} must be in 0..25, got ${heights[i]}`);
      }
    }
    assertValidCellIndex(startIndex, expectedSize, 'Start index');
    assertValidCellIndex(goalIndex, expectedSize, 'Goal index');
    if (startIndex === goalIndex) {
      throw new Error('Start and goal indices must be distinct');
    }
    this.rows = rows;
    this.cols = cols;
    this.startIndex = startIndex;
    this.goalIndex = goalIndex;
    this.heights = new Uint8Array(heights);
    Object.freeze(this);
  }

  get size(): number {
    return this.rows * this.cols;
  }

  inBounds(row: number, col: number): boolean {
    return (
      Number.isInteger(row) &&
      Number.isInteger(col) &&
      row >= 0 &&
      row < this.rows &&
      col >= 0 &&
      col < this.cols
    );
  }

  indexOf(row: number, col: number): number {
    if (!this.inBounds(row, col)) {
      throw new RangeError(`Coordinates (${row}, ${col}) out of bounds for ${this.rows}x${this.cols}`);
    }
    return row * this.cols + col;
  }

  coordsOf(index: number): readonly [row: number, col: number] {
    this.assertIndex(index);
    return [Math.floor(index / this.cols), index % this.cols];
  }

  heightAtIndex(index: number): number {
    this.assertIndex(index);
    return this.heights[index]!;
  }

  heightAt(row: number, col: number): number {
    return this.heights[this.indexOf(row, col)]!;
  }

  private assertIndex(index: number): void {
    assertValidCellIndex(index, this.size, 'Cell index');
  }
}

function splitNonEmptyGridLines(raw: string): readonly string[] {
  const trimmed = raw.replace(/(?:\r?\n)+$/, '');
  if (trimmed.length === 0) {
    throw new Error('HeightMap input cannot be empty');
  }
  const lines = trimmed.split(/\r?\n/);
  const cols = lines[0]!.length;
  if (cols === 0) {
    throw new Error('HeightMap row 0 cannot be empty');
  }
  return lines;
}

function decodeHeightChar(ch: string, row: number, col: number): number {
  const code = ch.charCodeAt(0);
  if (code >= 97 && code <= 122) return code - 97;
  throw new Error(`Invalid character '${ch}' at (${row}, ${col})`);
}

interface MarkerState {
  startIndex: number;
  goalIndex: number;
}

function populateGridRow(
  line: string,
  row: number,
  cols: number,
  heights: Uint8Array,
  markers: MarkerState,
): void {
  if (line.length !== cols) {
    throw new Error(`HeightMap row ${row} has length ${line.length}, expected ${cols}`);
  }
  for (let col = 0; col < cols; col += 1) {
    const idx = row * cols + col;
    const ch = line[col]!;
    if (ch === 'S') {
      if (markers.startIndex !== -1) throw new Error(`Duplicate 'S' marker at (${row}, ${col})`);
      markers.startIndex = idx;
      heights[idx] = 0;
    } else if (ch === 'E') {
      if (markers.goalIndex !== -1) throw new Error(`Duplicate 'E' marker at (${row}, ${col})`);
      markers.goalIndex = idx;
      heights[idx] = 25;
    } else {
      heights[idx] = decodeHeightChar(ch, row, col);
    }
  }
}

/** Parses an AoC 2022 Day 12 elevation grid with unique `S` (0) and `E` (25) markers. */
export function parseHeightMap(raw: string): HeightMap {
  const lines = splitNonEmptyGridLines(raw);
  const rows = lines.length;
  const cols = lines[0]!.length;
  const heights = new Uint8Array(rows * cols);
  const markers: MarkerState = { startIndex: -1, goalIndex: -1 };
  for (let row = 0; row < rows; row += 1) {
    populateGridRow(lines[row]!, row, cols, heights, markers);
  }
  if (markers.startIndex === -1) throw new Error("HeightMap input is missing 'S' marker");
  if (markers.goalIndex === -1) throw new Error("HeightMap input is missing 'E' marker");
  return new HeightMap(rows, cols, heights, markers.startIndex, markers.goalIndex);
}
