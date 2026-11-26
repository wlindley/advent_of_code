import { DIRS_4 } from '../../../shared/core';
import { CARDINAL_DIR, CARDINAL_DIRS, ForestGrid, type CardinalDir } from './forest';

/** Directed sightline ray from a tree toward one cardinal edge or blocking tree. */
export interface SightlineRay {
  readonly originRow: number;
  readonly originCol: number;
  readonly dir: CardinalDir;
  readonly distance: number;
  readonly endRow: number;
  readonly endCol: number;
  readonly blocked: boolean;
}

interface SweepWorkspace {
  readonly stackPos: Int32Array;
  readonly stackHeight: Uint8Array;
}

function flattenHeights(forest: ForestGrid): Uint8Array {
  const heights = new Uint8Array(forest.size);
  let idx = 0;
  for (let r = 0; r < forest.rows; r += 1) {
    for (let c = 0; c < forest.cols; c += 1) {
      heights[idx] = forest.heightAt(r, c);
      idx += 1;
    }
  }
  return heights;
}

function scanLine(
  heights: Uint8Array,
  startIdx: number,
  stride: number,
  length: number,
  dirBit: number,
  visibilityMask: Uint8Array,
  dirDistances: Uint32Array,
  ws: SweepWorkspace,
): void {
  let top = 0;
  for (let k = 0; k < length; k += 1) {
    const cellIdx = startIdx + k * stride;
    const h = heights[cellIdx]!;
    while (top > 0 && ws.stackHeight[top - 1]! < h) {
      top -= 1;
    }
    if (top === 0) {
      visibilityMask[cellIdx] = visibilityMask[cellIdx]! | dirBit;
      dirDistances[cellIdx] = k;
    } else {
      dirDistances[cellIdx] = k - ws.stackPos[top - 1]!;
      // Replace equal-height blocker so stack heights stay strictly decreasing (max depth 10).
      if (ws.stackHeight[top - 1]! === h) {
        top -= 1;
      }
    }
    ws.stackPos[top] = k;
    ws.stackHeight[top] = h;
    top += 1;
  }
}

function sweepLines(
  heights: Uint8Array,
  count: number,
  startBase: number,
  lineStep: number,
  stride: number,
  length: number,
  dirBit: number,
  visibilityMask: Uint8Array,
  dirDistances: Uint32Array,
  ws: SweepWorkspace,
): void {
  for (let i = 0; i < count; i += 1) {
    scanLine(heights, startBase + i * lineStep, stride, length, dirBit, visibilityMask, dirDistances, ws);
  }
}

/** Precomputed 4-direction visibility masks and viewing distances via O(R*C) monotonic stack sweeps. */
export class ForestSightlines {
  readonly rows: number;
  readonly cols: number;
  private readonly visibilityMask: Uint8Array;
  private readonly distances: readonly [Uint32Array, Uint32Array, Uint32Array, Uint32Array];

  private constructor(
    rows: number,
    cols: number,
    visibilityMask: Uint8Array,
    distances: readonly [Uint32Array, Uint32Array, Uint32Array, Uint32Array],
  ) {
    this.rows = rows;
    this.cols = cols;
    this.visibilityMask = visibilityMask;
    this.distances = Object.freeze(distances);
    Object.freeze(this);
  }

  static analyze(forest: ForestGrid): ForestSightlines {
    const { rows, cols, size } = forest;
    const heights = flattenHeights(forest);
    const visibilityMask = new Uint8Array(size);
    const distances: [Uint32Array, Uint32Array, Uint32Array, Uint32Array] = [
      new Uint32Array(size),
      new Uint32Array(size),
      new Uint32Array(size),
      new Uint32Array(size),
    ];
    const ws: SweepWorkspace = { stackPos: new Int32Array(10), stackHeight: new Uint8Array(10) };

    sweepLines(heights, cols, 0, 1, cols, rows, 1 << CARDINAL_DIR.UP, visibilityMask, distances[CARDINAL_DIR.UP], ws);
    sweepLines(heights, rows, cols - 1, cols, -1, cols, 1 << CARDINAL_DIR.RIGHT, visibilityMask, distances[CARDINAL_DIR.RIGHT], ws);
    sweepLines(heights, cols, (rows - 1) * cols, 1, -cols, rows, 1 << CARDINAL_DIR.DOWN, visibilityMask, distances[CARDINAL_DIR.DOWN], ws);
    sweepLines(heights, rows, 0, cols, 1, cols, 1 << CARDINAL_DIR.LEFT, visibilityMask, distances[CARDINAL_DIR.LEFT], ws);

    return new ForestSightlines(rows, cols, visibilityMask, distances);
  }

  private indexAt(row: number, col: number): number {
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      throw new RangeError(`Sightline coordinates (${row}, ${col}) out of bounds for ${this.rows}x${this.cols}`);
    }
    return row * this.cols + col;
  }

  get visibleCount(): number {
    let count = 0;
    for (let i = 0; i < this.visibilityMask.length; i += 1) {
      if (this.visibilityMask[i]! !== 0) count += 1;
    }
    return count;
  }

  visibilityMaskAt(row: number, col: number): number {
    return this.visibilityMask[this.indexAt(row, col)]!;
  }

  isVisibleFrom(row: number, col: number, dir: CardinalDir): boolean {
    return (this.visibilityMaskAt(row, col) & (1 << dir)) !== 0;
  }

  isVisible(row: number, col: number): boolean {
    return this.visibilityMaskAt(row, col) !== 0;
  }

  distanceAt(row: number, col: number, dir: CardinalDir): number {
    return this.distances[dir][this.indexAt(row, col)]!;
  }

  scenicScore(row: number, col: number): number {
    const idx = this.indexAt(row, col);
    let score = 1;
    for (const dir of CARDINAL_DIRS) {
      score *= this.distances[dir][idx]!;
    }
    return score;
  }

  rayFor(row: number, col: number, dir: CardinalDir): SightlineRay {
    const idx = this.indexAt(row, col);
    const distance = this.distances[dir][idx]!;
    const [dr, dc] = DIRS_4[dir]!;
    const blocked = (this.visibilityMask[idx]! & (1 << dir)) === 0;
    return Object.freeze({
      originRow: row,
      originCol: col,
      dir,
      distance,
      endRow: row + distance * dr,
      endCol: col + distance * dc,
      blocked,
    });
  }
}
