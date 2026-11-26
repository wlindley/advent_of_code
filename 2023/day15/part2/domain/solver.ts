import type { PuzzleSolver } from '../../../../shared/core';
import { OpticalBench } from './bench';
import { parseLensInstructions, type LensInstruction } from './instruction';
import { traceHashmapSequence, type HashmapTraceFrame } from './trace';

/** Executes all HASHMAP instructions on an optical bench and returns total focusing power. */
export function solveFocusingPower(instructions: readonly LensInstruction[]): number {
  const bench = new OpticalBench();
  for (let i = 0; i < instructions.length; i += 1) {
    instructions[i]!.apply(bench);
  }
  return bench.focusingPower;
}

/** Frozen PuzzleSolver instance for AoC 2023 Day 15 Part 2. */
export const solver: PuzzleSolver<readonly LensInstruction[], number, HashmapTraceFrame> =
  Object.freeze({
    parse: parseLensInstructions,
    solve: solveFocusingPower,
    trace: traceHashmapSequence,
  });
