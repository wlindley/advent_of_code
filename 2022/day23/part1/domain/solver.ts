import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_PART1_ROUNDS,
  parseElves,
  simulateRounds,
  traceFixedRounds,
  type DiffusionFrame,
  type ElfCoord,
} from '../../shared';

/** Pure TypeScript Part 1 solver simulating 10 rounds of Unstable Diffusion. */
export const solver: Required<PuzzleSolver<readonly ElfCoord[], number, DiffusionFrame>> = {
  parse: parseElves,
  solve(elves: readonly ElfCoord[]): number {
    return simulateRounds(elves, DEFAULT_PART1_ROUNDS).emptyGroundCount;
  },
  trace(elves: readonly ElfCoord[], options?: TraceOptions): readonly DiffusionFrame[] {
    return traceFixedRounds(elves, DEFAULT_PART1_ROUNDS, options);
  },
};
