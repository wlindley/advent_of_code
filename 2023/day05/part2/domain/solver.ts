import type { PuzzleSolver } from '../../../../shared/core';
import { parseAlmanac, type Almanac } from '../../shared';
import {
  findLowestRangeLocation,
  traceAlmanacRanges,
  type IntervalStageFrame,
} from './trace';

/** Pure TypeScript solver for 2023 Day 05 Part 2 (Seed Ranges). */
export const solver: PuzzleSolver<Almanac, bigint, IntervalStageFrame> = Object.freeze({
  parse: parseAlmanac,
  solve: findLowestRangeLocation,
  trace: traceAlmanacRanges,
});
