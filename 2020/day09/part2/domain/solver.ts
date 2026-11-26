import { ENCRYPTION_WEAKNESS_POLICY, XmasAttackSolver } from '../../shared';

/** Standard AoC 2020 Day 9 preamble length. */
export const DEFAULT_PREAMBLE_LENGTH = 25;

/** Part 2 solver locating a contiguous range (>= 2 items) summing to the first invalid number. */
export const solver = new XmasAttackSolver(ENCRYPTION_WEAKNESS_POLICY, DEFAULT_PREAMBLE_LENGTH);
