import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_MAX_STATIC_ROUNDS,
  findFirstStaticRound,
  parseElves,
  traceUntilStatic,
  type DiffusionFrame,
  type ElfCoord,
} from '../../shared';

/** Pure TypeScript Part 2 solver finding the first static round of Unstable Diffusion. */
export const solver: Required<PuzzleSolver<readonly ElfCoord[], number, DiffusionFrame>> = {
  parse: parseElves,
  solve(elves: readonly ElfCoord[]): number {
    return findFirstStaticRound(elves, DEFAULT_MAX_STATIC_ROUNDS);
  },
  trace(elves: readonly ElfCoord[], options?: TraceOptions): readonly DiffusionFrame[] {
    return traceUntilStatic(elves, DEFAULT_MAX_STATIC_ROUNDS, options);
  },
};
