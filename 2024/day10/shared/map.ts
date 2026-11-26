import { Grid2D } from '../../../shared/core';

export const IMPASSABLE_HEIGHT = -1;
export const MIN_HEIGHT = 0;
export const MAX_HEIGHT = 9;

/** Immutable 2D topographic height map backed by a frozen `Grid2D<number>`. */
export class TopographicMap {
  private readonly grid: Grid2D<number>;

  constructor(grid: Grid2D<number>) {
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

  heightAt(row: number, col: number): number {
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

  coordsOf(index: number): readonly [number, number] {
    if (!Number.isInteger(index) || index < 0 || index >= this.grid.size) {
      throw new RangeError(`Cell index ${index} out of bounds for size ${this.grid.size}`);
    }
    const row = Math.floor(index / this.grid.cols);
    const col = index % this.grid.cols;
    return Object.freeze([row, col]);
  }

  heightAtIndex(index: number): number {
    const [row, col] = this.coordsOf(index);
    return this.grid.at(row, col);
  }

  trailheadIndices(): readonly number[] {
    return this.indicesWithHeight(MIN_HEIGHT);
  }

  peakIndices(): readonly number[] {
    return this.indicesWithHeight(MAX_HEIGHT);
  }

  private indicesWithHeight(targetHeight: number): readonly number[] {
    const indices: number[] = [];
    for (let row = 0; row < this.grid.rows; row += 1) {
      for (let col = 0; col < this.grid.cols; col += 1) {
        if (this.grid.at(row, col) === targetHeight) {
          indices.push(row * this.grid.cols + col);
        }
      }
    }
    return Object.freeze(indices);
  }
}

function parseHeightCell(ch: string, row: number, col: number): number {
  if (ch === '.') return IMPASSABLE_HEIGHT;
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  throw new Error(`Invalid height character "${ch}" at (${row}, ${col})`);
}

/** Parses newline-delimited digits `0..9` and `.` barriers into an immutable `TopographicMap`. */
export function parseTopographicMap(raw: string): TopographicMap {
  return new TopographicMap(Grid2D.fromLines(raw, parseHeightCell));
}
