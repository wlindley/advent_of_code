import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type JetPattern,
  parseJetPattern,
  type PyroclasticTraceFrame,
  simulateTower,
  traceTower,
} from '../../shared';

/** Number of falling rocks in AoC 2022 Day 17 Part 1. */
export const PART1_ROCK_COUNT = 2022n;

/** Pure TypeScript Part 1 solver computing tower height after 2,022 rocks. */
export const solver: PuzzleSolver<JetPattern, bigint, PyroclasticTraceFrame> = {
  parse: parseJetPattern,
  solve(jets: JetPattern): bigint {
    return simulateTower(jets, PART1_ROCK_COUNT).towerHeight;
  },
  trace(jets: JetPattern, options?: TraceOptions): readonly PyroclasticTraceFrame[] {
    return traceTower(jets, PART1_ROCK_COUNT, options);
  },
};
