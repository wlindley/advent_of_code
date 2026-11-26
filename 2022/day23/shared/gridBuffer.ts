import { DIR_DC, DIR_DR, DIR_LUT, STAY_DIR } from './directionLut';
import {
  BoundingBox,
  computeBoundingBox,
  DiffusionFrame,
  type ElfCoord,
  type RoundStepSummary,
} from './types';

export const DEFAULT_INITIAL_PADDING = 12;

function loadElfArrays(elves: readonly ElfCoord[]): { rows: Int32Array; cols: Int32Array } {
  const rows = new Int32Array(elves.length);
  const cols = new Int32Array(elves.length);
  for (let i = 0; i < elves.length; i += 1) {
    const elf = elves[i]!;
    if (!Number.isInteger(elf.row) || !Number.isInteger(elf.col)) {
      throw new RangeError(`Elf coordinate must be integer: (${elf.row}, ${elf.col})`);
    }
    rows[i] = elf.row;
    cols[i] = elf.col;
  }
  return { rows, cols };
}

/** Flat-typed-array simulation buffer with world-coordinate elves and dynamic margin growth. */
export class DiffusionGrid {
  private readonly elfRow: Int32Array;
  private readonly elfCol: Int32Array;
  private readonly propDir: Uint8Array;
  private readonly movedFlags: Uint8Array;
  private originRow: number;
  private originCol: number;
  private height: number;
  private width: number;
  private occ: Uint8Array;
  private propTag: Int32Array;
  private lastRound = 0;

  constructor(elves: readonly ElfCoord[], initialPadding: number) {
    if (elves.length === 0) throw new RangeError('DiffusionGrid requires at least one elf');
    if (!Number.isInteger(initialPadding) || initialPadding < 1) {
      throw new RangeError(`initialPadding must be >= 1, got ${initialPadding}`);
    }
    const { rows, cols } = loadElfArrays(elves);
    const box = computeBoundingBox(rows, cols);
    this.elfRow = rows;
    this.elfCol = cols;
    this.propDir = new Uint8Array(elves.length);
    this.movedFlags = new Uint8Array(elves.length);
    this.originRow = box.minRow - initialPadding;
    this.originCol = box.minCol - initialPadding;
    this.height = box.height + initialPadding * 2;
    this.width = box.width + initialPadding * 2;
    this.occ = new Uint8Array(this.width * this.height);
    this.propTag = new Int32Array(this.width * this.height);
    this.stampOccupancy(true);
  }

  get elfCount(): number { return this.elfRow.length; }
  get bounds(): BoundingBox { return computeBoundingBox(this.elfRow, this.elfCol); }

  private stampOccupancy(rejectDuplicates: boolean): void {
    for (let i = 0; i < this.elfRow.length; i += 1) {
      const idx = (this.elfRow[i]! - this.originRow) * this.width + (this.elfCol[i]! - this.originCol);
      if (rejectDuplicates && this.occ[idx] === 1) {
        throw new Error(`Duplicate elf coordinate at (${this.elfRow[i]}, ${this.elfCol[i]})`);
      }
      this.occ[idx] = 1;
    }
  }

  private ensureMargin(): void {
    const b = this.bounds;
    if (
      b.minRow > this.originRow &&
      b.maxRow < this.originRow + this.height - 1 &&
      b.minCol > this.originCol &&
      b.maxCol < this.originCol + this.width - 1
    ) {
      return;
    }
    const pad = Math.max(DEFAULT_INITIAL_PADDING, Math.ceil(Math.max(b.height, b.width) / 2));
    this.originRow = b.minRow - pad;
    this.originCol = b.minCol - pad;
    this.height = b.height + pad * 2;
    this.width = b.width + pad * 2;
    this.occ = new Uint8Array(this.width * this.height);
    this.propTag = new Int32Array(this.width * this.height);
    this.stampOccupancy(false);
  }

  private proposeMoves(roundMod4: number, tag: number): number {
    const { occ, propTag, propDir, elfRow, elfCol, originRow, originCol, width } = this;
    let collisionCount = 0;
    for (let i = 0; i < elfRow.length; i += 1) {
      const idx = (elfRow[i]! - originRow) * width + (elfCol[i]! - originCol);
      const mask =
        occ[idx - width - 1]! | (occ[idx - width]! << 1) | (occ[idx - width + 1]! << 2) |
        (occ[idx + 1]! << 3) | (occ[idx + width + 1]! << 4) | (occ[idx + width]! << 5) |
        (occ[idx + width - 1]! << 6) | (occ[idx - 1]! << 7);
      const dir = DIR_LUT[(roundMod4 << 8) | mask]!;
      propDir[i] = dir;
      if (dir === STAY_DIR) continue;
      const dest = idx + DIR_DR[dir]! * width + DIR_DC[dir]!;
      if (propTag[dest]! < tag) {
        propTag[dest] = tag;
      } else {
        // Why: Perpendicular-wedge checks prevent orthogonal neighbors from sharing targets, so at most 2 elves collide.
        propTag[dest] = tag + 1;
        collisionCount += 1;
      }
    }
    return collisionCount;
  }

  private applyMoves(tag: number): number {
    const { occ, propTag, propDir, movedFlags, elfRow, elfCol, originRow, originCol, width } = this;
    movedFlags.fill(0);
    let movedCount = 0;
    for (let i = 0; i < elfRow.length; i += 1) {
      const dir = propDir[i]!;
      if (dir === STAY_DIR) continue;
      const idx = (elfRow[i]! - originRow) * width + (elfCol[i]! - originCol);
      const dest = idx + DIR_DR[dir]! * width + DIR_DC[dir]!;
      if (propTag[dest] !== tag) continue;
      occ[idx] = 0;
      occ[dest] = 1;
      elfRow[i]! += DIR_DR[dir]!;
      elfCol[i]! += DIR_DC[dir]!;
      movedFlags[i] = 1;
      movedCount += 1;
    }
    return movedCount;
  }

  /** Executes one 1-indexed diffusion round and returns its move/collision summary. */
  stepRound(round: number): RoundStepSummary {
    if (!Number.isInteger(round) || round < 1 || round <= this.lastRound) {
      throw new RangeError(`round must be an integer > ${this.lastRound}, got ${round}`);
    }
    this.lastRound = round;
    this.ensureMargin();
    const tag = round * 2;
    const collisionCount = this.proposeMoves((round - 1) & 3, tag);
    return { round, movedCount: this.applyMoves(tag), collisionCount };
  }

  /** Captures an isolated round-0 frame before any diffusion step. */
  initialFrame(): DiffusionFrame {
    return new DiffusionFrame(0, new Int32Array(this.elfRow), new Int32Array(this.elfCol), new Uint8Array(this.elfRow.length), 0);
  }

  /** Captures an isolated snapshot matching the most recently executed stepRound summary. */
  toFrame(summary: RoundStepSummary): DiffusionFrame {
    return new DiffusionFrame(summary.round, new Int32Array(this.elfRow), new Int32Array(this.elfCol), new Uint8Array(this.movedFlags), summary.collisionCount);
  }
}
