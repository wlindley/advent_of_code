import { FIRST_INVALID_POLICY, XmasAttackSolver } from '../../shared';

/** Standard AoC 2020 Day 9 preamble length. */
export const DEFAULT_PREAMBLE_LENGTH = 25;

/** Part 1 solver finding the first number after the 25-value preamble lacking a distinct sum pair. */
export const solver = new XmasAttackSolver(FIRST_INVALID_POLICY, DEFAULT_PREAMBLE_LENGTH);
