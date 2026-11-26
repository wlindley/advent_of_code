import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildValveTimeline,
  CompressedValveNetwork,
  computeBestByMask,
  parseValveNetwork,
  type ValveNetwork,
  type ValveTimelineFrame,
} from '../../shared';
import { findOptimalDualAgentPlan, findOptimalDualAgentRoutes } from './dualAgentSearch';

export const PART2_TIME_LIMIT = 26;

/** Pure TypeScript Part 2 solver optimizing dual-agent pressure release over 26 minutes. */
export const solver: PuzzleSolver<ValveNetwork, number, ValveTimelineFrame> = {
  parse: parseValveNetwork,
  solve(network: ValveNetwork): number {
    const compressed = CompressedValveNetwork.fromNetwork(network);
    return findOptimalDualAgentPlan(computeBestByMask(compressed, PART2_TIME_LIMIT)).totalPressure;
  },
  trace(network: ValveNetwork, options?: TraceOptions): readonly ValveTimelineFrame[] {
    const compressed = CompressedValveNetwork.fromNetwork(network);
    const routes = findOptimalDualAgentRoutes(compressed, PART2_TIME_LIMIT);
    return buildValveTimeline(compressed, routes, PART2_TIME_LIMIT, options);
  },
};
