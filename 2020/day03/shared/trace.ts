import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { ForestMap } from './forest';
import { LandingStep, Slope, validateSlopes } from './slope';
import { SlopeProgress, TrajectoryTraceFrame } from './traceModels';

export const DEFAULT_MAX_TRACE_STEPS = 120;

interface SlopeCursor {
  readonly slope: Slope;
  stepsCompleted: number;
  treeCount: number;
  activeLanding: LandingStep | null;
}

function createSlopeCursors(slopes: readonly Slope[]): SlopeCursor[] {
  const cursors: SlopeCursor[] = [];
  for (let i = 0; i < slopes.length; i += 1) {
    cursors.push({
      slope: slopes[i]!,
      stepsCompleted: 0,
      treeCount: 0,
      activeLanding: null,
    });
  }
  return cursors;
}

function advanceSlopeCursor(cursor: SlopeCursor, forest: ForestMap, row: number): void {
  if (row > 0 && row % cursor.slope.down === 0) {
    cursor.stepsCompleted += 1;
    const col = cursor.stepsCompleted * cursor.slope.right;
    const isTree = forest.hasTreeAt(row, col);
    if (isTree) cursor.treeCount += 1;
    cursor.activeLanding = new LandingStep(cursor.stepsCompleted, cursor.slope, forest.cols, isTree);
    return;
  }
  cursor.activeLanding = null;
}

function snapshotFrame(
  row: number,
  totalRows: number,
  cursors: readonly SlopeCursor[],
): TrajectoryTraceFrame {
  const progresses: SlopeProgress[] = [];
  for (let i = 0; i < cursors.length; i += 1) {
    const c = cursors[i]!;
    progresses.push(new SlopeProgress(c.slope, c.stepsCompleted, c.treeCount, c.activeLanding));
  }
  return new TrajectoryTraceFrame(row, totalRows, progresses);
}

/** Traces cumulative slope progress across uniformly sampled rows up to `maxSteps`. */
export function traceTrajectories(
  forest: ForestMap,
  slopes: readonly Slope[],
  maxSteps?: number,
): readonly TrajectoryTraceFrame[] {
  const validSlopes = validateSlopes(slopes);
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledRows = sampleTraceIndices(forest.rows, limit);
  const cursors = createSlopeCursors(validSlopes);
  const frames: TrajectoryTraceFrame[] = [];
  let sampleIdx = 0;
  for (let row = 0; row < forest.rows; row += 1) {
    for (let i = 0; i < cursors.length; i += 1) {
      advanceSlopeCursor(cursors[i]!, forest, row);
    }
    if (row === sampledRows[sampleIdx]) {
      frames.push(snapshotFrame(row, forest.rows, cursors));
      sampleIdx += 1;
    }
  }
  return Object.freeze(frames);
}
