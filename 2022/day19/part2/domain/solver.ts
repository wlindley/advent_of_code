import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type Blueprint,
  buildFactoryTrace,
  type FactoryTraceFrame,
  multiplyMaxGeodes,
  optimizeBlueprints,
  parseBlueprints,
} from '../../shared';

const TIME_LIMIT = 32;
const MAX_BLUEPRINTS = 3;

/** Pure TypeScript Part 2 solver multiplying max geodes across the first 3 blueprints over 32 minutes. */
export const solver: PuzzleSolver<readonly Blueprint[], number, FactoryTraceFrame> = {
  parse: parseBlueprints,
  solve(blueprints: readonly Blueprint[]): number {
    return multiplyMaxGeodes(optimizeBlueprints(blueprints.slice(0, MAX_BLUEPRINTS), TIME_LIMIT));
  },
  trace(blueprints: readonly Blueprint[], options?: TraceOptions): readonly FactoryTraceFrame[] {
    return buildFactoryTrace(blueprints, TIME_LIMIT, 'geode-product', options);
  },
};
