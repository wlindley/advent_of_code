import type { CupRingSpec } from './model';
import type { CupRing } from './ring';

export type CrabCupsPolicyId = 'standard-cups' | 'million-cups';

export const MILLION_CUP_COUNT = 1_000_000;
export const STANDARD_MOVES = 100;
export const MILLION_MOVES = 10_000_000;

export interface CrabCupsPolicy<TAnswer extends string | bigint = string | bigint> {
  readonly id: CrabCupsPolicyId;
  readonly label: string;
  readonly moves: number;
  resolveCupCount(spec: CupRingSpec): number;
  extractAnswer(ring: CupRing): TAnswer;
}

/** Part 1 policy: 9-cup ring (spec length) for 100 moves, reading clockwise labels after cup 1. */
export const STANDARD_CUPS_POLICY: CrabCupsPolicy<string> = Object.freeze({
  id: 'standard-cups',
  label: 'Standard Cups (100 moves)',
  moves: STANDARD_MOVES,
  resolveCupCount: (spec: CupRingSpec) => spec.count,
  extractAnswer: (ring: CupRing) => ring.labelsAfterOne(),
});

/** Part 2 policy: 1,000,000 cups for 10,000,000 moves, multiplying the two cups after cup 1. */
export const MILLION_CUPS_POLICY: CrabCupsPolicy<bigint> = Object.freeze({
  id: 'million-cups',
  label: 'Million Cups (10M moves)',
  moves: MILLION_MOVES,
  resolveCupCount: () => MILLION_CUP_COUNT,
  extractAnswer: (ring: CupRing) => ring.productAfterOne(),
});
