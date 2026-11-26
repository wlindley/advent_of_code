import { DIRS_4, type Grid2D } from '../../../shared/core';

export const RIDGE_HEIGHT = 9;

export interface GridCoord {
  readonly row: number;
  readonly col: number;
}

/** Validated immutable heightmap grid with integer elevations in `[0, 9]`. */
export class Heightmap {
  private readonly grid: Grid2D<number>;

  constructor(grid: Grid2D<number>) {
    for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) {
        const h = grid.at(r, c);
        if (!Number.isInteger(h) || h < 0 || h > RIDGE_HEIGHT) {
          throw new RangeError(`Height at (${r}, ${c}) must be an integer in [0, 9], got ${h}`);
        }
      }
    }
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

  inBounds(row: number, col: number): boolean {
    return this.grid.inBounds(row, col);
  }

  at(row: number, col: number): number {
    return this.grid.at(row, col);
  }

  isRidge(row: number, col: number): boolean {
    return this.at(row, col) === RIDGE_HEIGHT;
  }

  isLowPoint(row: number, col: number): boolean {
    const center = this.at(row, col);
    for (const [dr, dc] of DIRS_4) {
      const nr = row + dr;
      const nc = col + dc;
      if (this.inBounds(nr, nc) && this.at(nr, nc) <= center) {
        return false;
      }
    }
    return true;
  }
}
