import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { type BeamWaveFrame, type Contraption, parseContraption } from '../../shared';
import { scanPerimeter, traceOptimalPerimeter } from './perimeterScan';

/** Puzzle solver for AoC 2023 Day 16 Part 2 (maximize energized tiles across perimeter entries). */
export const solver: PuzzleSolver<Contraption, number, BeamWaveFrame> = {
  parse: parseContraption,
  solve: (contraption) => scanPerimeter(contraption).best.energizedCount,
  trace: (contraption, options?: TraceOptions) => traceOptimalPerimeter(contraption, options).frames,
};
