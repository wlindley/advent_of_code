import type { PuzzleSolver } from '../../../../shared/core';
import {
  CheatConfig,
  PART2_DEFAULT_CONFIG,
  type RaceConditionSnapshot,
  type Racetrack,
  analyzeCheats,
  computeBfsDistances,
  createRaceConditionSolver,
} from '../../shared';

/** Counts up to 20-picosecond cheats on `racetrack` saving at least `minSaving` picoseconds. */
export function solvePart2(racetrack: Racetrack, minSaving: number): number {
  const config = new CheatConfig(PART2_DEFAULT_CONFIG.maxDuration, minSaving);
  return analyzeCheats(computeBfsDistances(racetrack), config).totalCount;
}

/** Creates a Part 2 `PuzzleSolver` configured with a custom minimum saving threshold. */
export function createPart2Solver(
  minSaving: number,
): PuzzleSolver<Racetrack, number, RaceConditionSnapshot> {
  return createRaceConditionSolver(new CheatConfig(PART2_DEFAULT_CONFIG.maxDuration, minSaving));
}

export const solver: PuzzleSolver<Racetrack, number, RaceConditionSnapshot> =
  createRaceConditionSolver(PART2_DEFAULT_CONFIG);
