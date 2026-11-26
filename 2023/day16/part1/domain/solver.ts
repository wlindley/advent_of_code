import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  BeamTracer,
  type BeamWaveFrame,
  type Contraption,
  createBeamState,
  DIR_E,
  parseContraption,
} from '../../shared';

export const PART1_ENTRY = createBeamState(0, 0, DIR_E);

/** AoC 2023 Day 16 Part 1 solver: beam energization from top-left heading East. */
export const solver: PuzzleSolver<Contraption, number, BeamWaveFrame> = {
  parse: parseContraption,
  solve: (contraption: Contraption): number => new BeamTracer(contraption).countEnergized(PART1_ENTRY),
  trace: (contraption: Contraption, options?: TraceOptions): readonly BeamWaveFrame[] =>
    new BeamTracer(contraption).traceWaves(PART1_ENTRY, options),
};
