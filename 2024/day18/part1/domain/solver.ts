import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_RAM_RUN_CONFIG,
  type MemorySpace,
  type RamRunConfig,
  type RamRunSnapshot,
  assertNonNegativeInt,
  buildCorruptionAndWaveTrace,
  findShortestPath,
  parseMemorySpace,
} from '../../shared';

/** Solves AoC 2024 Day 18 Part 1: minimum steps from `(0, 0)` to exit after `fallenCount` bytes. */
export function solvePart1(memory: MemorySpace, fallenCount: number): number {
  const result = findShortestPath(memory, fallenCount);
  if (result.distance === null) {
    throw new Error(`Exit is unreachable after ${result.fallenCount} fallen bytes`);
  }
  return result.distance;
}

/** Creates a Part 1 solver parameterized by grid side length and fallen-byte count. */
export function createRamRunPart1Solver(
  config: RamRunConfig = DEFAULT_RAM_RUN_CONFIG,
): PuzzleSolver<MemorySpace, number, RamRunSnapshot> {
  if (!Number.isSafeInteger(config.gridSize) || config.gridSize < 1) {
    throw new RangeError(`gridSize must be a positive integer, got ${config.gridSize}`);
  }
  assertNonNegativeInt(config.fallenCount, 'fallenCount');

  return Object.freeze({
    parse: (raw: string) => parseMemorySpace(raw, config.gridSize),
    solve: (memory: MemorySpace) => solvePart1(memory, config.fallenCount),
    trace: (memory: MemorySpace, options?: TraceOptions) =>
      buildCorruptionAndWaveTrace(memory, config.fallenCount, options),
  });
}

export const solver: PuzzleSolver<MemorySpace, number, RamRunSnapshot> = createRamRunPart1Solver();
