import type { DonutPathStep, DonutTraceFrame } from './solver';

export interface DonutRenderMetrics {
  readonly cellSize: number;
  readonly pad: number;
  readonly width: number;
  readonly height: number;
}

export interface DonutDepthStats {
  readonly currentDepth: number;
  readonly maxDepth: number;
  readonly warpCount: number;
  readonly totalSteps: number;
  readonly currentStep: number;
}

const TARGET_CANVAS_WIDTH = 720;
const TARGET_CANVAS_HEIGHT = 540;
const MIN_CELL_SIZE = 5;
const MAX_CELL_SIZE = 28;
const CANVAS_PAD = 8;

/** Computes bounded logical canvas dimensions for a `rows x cols` Donut Maze. */
export function computeDonutRenderMetrics(rows: number, cols: number): DonutRenderMetrics {
  if (!Number.isInteger(rows) || rows <= 0 || !Number.isInteger(cols) || cols <= 0) {
    throw new RangeError(`Donut maze dimensions must be positive integers, got ${rows}x${cols}`);
  }
  const rawCell = Math.floor(Math.min(TARGET_CANVAS_WIDTH / cols, TARGET_CANVAS_HEIGHT / rows));
  const cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, rawCell));
  return Object.freeze({
    cellSize,
    pad: CANVAS_PAD,
    width: cols * cellSize + CANVAS_PAD * 2,
    height: rows * cellSize + CANVAS_PAD * 2,
  });
}

/** Computes current/peak recursion depth and portal warp count for a trace step. */
export function computeDepthStats(path: readonly DonutPathStep[], stepIndex: number): DonutDepthStats {
  if (path.length === 0 || stepIndex < 0 || stepIndex >= path.length) {
    throw new RangeError(`Invalid stepIndex ${stepIndex} for path of length ${path.length}`);
  }
  let maxDepth = 0;
  let warpCount = 0;
  for (let i = 0; i < path.length; i += 1) {
    const step = path[i]!;
    if (step.depth > maxDepth) maxDepth = step.depth;
    if (i <= stepIndex && step.warpedVia !== null) warpCount += 1;
  }
  return Object.freeze({
    currentDepth: path[stepIndex]!.depth,
    maxDepth,
    warpCount,
    totalSteps: path.length - 1,
    currentStep: stepIndex,
  });
}

/** Formats concise telemetry status for the Day 20 visualizer canvas header. */
export function formatDonutStatus(frame: DonutTraceFrame, tracksDepth: boolean): string {
  const cur = frame.path[frame.stepIndex]!;
  const parts = [`Step ${frame.stepIndex} / ${frame.path.length - 1}`];
  if (tracksDepth) parts.push(`Depth ${cur.depth}`);
  if (cur.warpedVia !== null) parts.push(`Warped via ${cur.warpedVia}`);
  return parts.join(' · ');
}
