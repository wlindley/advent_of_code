import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_RAM_RUN_CONFIG,
  type MemorySpace,
  type RamRunSnapshot,
  parseMemorySpace,
} from '../../shared';
import { requireBlockingByte } from './blockingByte';
import { buildBlockingByteTrace } from './trace';

/** Solves AoC 2024 Day 18 Part 2: coordinate `"x,y"` of the first byte that blocks the exit. */
export function solvePart2(memory: MemorySpace): string {
  return requireBlockingByte(memory).coordinate;
}

/** Creates a Part 2 solver parameterized by grid side length. */
export function createRamRunPart2Solver(
  gridSize: number,
): PuzzleSolver<MemorySpace, string, RamRunSnapshot> {
  if (!Number.isSafeInteger(gridSize) || gridSize < 1) {
    throw new RangeError(`gridSize must be a positive integer, got ${gridSize}`);
  }
  return Object.freeze({
    parse: (raw: string) => parseMemorySpace(raw, gridSize),
    solve: solvePart2,
    trace: (memory: MemorySpace, options?: TraceOptions) => buildBlockingByteTrace(memory, options),
  });
}

export const solver: PuzzleSolver<MemorySpace, string, RamRunSnapshot> = createRamRunPart2Solver(
  DEFAULT_RAM_RUN_CONFIG.gridSize,
);
