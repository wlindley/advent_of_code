import { Grid2D } from '../../../shared/core';

/** Cardinal directions aligned with `DIRS_4`: `0=UP`, `1=RIGHT`, `2=DOWN`, `3=LEFT`. */
export const CARDINAL_DIR = Object.freeze({
  UP: 0,
  RIGHT: 1,
  DOWN: 2,
  LEFT: 3,
} as const);

export type CardinalDir = (typeof CARDINAL_DIR)[keyof typeof CARDINAL_DIR];

export const CARDINAL_DIRS: readonly CardinalDir[] = Object.freeze([
  CARDINAL_DIR.UP,
  CARDINAL_DIR.RIGHT,
  CARDINAL_DIR.DOWN,
  CARDINAL_DIR.LEFT,
]);

export type TreeHeight = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

function parseTreeHeight(ch: string, row: number, col: number): TreeHeight {
  const code = ch.charCodeAt(0);
  if (code < 48 || code > 57) {
    throw new Error(`Invalid tree height '${ch}' at (${row}, ${col}); expected ASCII digit '0'..'9'`);
  }
  return (code - 48) as TreeHeight;
}

/** Immutable rectangular grid of tree heights (`0..9`). */
export class ForestGrid {
  private readonly grid: Grid2D<TreeHeight>;

  private constructor(grid: Grid2D<TreeHeight>) {
    this.grid = grid;
    Object.freeze(this);
  }

  static parse(raw: string): ForestGrid {
    return new ForestGrid(Grid2D.fromLines(raw, parseTreeHeight));
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

  heightAt(row: number, col: number): TreeHeight {
    return this.grid.at(row, col);
  }
}
