import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import { CARDINAL_DIR, ForestGrid, ForestSightlines, type CardinalDir } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 120;

function assertRawStep(rawStep: number, totalRawSteps: number): void {
  if (!Number.isInteger(rawStep) || rawStep < 0 || rawStep >= totalRawSteps) {
    throw new RangeError(`rawStep ${rawStep} out of bounds [0, ${totalRawSteps - 1}]`);
  }
}

function earliestVisibleRawStep(sightlines: ForestSightlines, row: number, col: number): number {
  const { rows, cols } = sightlines;
  // Pass order UP < RIGHT < DOWN < LEFT has strictly disjoint step ranges, so first match is earliest.
  if (sightlines.isVisibleFrom(row, col, CARDINAL_DIR.UP)) return row;
  if (sightlines.isVisibleFrom(row, col, CARDINAL_DIR.RIGHT)) return rows + (cols - 1 - col);
  if (sightlines.isVisibleFrom(row, col, CARDINAL_DIR.DOWN)) return rows + cols + (rows - 1 - row);
  if (sightlines.isVisibleFrom(row, col, CARDINAL_DIR.LEFT)) return 2 * rows + cols + col;
  return -1;
}

function decodeSweepPhase(
  rawStep: number,
  rows: number,
  cols: number,
): { readonly dir: CardinalDir; readonly coord: number } {
  if (rawStep < rows) return { dir: CARDINAL_DIR.UP, coord: rawStep };
  if (rawStep < rows + cols) return { dir: CARDINAL_DIR.RIGHT, coord: cols - 1 - (rawStep - rows) };
  if (rawStep < 2 * rows + cols) return { dir: CARDINAL_DIR.DOWN, coord: rows - 1 - (rawStep - rows - cols) };
  return { dir: CARDINAL_DIR.LEFT, coord: rawStep - (2 * rows + cols) };
}

/** Shared immutable sweep discovery timeline for zero-copy trace frame playback. */
export class VisibilitySweepTimeline {
  readonly sightlines: ForestSightlines;
  readonly totalRawSteps: number;
  private readonly firstVisibleStep: Int32Array;
  private readonly cumulativeByRawStep: Int32Array;

  private constructor(
    sightlines: ForestSightlines,
    totalRawSteps: number,
    firstVisibleStep: Int32Array,
    cumulativeByRawStep: Int32Array,
  ) {
    this.sightlines = sightlines;
    this.totalRawSteps = totalRawSteps;
    this.firstVisibleStep = firstVisibleStep;
    this.cumulativeByRawStep = cumulativeByRawStep;
    Object.freeze(this);
  }

  static build(sightlines: ForestSightlines): VisibilitySweepTimeline {
    const { rows, cols } = sightlines;
    const totalRawSteps = 2 * (rows + cols);
    const firstVisibleStep = new Int32Array(rows * cols);
    const cumulativeByRawStep = new Int32Array(totalRawSteps);

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const step = earliestVisibleRawStep(sightlines, r, c);
        firstVisibleStep[r * cols + c] = step;
        if (step >= 0) {
          cumulativeByRawStep[step] = cumulativeByRawStep[step]! + 1;
        }
      }
    }
    for (let s = 1; s < totalRawSteps; s += 1) {
      cumulativeByRawStep[s] = cumulativeByRawStep[s]! + cumulativeByRawStep[s - 1]!;
    }
    return new VisibilitySweepTimeline(sightlines, totalRawSteps, firstVisibleStep, cumulativeByRawStep);
  }

  firstVisibleStepAt(row: number, col: number): number {
    this.sightlines.visibilityMaskAt(row, col);
    return this.firstVisibleStep[row * this.sightlines.cols + col]!;
  }

  isRevealedAt(row: number, col: number, rawStep: number): boolean {
    assertRawStep(rawStep, this.totalRawSteps);
    const step = this.firstVisibleStepAt(row, col);
    return step >= 0 && step <= rawStep;
  }

  cumulativeVisibleAt(rawStep: number): number {
    assertRawStep(rawStep, this.totalRawSteps);
    return this.cumulativeByRawStep[rawStep]!;
  }
}

/** Immutable wavefront snapshot during the 4-pass perimeter visibility sweep. */
export class VisibilityTraceFrame {
  private readonly timeline: VisibilitySweepTimeline;
  readonly rawStep: number;
  readonly stepIndex: number;
  readonly totalSteps: number;

  constructor(timeline: VisibilitySweepTimeline, rawStep: number, stepIndex: number, totalSteps: number) {
    assertRawStep(rawStep, timeline.totalRawSteps);
    if (!Number.isInteger(totalSteps) || totalSteps < 1) {
      throw new RangeError(`totalSteps must be a positive integer, got ${totalSteps}`);
    }
    this.timeline = timeline;
    this.rawStep = rawStep;
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    Object.freeze(this);
  }

  get sightlines(): ForestSightlines {
    return this.timeline.sightlines;
  }

  get totalRawSteps(): number {
    return this.timeline.totalRawSteps;
  }

  get activeDir(): CardinalDir {
    return decodeSweepPhase(this.rawStep, this.timeline.sightlines.rows, this.timeline.sightlines.cols).dir;
  }

  get wavefrontCoord(): number {
    return decodeSweepPhase(this.rawStep, this.timeline.sightlines.rows, this.timeline.sightlines.cols).coord;
  }

  get cumulativeVisibleCount(): number {
    return this.timeline.cumulativeVisibleAt(this.rawStep);
  }

  get newlyVisibleCount(): number {
    const prev = this.rawStep === 0 ? 0 : this.timeline.cumulativeVisibleAt(this.rawStep - 1);
    return this.cumulativeVisibleCount - prev;
  }

  get totalVisibleCount(): number {
    return this.timeline.sightlines.visibleCount;
  }

  get isComplete(): boolean {
    return this.rawStep === this.timeline.totalRawSteps - 1;
  }

  isTreeRevealed(row: number, col: number): boolean {
    return this.timeline.isRevealedAt(row, col, this.rawStep);
  }
}

/** Counts trees visible from at least one cardinal grid edge. */
export function countVisibleTrees(forest: ForestGrid): number {
  return ForestSightlines.analyze(forest).visibleCount;
}

/** Builds a bounded trace of 4-pass perimeter sweep snapshots for Part 1 visualization. */
export function traceVisibility(
  forest: ForestGrid,
  options?: TraceOptions,
): readonly VisibilityTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const timeline = VisibilitySweepTimeline.build(ForestSightlines.analyze(forest));
  const indices = sampleTraceIndices(timeline.totalRawSteps, maxSteps);
  const frames: VisibilityTraceFrame[] = [];
  for (let i = 0; i < indices.length; i += 1) {
    frames.push(new VisibilityTraceFrame(timeline, indices[i]!, i, indices.length));
  }
  return Object.freeze(frames);
}
