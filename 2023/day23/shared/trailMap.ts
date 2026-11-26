import { DIRS_4, Grid2D, type GridDelta } from '../../../shared/core';

export type SlopeTile = '^' | '>' | 'v' | '<';
export type TrailTile = '#' | '.' | SlopeTile;

export interface TrailCoord {
  readonly row: number;
  readonly col: number;
}

export const SLOPE_DELTA: Readonly<Record<SlopeTile, GridDelta>> = Object.freeze({
  '^': [-1, 0],
  '>': [0, 1],
  v: [1, 0],
  '<': [0, -1],
});

function parseTile(ch: string, row: number, col: number): TrailTile {
  if (ch === '#' || ch === '.' || ch === '^' || ch === '>' || ch === 'v' || ch === '<') {
    return ch;
  }
  throw new Error(`Invalid trail tile '${ch}' at (${row}, ${col})`);
}

function findSingleDotCol(grid: Grid2D<TrailTile>, row: number): number {
  let found = -1;
  for (let col = 0; col < grid.cols; col += 1) {
    if (grid.at(row, col) === '.') {
      if (found !== -1) throw new Error(`Expected strictly one '.' on row ${row}`);
      found = col;
    }
  }
  if (found === -1) throw new Error(`Expected strictly one '.' on row ${row}`);
  return found;
}

/** Immutable 2D hiking trail grid with directional slope adjacency. */
export class TrailMap {
  private readonly grid: Grid2D<TrailTile>;

  constructor(grid: Grid2D<TrailTile>) {
    if (grid.rows < 2) {
      throw new RangeError(`Trail map requires at least 2 rows, got ${grid.rows}`);
    }
    findSingleDotCol(grid, 0);
    findSingleDotCol(grid, grid.rows - 1);
    this.grid = grid;
    Object.freeze(this);
  }

  get rows(): number {
    return this.grid.rows;
  }

  get cols(): number {
    return this.grid.cols;
  }

  get size(): number {
    return this.grid.size;
  }

  get start(): number {
    return findSingleDotCol(this.grid, 0);
  }

  get end(): number {
    return (this.rows - 1) * this.cols + findSingleDotCol(this.grid, this.rows - 1);
  }

  coordOf(cell: number): TrailCoord {
    if (!Number.isInteger(cell) || cell < 0 || cell >= this.size) {
      throw new RangeError(`Cell index ${cell} out of bounds for ${this.rows}x${this.cols}`);
    }
    const row = Math.floor(cell / this.cols);
    return { row, col: cell - row * this.cols };
  }

  tileAt(cell: number): TrailTile {
    const { row, col } = this.coordOf(cell);
    return this.grid.at(row, col);
  }

  walkableDegree(cell: number): number {
    if (this.tileAt(cell) === '#') return 0;
    const { row, col } = this.coordOf(cell);
    let degree = 0;
    for (const [dr, dc] of DIRS_4) {
      const nr = row + dr;
      const nc = col + dc;
      if (this.grid.inBounds(nr, nc) && this.grid.at(nr, nc) !== '#') degree += 1;
    }
    return degree;
  }

  outgoingNeighbors(cell: number, ignoreSlopes: boolean): number[] {
    const tile = this.tileAt(cell);
    if (tile === '#') return [];
    const { row, col } = this.coordOf(cell);
    const deltas = !ignoreSlopes && tile !== '.' ? [SLOPE_DELTA[tile]] : DIRS_4;
    const neighbors: number[] = [];
    for (const [dr, dc] of deltas) {
      const nr = row + dr;
      const nc = col + dc;
      if (this.grid.inBounds(nr, nc) && this.grid.at(nr, nc) !== '#') {
        neighbors.push(nr * this.cols + nc);
      }
    }
    return neighbors;
  }
}

/** Parses raw puzzle grid text into a validated TrailMap. */
export function parseTrailMap(raw: string): TrailMap {
  return new TrailMap(Grid2D.fromLines(raw, parseTile));
}
