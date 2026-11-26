export const TARGET_WORD = 'XMAS';

export interface GridCoord {
  readonly row: number;
  readonly col: number;
}

function isUnitDelta(delta: number): boolean {
  return delta === -1 || delta === 0 || delta === 1;
}

/** Immutable directed ray match in a word-search grid. */
export class WordMatch {
  readonly row: number;
  readonly col: number;
  readonly dr: number;
  readonly dc: number;
  readonly length: number;

  constructor(row: number, col: number, dr: number, dc: number, length: number) {
    if (!Number.isInteger(row) || row < 0 || !Number.isInteger(col) || col < 0) {
      throw new RangeError(`Start coordinate (${row}, ${col}) must be non-negative integers`);
    }
    if (!isUnitDelta(dr) || !isUnitDelta(dc) || (dr === 0 && dc === 0)) {
      throw new RangeError(`Direction delta (${dr}, ${dc}) must be a non-zero unit pair`);
    }
    if (!Number.isInteger(length) || length < 1) {
      throw new RangeError(`Match length must be a positive integer, got ${length}`);
    }
    if (row + (length - 1) * dr < 0 || col + (length - 1) * dc < 0) {
      throw new RangeError('Match endpoint cannot have negative coordinates');
    }
    this.row = row;
    this.col = col;
    this.dr = dr;
    this.dc = dc;
    this.length = length;
    Object.freeze(this);
  }

  get endRow(): number {
    return this.row + (this.length - 1) * this.dr;
  }

  get endCol(): number {
    return this.col + (this.length - 1) * this.dc;
  }

  get cells(): readonly GridCoord[] {
    const coords: GridCoord[] = [];
    for (let i = 0; i < this.length; i += 1) {
      coords.push(Object.freeze({ row: this.row + i * this.dr, col: this.col + i * this.dc }));
    }
    return Object.freeze(coords);
  }
}
