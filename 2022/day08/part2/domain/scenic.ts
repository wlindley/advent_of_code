import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import { CARDINAL_DIR, ForestGrid, ForestSightlines } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 120;

interface RowBest {
  readonly row: number;
  readonly col: number;
  readonly score: number;
}

function assertIntInRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} (${value}) must be an integer in [${min}, ${max}]`);
  }
}

function scanInteriorRow(sightlines: ForestSightlines, row: number, current: RowBest): RowBest {
  if (row === 0 || row === sightlines.rows - 1) return current;
  let best = current;
  for (let c = 1; c < sightlines.cols - 1; c += 1) {
    const score = sightlines.scenicScore(row, c);
    // Strict > preserves the earliest row-major winner when scenic scores tie.
    if (score > best.score) {
      best = { row, col: c, score };
    }
  }
  return best;
}

/** Shared immutable row-major scenic-score scan timeline for zero-copy trace playback. */
export class ScenicScanTimeline {
  readonly forest: ForestGrid;
  readonly sightlines: ForestSightlines;
  private readonly bestRowByRow: Int32Array;
  private readonly bestColByRow: Int32Array;

  private constructor(
    forest: ForestGrid,
    sightlines: ForestSightlines,
    bestRowByRow: Int32Array,
    bestColByRow: Int32Array,
  ) {
    this.forest = forest;
    this.sightlines = sightlines;
    this.bestRowByRow = bestRowByRow;
    this.bestColByRow = bestColByRow;
    Object.freeze(this);
  }

  static build(forest: ForestGrid): ScenicScanTimeline {
    const sightlines = ForestSightlines.analyze(forest);
    const bestRowByRow = new Int32Array(forest.rows);
    const bestColByRow = new Int32Array(forest.rows);
    let best: RowBest = { row: 0, col: 0, score: 0 };

    for (let r = 0; r < forest.rows; r += 1) {
      best = scanInteriorRow(sightlines, r, best);
      bestRowByRow[r] = best.row;
      bestColByRow[r] = best.col;
    }
    return new ScenicScanTimeline(forest, sightlines, bestRowByRow, bestColByRow);
  }

  get totalRawSteps(): number {
    return this.forest.rows;
  }

  bestRowAt(scannedRow: number): number {
    assertIntInRange(scannedRow, 0, this.totalRawSteps - 1, 'scannedRow');
    return this.bestRowByRow[scannedRow]!;
  }

  bestColAt(scannedRow: number): number {
    assertIntInRange(scannedRow, 0, this.totalRawSteps - 1, 'scannedRow');
    return this.bestColByRow[scannedRow]!;
  }

  bestScoreAt(scannedRow: number): number {
    return this.sightlines.scenicScore(this.bestRowAt(scannedRow), this.bestColAt(scannedRow));
  }
}

/** Immutable row-scan snapshot tracking the running scenic-score champion. */
export class ScenicTraceFrame {
  private readonly timeline: ScenicScanTimeline;
  readonly scannedRow: number;
  readonly stepIndex: number;
  readonly totalSteps: number;

  constructor(timeline: ScenicScanTimeline, scannedRow: number, stepIndex: number, totalSteps: number) {
    assertIntInRange(scannedRow, 0, timeline.totalRawSteps - 1, 'scannedRow');
    assertIntInRange(totalSteps, 1, Number.MAX_SAFE_INTEGER, 'totalSteps');
    assertIntInRange(stepIndex, 0, totalSteps - 1, 'stepIndex');
    this.timeline = timeline;
    this.scannedRow = scannedRow;
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    Object.freeze(this);
  }

  get forest(): ForestGrid {
    return this.timeline.forest;
  }

  get sightlines(): ForestSightlines {
    return this.timeline.sightlines;
  }

  get totalRawSteps(): number {
    return this.timeline.totalRawSteps;
  }

  get bestRow(): number {
    return this.timeline.bestRowAt(this.scannedRow);
  }

  get bestCol(): number {
    return this.timeline.bestColAt(this.scannedRow);
  }

  get bestHeight(): number {
    return this.timeline.forest.heightAt(this.bestRow, this.bestCol);
  }

  get bestScore(): number {
    return this.timeline.bestScoreAt(this.scannedRow);
  }

  get bestDistances(): readonly [number, number, number, number] {
    const r = this.bestRow;
    const c = this.bestCol;
    const sl = this.timeline.sightlines;
    return Object.freeze([
      sl.distanceAt(r, c, CARDINAL_DIR.UP),
      sl.distanceAt(r, c, CARDINAL_DIR.RIGHT),
      sl.distanceAt(r, c, CARDINAL_DIR.DOWN),
      sl.distanceAt(r, c, CARDINAL_DIR.LEFT),
    ]);
  }

  get improvedOnRow(): boolean {
    return this.scannedRow > 0 && this.bestScore > this.timeline.bestScoreAt(this.scannedRow - 1);
  }

  get isComplete(): boolean {
    return this.scannedRow === this.timeline.totalRawSteps - 1;
  }

  isInteriorScanned(row: number, col: number): boolean {
    // Evaluate scenicScore first so out-of-bounds coordinates always throw RangeError.
    const score = this.timeline.sightlines.scenicScore(row, col);
    return row <= this.scannedRow && score > 0;
  }
}

/** Computes the maximum scenic score across all trees in the forest. */
export function findMaxScenicScore(forest: ForestGrid): number {
  const timeline = ScenicScanTimeline.build(forest);
  return timeline.bestScoreAt(timeline.totalRawSteps - 1);
}

/** Builds a bounded row-major trace of scenic-score champion snapshots. */
export function traceScenicScore(forest: ForestGrid, options?: TraceOptions): readonly ScenicTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const timeline = ScenicScanTimeline.build(forest);
  const indices = sampleTraceIndices(timeline.totalRawSteps, maxSteps);
  const frames: ScenicTraceFrame[] = [];
  for (let i = 0; i < indices.length; i += 1) {
    frames.push(new ScenicTraceFrame(timeline, indices[i]!, i, indices.length));
  }
  return Object.freeze(frames);
}
