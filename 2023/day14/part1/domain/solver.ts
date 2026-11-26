import type { PuzzleSolver } from '../../../../shared/core';
import { DishPlatform, parseDishPlatform } from '../../shared';
import { traceNorthTilt, type Part1TraceStep } from './trace';

/** Computes total north-beam load after tilting the platform north. */
export function solveNorthTiltLoad(platform: DishPlatform): number {
  return platform.tilt('north').northLoad;
}

/** Pure TypeScript solver for AoC 2023 Day 14 Part 1. */
export const solver: PuzzleSolver<DishPlatform, number, Part1TraceStep> = Object.freeze({
  parse: parseDishPlatform,
  solve: solveNorthTiltLoad,
  trace: traceNorthTilt,
});
