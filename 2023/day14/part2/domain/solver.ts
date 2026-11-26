import type { PuzzleSolver } from '../../../../shared/core';
import { DishPlatform, parseDishPlatform } from '../../shared';
import { analyzeSpinCycles, DEFAULT_TARGET_CYCLES } from './cycle';
import { traceSpinCycles, type Part2TraceStep } from './trace';

/** Computes total north-beam load after executing `targetCycles` spin cycles. */
export function solveSpinCycleLoad(
  platform: DishPlatform,
  targetCycles: number = DEFAULT_TARGET_CYCLES,
): number {
  return analyzeSpinCycles(platform, targetCycles).finalLoad;
}

/** Pure TypeScript solver for AoC 2023 Day 14 Part 2. */
export const solver: PuzzleSolver<DishPlatform, number, Part2TraceStep> = Object.freeze({
  parse: parseDishPlatform,
  solve: solveSpinCycleLoad,
  trace: traceSpinCycles,
});
