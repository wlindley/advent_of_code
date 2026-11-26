export type GridDelta = readonly [dr: number, dc: number];

export const DIRS_4: readonly GridDelta[] = Object.freeze([
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
]);

export const DIRS_8: readonly GridDelta[] = Object.freeze([
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]);

/** Immutable rectangular 2D grid backed by a contiguous row-major array. */
export class Grid2D<T> {
  readonly rows: number;
  readonly cols: number;
  private readonly cells: readonly T[];

  constructor(rows: number, cols: number, cells: readonly T[]) {
    if (!Number.isInteger(rows) || rows <= 0 || !Number.isInteger(cols) || cols <= 0) {
      throw new RangeError(`Grid dimensions must be positive integers, got ${rows}x${cols}`);
    }
    if (cells.length !== rows * cols) {
      throw new RangeError(`Expected ${rows * cols} cells for ${rows}x${cols} grid, got ${cells.length}`);
    }
    this.rows = rows;
    this.cols = cols;
    this.cells = Object.freeze(cells.slice());
    Object.freeze(this);
  }

  get size(): number {
    return this.rows * this.cols;
  }

  static fromLines<T>(raw: string, mapCell: (ch: string, row: number, col: number) => T): Grid2D<T> {
    // Strip only trailing line endings so meaningful leading/trailing spaces remain intact.
    const trimmed = raw.replace(/(?:\r?\n)+$/, '');
    if (trimmed.length === 0) {
      throw new Error('Grid input cannot be empty');
    }
    const lines = trimmed.split(/\r?\n/);
    const cols = lines[0]!.length;
    if (cols === 0) {
      throw new Error('Grid row 0 cannot be empty');
    }

    const cells: T[] = [];
    for (let row = 0; row < lines.length; row += 1) {
      const line = lines[row]!;
      if (line.length !== cols) {
        throw new Error(`Grid row ${row} has length ${line.length}, expected ${cols}`);
      }
      for (let col = 0; col < cols; col += 1) {
        cells.push(mapCell(line[col]!, row, col));
      }
    }
    return new Grid2D(lines.length, cols, cells);
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

  at(row: number, col: number): T {
    if (!this.inBounds(row, col)) {
      throw new RangeError(`Grid coordinates (${row}, ${col}) out of bounds for ${this.rows}x${this.cols}`);
    }
    return this.cells[row * this.cols + col]!;
  }
}
