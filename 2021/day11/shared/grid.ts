import type { Grid2D } from '../../../shared/core';

export const MAX_ENERGY = 9;
export const FLASH_THRESHOLD = 10;

/** Immutable validated octopus energy grid with integer cell levels in `[0, 9]`. */
export class OctopusGrid {
  private readonly grid: Grid2D<number>;

  constructor(grid: Grid2D<number>) {
    for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) {
        const energy = grid.at(r, c);
        if (!Number.isInteger(energy) || energy < 0 || energy > MAX_ENERGY) {
          throw new RangeError(`Energy at (${r}, ${c}) must be an integer in [0, 9], got ${energy}`);
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
}
