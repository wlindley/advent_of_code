import { DIR_N, type MainLoop, type PipeMaze } from '../../shared';

function assertPositiveInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive integer, got ${value}`);
  }
}

function assertMaskValid(mask: Uint8Array, rows: number, cols: number): void {
  if (mask.length !== rows * cols) {
    throw new RangeError(`Mask length ${mask.length} does not match ${rows}x${cols}`);
  }
  for (let i = 0; i < mask.length; i += 1) {
    const bit = mask[i]!;
    if (bit !== 0 && bit !== 1) {
      throw new RangeError(`Mask byte at ${i} must be 0 or 1, got ${bit}`);
    }
  }
}

function assertCrossingsValid(crossingsByRow: readonly number[], rows: number): void {
  if (crossingsByRow.length !== rows) {
    throw new RangeError(`Crossings length ${crossingsByRow.length} does not match ${rows} rows`);
  }
  for (let r = 0; r < crossingsByRow.length; r += 1) {
    const count = crossingsByRow[r]!;
    if (!Number.isInteger(count) || count < 0 || count % 2 !== 0) {
      throw new RangeError(`Row ${r} north crossings must be a non-negative even integer, got ${count}`);
    }
  }
}

function assertRowInBounds(row: number, rows: number): void {
  if (!Number.isInteger(row) || row < 0 || row >= rows) {
    throw new RangeError(`Row ${row} out of bounds for ${rows} rows`);
  }
}

function assertInBounds(row: number, col: number, rows: number, cols: number): void {
  assertRowInBounds(row, rows);
  if (!Number.isInteger(col) || col < 0 || col >= cols) {
    throw new RangeError(`Column ${col} out of bounds for ${cols} cols`);
  }
}

function scanRow(maze: PipeMaze, loop: MainLoop, row: number, mask: Uint8Array): number {
  let inside = false;
  let northCrossings = 0;
  const rowOffset = row * maze.cols;
  for (let col = 0; col < maze.cols; col += 1) {
    if (loop.isOnLoop(row, col)) {
      if ((maze.effectiveMaskAt(row, col) & DIR_N) !== 0) {
        inside = !inside;
        northCrossings += 1;
      }
    } else if (inside) {
      mask[rowOffset + col] = 1;
    }
  }
  return northCrossings;
}

/** Immutable result of north-crossing parity scan over a pipe maze and its main loop. */
export class EnclosedAnalysis {
  readonly rows: number;
  readonly cols: number;
  // Why: TypedArrays throw TypeError if frozen; keeping it private and copying on read/write preserves immutability.
  private readonly mask: Uint8Array;
  private readonly crossingsByRow: readonly number[];

  constructor(rows: number, cols: number, mask: Uint8Array, crossingsByRow: readonly number[]) {
    assertPositiveInt(rows, 'rows');
    assertPositiveInt(cols, 'cols');
    assertMaskValid(mask, rows, cols);
    assertCrossingsValid(crossingsByRow, rows);
    this.rows = rows;
    this.cols = cols;
    this.mask = mask.slice();
    this.crossingsByRow = Object.freeze(crossingsByRow.slice());
    Object.freeze(this);
  }

  /** Total enclosed non-loop tiles, derived dynamically from the underlying mask. */
  get count(): number {
    let total = 0;
    for (let i = 0; i < this.mask.length; i += 1) {
      total += this.mask[i]!;
    }
    return total;
  }

  isEnclosed(row: number, col: number): boolean {
    assertInBounds(row, col, this.rows, this.cols);
    return this.mask[row * this.cols + col] === 1;
  }

  northCrossingsAtRow(row: number): number {
    assertRowInBounds(row, this.rows);
    return this.crossingsByRow[row]!;
  }

  /** Enclosed tile count within a single row, derived dynamically from the row slice. */
  enclosedInRow(row: number): number {
    assertRowInBounds(row, this.rows);
    const start = row * this.cols;
    const end = start + this.cols;
    let total = 0;
    for (let i = start; i < end; i += 1) {
      total += this.mask[i]!;
    }
    return total;
  }

  copyMask(): Uint8Array {
    return this.mask.slice();
  }
}

/** Computes enclosed non-loop interior tiles via Jordan-curve north-crossing parity. */
export function analyzeEnclosedTiles(maze: PipeMaze, loop: MainLoop): EnclosedAnalysis {
  if (loop.rows !== maze.rows || loop.cols !== maze.cols) {
    throw new RangeError(
      `Loop dimensions ${loop.rows}x${loop.cols} do not match maze ${maze.rows}x${maze.cols}`,
    );
  }
  const mask = new Uint8Array(maze.rows * maze.cols);
  const crossingsByRow: number[] = [];
  for (let row = 0; row < maze.rows; row += 1) {
    crossingsByRow.push(scanRow(maze, loop, row, mask));
  }
  return new EnclosedAnalysis(maze.rows, maze.cols, mask, crossingsByRow);
}
