import type { PuzzleSolver } from '../../../shared/core';
import { sumArrangements } from './dp';
import { parseSpringRecords, validateUnfoldFactor, type SpringRecord } from './record';
import { buildHotSpringsTrace, type HotSpringsTraceFrame } from './trace';

/** Builds a frozen `PuzzleSolver` parameterized by a validated positive `unfoldFactor`. */
export function createHotSpringsSolver(
  unfoldFactor: number,
): PuzzleSolver<readonly SpringRecord[], bigint, HotSpringsTraceFrame> {
  const factor = validateUnfoldFactor(unfoldFactor);
  const solver: PuzzleSolver<readonly SpringRecord[], bigint, HotSpringsTraceFrame> = {
    parse: parseSpringRecords,
    solve: (records) => sumArrangements(records, factor),
    trace: (records, options) => buildHotSpringsTrace(records, factor, options),
  };
  return Object.freeze(solver);
}
