import type { PuzzleSolver } from '../../../../shared/core';
import { hashAscii, parseInitSequence } from '../../shared';
import { traceHashSequence, type HashSequenceFrame } from './trace';

/** Sums the HASH values of every token in a parsed initialization sequence. */
export function solveHashSum(steps: readonly string[]): number {
  let total = 0;
  for (let i = 0; i < steps.length; i += 1) {
    total += hashAscii(steps[i]!);
  }
  return total;
}

/** AoC 2023 Day 15 Part 1 solver implementing parse, solve, and sampled trace. */
export const solver: PuzzleSolver<readonly string[], number, HashSequenceFrame> = Object.freeze({
  parse: parseInitSequence,
  solve: solveHashSum,
  trace: traceHashSequence,
});
