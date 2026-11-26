import { Grid2D } from '../../../shared/core';

export const EMPTY_CELL = '.';
export const CELL_CHAR_PATTERN = /^[.0-9A-Za-z]$/;

/** Immutable integer grid coordinate (may represent an out-of-bounds projection). */
export class GridPoint {
  readonly row: number;
  readonly col: number;

  constructor(row: number, col: number) {
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      throw new RangeError(`GridPoint coordinates must be integers, got (${row}, ${col})`);
    }
    this.row = row;
    this.col = col;
    Object.freeze(this);
  }

  equals(other: GridPoint): boolean {
    return this.row === other.row && this.col === other.col;
  }
}

function validateGridCells(grid: Grid2D<string>): void {
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const ch = grid.at(row, col);
      if (!CELL_CHAR_PATTERN.test(ch)) {
        throw new Error(`Invalid grid character "${ch}" at (${row}, ${col})`);
      }
    }
  }
}

/** Immutable antenna city grid wrapping a validated Grid2D<string>. */
export class AntennaMap {
  readonly grid: Grid2D<string>;

  constructor(grid: Grid2D<string>) {
    validateGridCells(grid);
    this.grid = grid;
    Object.freeze(this);
  }

  get rows(): number {
    return this.grid.rows;
  }

  get cols(): number {
    return this.grid.cols;
  }

  get frequencyGroups(): ReadonlyMap<string, readonly GridPoint[]> {
    const groups = new Map<string, GridPoint[]>();
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const ch = this.grid.at(row, col);
        if (ch === EMPTY_CELL) continue;
        const list = groups.get(ch);
        const point = new GridPoint(row, col);
        if (list) list.push(point);
        else groups.set(ch, [point]);
      }
    }
    const frozen = new Map<string, readonly GridPoint[]>();
    for (const [freq, points] of groups) frozen.set(freq, Object.freeze(points));
    return frozen;
  }

  get totalPairs(): number {
    let pairs = 0;
    for (const points of this.frequencyGroups.values()) {
      pairs += (points.length * (points.length - 1)) / 2;
    }
    return pairs;
  }

  inBounds(row: number, col: number): boolean {
    return this.grid.inBounds(row, col);
  }

  cellAt(row: number, col: number): string {
    return this.grid.at(row, col);
  }

  isAntennaAt(row: number, col: number): boolean {
    return this.inBounds(row, col) && this.grid.at(row, col) !== EMPTY_CELL;
  }
}

/** Parses raw puzzle text into a validated immutable AntennaMap. */
export function parseAntennaMap(raw: string): AntennaMap {
  return new AntennaMap(Grid2D.fromLines(raw, (ch) => ch));
}
