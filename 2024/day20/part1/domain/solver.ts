import type { PuzzleSolver } from '../../../../shared/core';
import {
  CheatConfig,
  PART1_DEFAULT_CONFIG,
  type RaceConditionSnapshot,
  type Racetrack,
  analyzeCheats,
  computeBfsDistances,
  createRaceConditionSolver,
} from '../../shared';

/** Counts 2-picosecond cheats on `racetrack` that save at least `minSaving` picoseconds. */
export function solvePart1(racetrack: Racetrack, minSaving: number): number {
  const config = new CheatConfig(PART1_DEFAULT_CONFIG.maxDuration, minSaving);
  return analyzeCheats(computeBfsDistances(racetrack), config).totalCount;
}

/** Creates a Part 1 `PuzzleSolver` configured with a custom minimum saving threshold. */
export function createPart1Solver(
  minSaving: number,
): PuzzleSolver<Racetrack, number, RaceConditionSnapshot> {
  return createRaceConditionSolver(new CheatConfig(PART1_DEFAULT_CONFIG.maxDuration, minSaving));
}

export const solver: PuzzleSolver<Racetrack, number, RaceConditionSnapshot> =
  createRaceConditionSolver(PART1_DEFAULT_CONFIG);
