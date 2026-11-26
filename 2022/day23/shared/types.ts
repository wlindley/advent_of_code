export type Direction = 0 | 1 | 2 | 3;

export const DIRECTION_LABELS = Object.freeze(['N', 'S', 'W', 'E'] as const);

export interface ElfCoord {
  readonly row: number;
  readonly col: number;
}

export interface RoundStepSummary {
  readonly round: number;
  readonly movedCount: number;
  readonly collisionCount: number;
}

function assertInt(value: number, label: string, min: number): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${label} must be an integer >= ${min}, got ${value}`);
  }
}

/** Immutable axis-aligned integer bounding rectangle with derived dimensions. */
export class BoundingBox {
  readonly minRow: number;
  readonly maxRow: number;
  readonly minCol: number;
  readonly maxCol: number;

  constructor(minRow: number, maxRow: number, minCol: number, maxCol: number) {
    assertInt(minRow, 'minRow', Number.NEGATIVE_INFINITY);
    assertInt(maxRow, 'maxRow', Number.NEGATIVE_INFINITY);
    assertInt(minCol, 'minCol', Number.NEGATIVE_INFINITY);
    assertInt(maxCol, 'maxCol', Number.NEGATIVE_INFINITY);
    if (minRow > maxRow) throw new RangeError(`minRow (${minRow}) exceeds maxRow (${maxRow})`);
    if (minCol > maxCol) throw new RangeError(`minCol (${minCol}) exceeds maxCol (${maxCol})`);
    this.minRow = minRow;
    this.maxRow = maxRow;
    this.minCol = minCol;
    this.maxCol = maxCol;
    Object.freeze(this);
  }

  get height(): number { return this.maxRow - this.minRow + 1; }
  get width(): number { return this.maxCol - this.minCol + 1; }
  get area(): number { return this.height * this.width; }
}

/** Computes the tight BoundingBox enclosing paired row/col coordinate arrays. */
export function computeBoundingBox(
  rows: Int32Array | readonly number[],
  cols: Int32Array | readonly number[],
): BoundingBox {
  if (rows.length === 0) throw new RangeError('Cannot compute bounding box of empty elf set');
  if (rows.length !== cols.length) throw new RangeError(`Mismatched coordinate lengths: ${rows.length} vs ${cols.length}`);
  let minRow = rows[0]!;
  let maxRow = minRow;
  let minCol = cols[0]!;
  let maxCol = minCol;
  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i]!;
    const c = cols[i]!;
    if (r < minRow) minRow = r;
    if (r > maxRow) maxRow = r;
    if (c < minCol) minCol = c;
    if (c > maxCol) maxCol = c;
  }
  return new BoundingBox(minRow, maxRow, minCol, maxCol);
}

/** Immutable frame snapshot for visualization and trace inspection. */
export class DiffusionFrame {
  readonly round: number;
  readonly elfRows: Int32Array;
  readonly elfCols: Int32Array;
  readonly movedFlags: Uint8Array;
  readonly collisionCount: number;

  constructor(
    round: number,
    elfRows: Int32Array,
    elfCols: Int32Array,
    movedFlags: Uint8Array,
    collisionCount: number,
  ) {
    assertInt(round, 'round', 0);
    assertInt(collisionCount, 'collisionCount', 0);
    if (elfRows.length === 0) throw new RangeError('DiffusionFrame requires at least one elf');
    if (elfCols.length !== elfRows.length || movedFlags.length !== elfRows.length) {
      throw new RangeError('DiffusionFrame TypedArray lengths must match');
    }
    this.round = round;
    this.elfRows = elfRows;
    this.elfCols = elfCols;
    this.movedFlags = movedFlags;
    this.collisionCount = collisionCount;
    // Freeze wrapper only; TypedArrays throw TypeError on Object.freeze in strict mode.
    Object.freeze(this);
  }

  get elfCount(): number { return this.elfRows.length; }
  get bounds(): BoundingBox { return computeBoundingBox(this.elfRows, this.elfCols); }
  get emptyGroundCount(): number { return this.bounds.area - this.elfCount; }
  get isStatic(): boolean { return this.round > 0 && this.movedCount === 0; }

  get movedCount(): number {
    let count = 0;
    for (let i = 0; i < this.movedFlags.length; i += 1) count += this.movedFlags[i]!;
    return count;
  }
}

/** Final outcome of simulating a fixed number of diffusion rounds. */
export class SimulationResult {
  readonly roundsCompleted: number;
  readonly finalBounds: BoundingBox;
  readonly elfCount: number;
  readonly reachedStatic: boolean;

  constructor(roundsCompleted: number, finalBounds: BoundingBox, elfCount: number, reachedStatic: boolean) {
    assertInt(roundsCompleted, 'roundsCompleted', 0);
    assertInt(elfCount, 'elfCount', 1);
    this.roundsCompleted = roundsCompleted;
    this.finalBounds = finalBounds;
    this.elfCount = elfCount;
    this.reachedStatic = reachedStatic;
    Object.freeze(this);
  }

  get emptyGroundCount(): number { return this.finalBounds.area - this.elfCount; }
}
