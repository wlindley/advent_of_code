import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_SECRET_STEPS,
  type MarketSnapshot,
  buildBananaOptimizationTrace,
  findBestBananaSequence,
  parseBuyerSeeds,
} from '../../shared';

export const PART2_STEPS = DEFAULT_SECRET_STEPS;
export const PART2_LEADERBOARD_SIZE = 10;

/** Finds the maximum total bananas obtainable by choosing one 4-delta sell sequence. */
export function solvePart2(seeds: readonly number[]): number {
  return findBestBananaSequence(seeds, PART2_STEPS, 1).maxBananas;
}

export const solver: PuzzleSolver<readonly number[], number, MarketSnapshot> = Object.freeze({
  parse: parseBuyerSeeds,
  solve: solvePart2,
  trace(seeds: readonly number[], options?: TraceOptions) {
    return buildBananaOptimizationTrace(seeds, PART2_STEPS, PART2_LEADERBOARD_SIZE, options);
  },
});
