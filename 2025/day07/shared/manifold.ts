import { Grid2D } from '../../../shared/core';

export type ManifoldCell = '.' | 'S' | '^';

/** Immutable tachyon manifold grid with validated single emitter start coordinates. */
export class TachyonManifold {
  readonly grid: Grid2D<ManifoldCell>;
  readonly startRow: number;
  readonly startCol: number;

  constructor(grid: Grid2D<ManifoldCell>, startRow: number, startCol: number) {
    if (!grid.inBounds(startRow, startCol) || grid.at(startRow, startCol) !== 'S') {
      throw new Error(`Invalid start position (${startRow}, ${startCol}); cell must be 'S'`);
    }
    this.grid = grid;
    this.startRow = startRow;
    this.startCol = startCol;
    Object.freeze(this);
  }

  static parse(raw: string): TachyonManifold {
    let startRow = -1;
    let startCol = -1;
    const grid = Grid2D.fromLines<ManifoldCell>(raw, (ch, row, col) => {
      if (ch !== '.' && ch !== 'S' && ch !== '^') {
        throw new Error(`Invalid manifold cell '${ch}' at row ${row}, col ${col}; expected '.', 'S', or '^'`);
      }
      if (ch === 'S') {
        if (startRow !== -1) {
          throw new Error(`Duplicate 'S' emitter at row ${row}, col ${col}`);
        }
        startRow = row;
        startCol = col;
      }
      return ch;
    });
    if (startRow === -1) {
      throw new Error("Missing 'S' emitter in manifold input");
    }
    return new TachyonManifold(grid, startRow, startCol);
  }

  get rows(): number {
    return this.grid.rows;
  }

  get cols(): number {
    return this.grid.cols;
  }

  get splitterCount(): number {
    let count = 0;
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        if (this.isSplitter(r, c)) count += 1;
      }
    }
    return count;
  }

  isSplitter(row: number, col: number): boolean {
    return this.grid.at(row, col) === '^';
  }
}
