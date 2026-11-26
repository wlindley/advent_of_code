import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type JetPattern,
  parseJetPattern,
  type PyroclasticTraceFrame,
  simulateTower,
  traceTower,
} from '../../shared';

/** Number of falling rocks in AoC 2022 Day 17 Part 2. */
export const PART2_ROCK_COUNT = 1_000_000_000_000n;

/** Pure TypeScript Part 2 solver computing tower height after 1,000,000,000,000 rocks. */
export const solver: PuzzleSolver<JetPattern, bigint, PyroclasticTraceFrame> = {
  parse: parseJetPattern,
  solve(jets: JetPattern): bigint {
    return simulateTower(jets, PART2_ROCK_COUNT).towerHeight;
  },
  trace(jets: JetPattern, options?: TraceOptions): readonly PyroclasticTraceFrame[] {
    return traceTower(jets, PART2_ROCK_COUNT, options);
  },
};
