import { Grid2D } from '../../../shared/core';

export type UniverseCell = '.' | '#';

export interface GalaxyCoord {
  readonly row: number;
  readonly col: number;
}

function parseUniverseCell(ch: string, row: number, col: number): UniverseCell {
  if (ch !== '.' && ch !== '#') {
    throw new Error(`Invalid universe cell '${ch}' at (${row}, ${col})`);
  }
  return ch;
}

/**
 * Immutable 2D universe observation grid storing only the underlying `Grid2D`.
 * Galaxy coordinates and per-axis counts are derived dynamically on demand.
 */
export class UniverseMap {
  private readonly grid: Grid2D<UniverseCell>;

  constructor(grid: Grid2D<UniverseCell>) {
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

  at(row: number, col: number): UniverseCell {
    return this.grid.at(row, col);
  }

  galaxies(): readonly GalaxyCoord[] {
    const coords: GalaxyCoord[] = [];
    for (let row = 0; row < this.grid.rows; row += 1) {
      for (let col = 0; col < this.grid.cols; col += 1) {
        if (this.grid.at(row, col) === '#') {
          coords.push(Object.freeze({ row, col }));
        }
      }
    }
    return Object.freeze(coords);
  }

  rowCounts(): readonly number[] {
    const counts = new Array<number>(this.grid.rows).fill(0);
    for (let row = 0; row < this.grid.rows; row += 1) {
      for (let col = 0; col < this.grid.cols; col += 1) {
        if (this.grid.at(row, col) === '#') {
          counts[row]! += 1;
        }
      }
    }
    return Object.freeze(counts);
  }

  colCounts(): readonly number[] {
    const counts = new Array<number>(this.grid.cols).fill(0);
    for (let row = 0; row < this.grid.rows; row += 1) {
      for (let col = 0; col < this.grid.cols; col += 1) {
        if (this.grid.at(row, col) === '#') {
          counts[col]! += 1;
        }
      }
    }
    return Object.freeze(counts);
  }
}

/** Parses a rectangular `.`/`#` starfield grid into an immutable `UniverseMap`. */
export function parseUniverseMap(raw: string): UniverseMap {
  return new UniverseMap(Grid2D.fromLines(raw, parseUniverseCell));
}
