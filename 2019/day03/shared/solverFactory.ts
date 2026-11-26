import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { findCrossings, pickBestCrossing } from './geometry';
import type { CrossingMetric } from './metric';
import { parseWirePair } from './parser';
import { traceCrossedWires, type WireTraceFrame } from './trace';
import type { WirePair } from './types';

/** Creates a frozen PuzzleSolver parameterized by a crossing scoring metric. */
export function createCrossedWiresSolver(
  metric: CrossingMetric,
): Required<PuzzleSolver<WirePair, bigint, WireTraceFrame>> {
  return Object.freeze({
    parse: parseWirePair,
    solve(pair: WirePair): bigint {
      const best = pickBestCrossing(findCrossings(pair), metric);
      if (best === null) {
        throw new Error('No wire crossings found');
      }
      return metric.score(best);
    },
    trace(pair: WirePair, options?: TraceOptions): readonly WireTraceFrame[] {
      return traceCrossedWires(pair, metric, options);
    },
  });
}
