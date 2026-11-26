import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_SECRET_STEPS,
  type MarketSnapshot,
  buildSecretSumTrace,
  parseBuyerSeeds,
  sumNthSecrets,
} from '../../shared';

export const PART1_STEPS = DEFAULT_SECRET_STEPS;

/** Computes the sum of 2000th buyer secret numbers for Part 1. */
export function solvePart1(seeds: readonly number[]): bigint {
  return sumNthSecrets(seeds, PART1_STEPS);
}

export const solver: PuzzleSolver<readonly number[], bigint, MarketSnapshot> = Object.freeze({
  parse: (raw: string) => parseBuyerSeeds(raw),
  solve: (seeds: readonly number[]) => solvePart1(seeds),
  trace: (seeds: readonly number[], options?: TraceOptions) =>
    buildSecretSumTrace(seeds, PART1_STEPS, options),
});
