import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { parseWordSearch, type WordSearchGrid } from '../../shared';
import { classifyXMasOrientation, XMasCross, type XMasOrientation } from './cross';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface XMasTraceFrame {
  readonly foundCount: number;
  readonly totalCrosses: number;
  readonly activeCross: XMasCross | null;
}

function createTraceFrame(
  foundCount: number,
  totalCrosses: number,
  activeCross: XMasCross | null,
): XMasTraceFrame {
  return Object.freeze({ foundCount, totalCrosses, activeCross });
}

/** Scans interior cells row-major, gating on `'A'` and classifying diagonal corners into X-MAS crosses. */
export function findXMasCrosses(grid: WordSearchGrid): readonly XMasCross[] {
  const crosses: XMasCross[] = [];
  for (let row = 1; row < grid.rows - 1; row += 1) {
    for (let col = 1; col < grid.cols - 1; col += 1) {
      if (grid.at(row, col) !== 'A') continue;
      const orientation = classifyXMasOrientation(
        grid.at(row - 1, col - 1),
        grid.at(row - 1, col + 1),
        grid.at(row + 1, col - 1),
        grid.at(row + 1, col + 1),
      );
      if (orientation !== null) {
        crosses.push(new XMasCross(row, col, orientation));
      }
    }
  }
  return Object.freeze(crosses);
}

/** Counts all X-MAS crosses in the validated `WordSearchGrid`. */
export function countXMas(grid: WordSearchGrid): number {
  return findXMasCrosses(grid).length;
}

/** Tallies discovered crosses across each of the four `XMasOrientation` values. */
export function countByOrientation(crosses: readonly XMasCross[]): Readonly<Record<XMasOrientation, number>> {
  const counts: Record<XMasOrientation, number> = { M_LEFT: 0, M_RIGHT: 0, M_TOP: 0, M_BOTTOM: 0 };
  for (const cross of crosses) {
    counts[cross.orientation] += 1;
  }
  return Object.freeze(counts);
}

/** Produces uniformly sampled trace snapshots bounded by `options.maxSteps` (default 200). */
export function traceXMasCrosses(
  grid: WordSearchGrid,
  options?: TraceOptions,
): readonly XMasTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const crosses = findXMasCrosses(grid);
  if (crosses.length === 0) {
    return Object.freeze([createTraceFrame(0, 0, null)]);
  }
  const indices = sampleTraceIndices(crosses.length, maxSteps);
  const frames: XMasTraceFrame[] = [];
  for (const index of indices) {
    frames.push(createTraceFrame(index + 1, crosses.length, crosses[index]!));
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<WordSearchGrid, number, XMasTraceFrame> = Object.freeze({
  parse: parseWordSearch,
  solve: countXMas,
  trace: traceXMasCrosses,
});
