import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type Blueprint,
  buildFactoryTrace,
  type FactoryTraceFrame,
  optimizeBlueprints,
  parseBlueprints,
  sumQualityLevels,
} from '../../shared';

const TIME_LIMIT = 24;

/** Pure TypeScript Part 1 solver summing blueprint quality levels over 24 minutes. */
export const solver: PuzzleSolver<readonly Blueprint[], number, FactoryTraceFrame> = {
  parse: parseBlueprints,
  solve(blueprints: readonly Blueprint[]): number {
    return sumQualityLevels(optimizeBlueprints(blueprints, TIME_LIMIT));
  },
  trace(blueprints: readonly Blueprint[], options?: TraceOptions): readonly FactoryTraceFrame[] {
    return buildFactoryTrace(blueprints, TIME_LIMIT, 'quality-sum', options);
  },
};
