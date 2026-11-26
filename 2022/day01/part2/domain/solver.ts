import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  parseCalorieInventories,
  rankTopElves,
  sumCalories,
  traceTopElves,
  type CalorieTraceFrame,
  type ElfInventory,
} from '../../shared';

export const PART2_TOP_COUNT = 3;

/** Returns the combined total calories carried by the top three Elves. */
export function solveTopThreeCalories(inventories: readonly ElfInventory[]): number {
  return sumCalories(rankTopElves(inventories, PART2_TOP_COUNT));
}

/** Traces the Part 2 top-three leaderboard scan with bounded frame sampling. */
export function traceTopThreeCalories(
  inventories: readonly ElfInventory[],
  options?: TraceOptions,
): readonly CalorieTraceFrame[] {
  return traceTopElves(inventories, PART2_TOP_COUNT, options);
}

export const solver: PuzzleSolver<readonly ElfInventory[], number, CalorieTraceFrame> = {
  parse: parseCalorieInventories,
  solve: solveTopThreeCalories,
  trace: traceTopThreeCalories,
};
