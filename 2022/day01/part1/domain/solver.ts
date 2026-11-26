import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  parseCalorieInventories,
  rankTopElves,
  sumCalories,
  traceTopElves,
  type CalorieTraceFrame,
  type ElfInventory,
} from '../../shared';

export const PART1_TOP_COUNT = 1;

/** Returns the maximum total calories carried by any single Elf. */
export function solveMaxCalories(inventories: readonly ElfInventory[]): number {
  return sumCalories(rankTopElves(inventories, PART1_TOP_COUNT));
}

/** Traces the Part 1 single-leader scan with bounded frame sampling. */
export function traceMaxCalories(
  inventories: readonly ElfInventory[],
  options?: TraceOptions,
): readonly CalorieTraceFrame[] {
  return traceTopElves(inventories, PART1_TOP_COUNT, options);
}

export const solver: PuzzleSolver<readonly ElfInventory[], number, CalorieTraceFrame> = {
  parse: parseCalorieInventories,
  solve: solveMaxCalories,
  trace: traceMaxCalories,
};
