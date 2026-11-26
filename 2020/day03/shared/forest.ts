import { euclideanMod, Grid2D } from '../../../shared/core';

function parseForestCell(ch: string, row: number, col: number): boolean {
  if (ch === '#') return true;
  if (ch === '.') return false;
  throw new SyntaxError(`Invalid forest cell '${ch}' at (${row}, ${col}); expected '.' or '#'`);
}

/** Immutable horizontally-repeating rectangular grid of open ground and trees. */
export class ForestMap {
  readonly #grid: Grid2D<boolean>;

  constructor(grid: Grid2D<boolean>) {
    this.#grid = grid;
    Object.freeze(this);
  }

  get rows(): number {
    return this.#grid.rows;
  }

  get cols(): number {
    return this.#grid.cols;
  }

  wrapCol(col: number): number {
    return euclideanMod(col, this.#grid.cols);
  }

  hasTreeAt(row: number, col: number): boolean {
    return this.#grid.at(row, euclideanMod(col, this.#grid.cols));
  }
}

/** Parses a newline-delimited `.`/`#` map into an immutable `ForestMap`. */
export function parseForestMap(raw: string): ForestMap {
  return new ForestMap(Grid2D.fromLines(raw, parseForestCell));
}
