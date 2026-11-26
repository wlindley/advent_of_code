import { Grid2D } from '../../../shared/core';

/** Identity character mapper passed to `Grid2D.fromLines`. */
export function identityChar(ch: string): string {
  return ch;
}

/** Returns true iff `ch` is a single uppercase ASCII letter `A..Z` or `.`. */
export function isValidCell(ch: string): boolean {
  return ch.length === 1 && ((ch >= 'A' && ch <= 'Z') || ch === '.');
}

/** Immutable validated 2D character grid for Day 4 word-search puzzles. */
export class WordSearchGrid {
  private readonly grid: Grid2D<string>;

  constructor(grid: Grid2D<string>) {
    for (let row = 0; row < grid.rows; row += 1) {
      for (let col = 0; col < grid.cols; col += 1) {
        const ch = grid.at(row, col);
        if (!isValidCell(ch)) {
          throw new Error(`Invalid word search cell '${ch}' at (${row}, ${col})`);
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

  at(row: number, col: number): string {
    return this.grid.at(row, col);
  }

  /** Checks whether `word` appears starting at `(row, col)` stepping by `(dr, dc)`. */
  matchesAt(row: number, col: number, dr: number, dc: number, word: string): boolean {
    if (word.length === 0) {
      throw new RangeError('Word must not be empty');
    }
    if (!Number.isInteger(dr) || !Number.isInteger(dc) || (dr === 0 && dc === 0)) {
      throw new RangeError(`Direction delta (${dr}, ${dc}) must be a non-zero integer pair`);
    }
    const endRow = row + (word.length - 1) * dr;
    const endCol = col + (word.length - 1) * dc;
    if (!this.inBounds(row, col) || !this.inBounds(endRow, endCol)) {
      return false;
    }
    for (let i = 0; i < word.length; i += 1) {
      if (this.grid.at(row + i * dr, col + i * dc) !== word[i]!) {
        return false;
      }
    }
    return true;
  }
}

/** Parses raw newline-delimited puzzle input into a validated `WordSearchGrid`. */
export function parseWordSearch(raw: string): WordSearchGrid {
  return new WordSearchGrid(Grid2D.fromLines(raw, identityChar));
}
