import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildValveTimeline,
  CompressedValveNetwork,
  findOptimalSchedule,
  parseValveNetwork,
  type ValveNetwork,
  type ValveTimelineFrame,
} from '../../shared';

export const PART1_TIME_LIMIT = 30;

/** Pure TypeScript Part 1 solver optimizing single-agent pressure release over 30 minutes. */
export const solver: PuzzleSolver<ValveNetwork, number, ValveTimelineFrame> = {
  parse: parseValveNetwork,
  solve(network: ValveNetwork): number {
    const compressed = CompressedValveNetwork.fromNetwork(network);
    return findOptimalSchedule(compressed, PART1_TIME_LIMIT).totalPressure;
  },
  trace(network: ValveNetwork, options?: TraceOptions): readonly ValveTimelineFrame[] {
    const compressed = CompressedValveNetwork.fromNetwork(network);
    const schedule = findOptimalSchedule(compressed, PART1_TIME_LIMIT);
    return buildValveTimeline(compressed, [{ label: 'You', schedule }], PART1_TIME_LIMIT, options);
  },
};
