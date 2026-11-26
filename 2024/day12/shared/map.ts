import { Grid2D } from '../../../shared/core';

const PLANT_PATTERN = /^[A-Z]$/;

/** Returns true when `ch` is a single uppercase ASCII plant letter `A..Z`. */
export function isValidPlant(ch: string): boolean {
  return PLANT_PATTERN.test(ch);
}

/** Immutable rectangular garden plot map backed by a frozen `Grid2D<string>`. */
export class GardenMap {
  private readonly grid: Grid2D<string>;

  constructor(grid: Grid2D<string>) {
    for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) {
        const ch = grid.at(r, c);
        if (!isValidPlant(ch)) {
          throw new Error(`Invalid plant "${ch}" at (${r}, ${c})`);
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

  plantAt(row: number, col: number): string {
    return this.grid.at(row, col);
  }

  indexOf(row: number, col: number): number {
    if (!this.grid.inBounds(row, col)) {
      throw new RangeError(
        `Grid coordinates (${row}, ${col}) out of bounds for ${this.grid.rows}x${this.grid.cols}`,
      );
    }
    return row * this.grid.cols + col;
  }

  rowOf(index: number): number {
    this.validateIndex(index);
    return Math.floor(index / this.grid.cols);
  }

  colOf(index: number): number {
    this.validateIndex(index);
    return index % this.grid.cols;
  }

  private validateIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.grid.size) {
      throw new RangeError(`Cell index ${index} out of bounds for size ${this.grid.size}`);
    }
  }
}

function identityChar(ch: string): string {
  return ch;
}

/** Parses a rectangular grid of `A..Z` plant characters into a frozen `GardenMap`. */
export function parseGardenMap(raw: string): GardenMap {
  return new GardenMap(Grid2D.fromLines(raw, identityChar));
}
