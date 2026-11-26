import { euclideanMod, lcmBigInt } from '../../../shared/core';

export const BLIZZARD_UP = 1;
export const BLIZZARD_DOWN = 2;
export const BLIZZARD_LEFT = 4;
export const BLIZZARD_RIGHT = 8;
export const START_CELL_ID = 0;

export const POPCOUNT_4: readonly number[] = Object.freeze([
  0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4,
]);

export interface GridCoord {
  readonly row: number;
  readonly col: number;
}

function assertGridDim(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 3) {
    throw new RangeError(`${label} must be an integer >= 3, got ${value}`);
  }
}

function assertOpeningCol(col: number, width: number, label: string): void {
  if (!Number.isInteger(col) || col < 1 || col > width - 2) {
    throw new RangeError(`${label} must be an integer in [1, ${width - 2}], got ${col}`);
  }
}

function copyValidatedBlizzards(source: Uint8Array, expectedLen: number): Uint8Array {
  if (source.length !== expectedLen) {
    throw new RangeError(`Expected ${expectedLen} blizzard cells, got ${source.length}`);
  }
  const copy = new Uint8Array(source);
  for (let i = 0; i < copy.length; i += 1) {
    if (copy[i]! > 15) {
      throw new RangeError(`Invalid blizzard bitmask ${copy[i]} at index ${i}`);
    }
  }
  return copy;
}

/** Immutable Blizzard Basin valley geometry and O(1) periodic blizzard occupancy model. */
export class BlizzardBasin {
  readonly height: number;
  readonly width: number;
  readonly startCol: number;
  readonly endCol: number;
  private readonly initialBlizzards: Uint8Array;

  constructor(
    height: number,
    width: number,
    startCol: number,
    endCol: number,
    initialBlizzards: Uint8Array,
  ) {
    assertGridDim(height, 'height');
    assertGridDim(width, 'width');
    assertOpeningCol(startCol, width, 'startCol');
    assertOpeningCol(endCol, width, 'endCol');
    this.height = height;
    this.width = width;
    this.startCol = startCol;
    this.endCol = endCol;
    this.initialBlizzards = copyValidatedBlizzards(initialBlizzards, (height - 2) * (width - 2));
    Object.freeze(this);
  }

  get innerHeight(): number { return this.height - 2; }
  get innerWidth(): number { return this.width - 2; }
  get innerArea(): number { return this.innerHeight * this.innerWidth; }
  get numCells(): number { return this.innerArea + 2; }
  get startCellId(): number { return START_CELL_ID; }
  get endCellId(): number { return this.innerArea + 1; }
  get startEntryId(): number { return this.startCol; }
  get endEntryId(): number { return this.innerArea - this.innerWidth + this.endCol; }

  get period(): number {
    return Number(lcmBigInt(BigInt(this.innerHeight), BigInt(this.innerWidth)));
  }

  get blizzardCount(): number {
    let total = 0;
    for (let i = 0; i < this.initialBlizzards.length; i += 1) {
      total += POPCOUNT_4[this.initialBlizzards[i]!]!;
    }
    return total;
  }

  cellCoord(cellId: number): GridCoord {
    if (!Number.isInteger(cellId) || cellId < 0 || cellId >= this.numCells) {
      throw new RangeError(`cellId must be an integer in [0, ${this.numCells - 1}], got ${cellId}`);
    }
    if (cellId === START_CELL_ID) return { row: 0, col: this.startCol };
    if (cellId === this.endCellId) return { row: this.height - 1, col: this.endCol };
    const idx = cellId - 1;
    const w = this.innerWidth;
    return { row: Math.floor(idx / w) + 1, col: (idx % w) + 1 };
  }

  /** Branchless lookup requiring 0 <= ir < innerHeight, 0 <= ic < innerWidth, 0 <= tr < innerHeight, 0 <= tc < innerWidth. */
  blizzardMaskAtMod(ir: number, ic: number, tr: number, tc: number): number {
    const h = this.innerHeight;
    const w = this.innerWidth;
    const upRow = (ir + tr) % h;
    const downRow = (ir - tr + h) % h;
    const leftCol = (ic + tc) % w;
    const rightCol = (ic - tc + w) % w;
    return (
      (this.initialBlizzards[upRow * w + ic]! & BLIZZARD_UP) |
      (this.initialBlizzards[downRow * w + ic]! & BLIZZARD_DOWN) |
      (this.initialBlizzards[ir * w + leftCol]! & BLIZZARD_LEFT) |
      (this.initialBlizzards[ir * w + rightCol]! & BLIZZARD_RIGHT)
    );
  }

  blizzardMaskAt(ir: number, ic: number, time: number): number {
    if (!Number.isInteger(ir) || ir < 0 || ir >= this.innerHeight) {
      throw new RangeError(`inner row must be in [0, ${this.innerHeight - 1}], got ${ir}`);
    }
    if (!Number.isInteger(ic) || ic < 0 || ic >= this.innerWidth) {
      throw new RangeError(`inner col must be in [0, ${this.innerWidth - 1}], got ${ic}`);
    }
    const tr = euclideanMod(time, this.innerHeight);
    const tc = euclideanMod(time, this.innerWidth);
    return this.blizzardMaskAtMod(ir, ic, tr, tc);
  }

  blizzardCountAt(ir: number, ic: number, time: number): number {
    return POPCOUNT_4[this.blizzardMaskAt(ir, ic, time)]!;
  }

  isCellFreeAtMod(cellId: number, tr: number, tc: number): boolean {
    if (cellId === START_CELL_ID || cellId === this.endCellId) return true;
    const idx = cellId - 1;
    const w = this.innerWidth;
    return this.blizzardMaskAtMod(Math.floor(idx / w), idx % w, tr, tc) === 0;
  }
}
