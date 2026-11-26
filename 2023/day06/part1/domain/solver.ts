import type { PuzzleSolver } from '../../../../shared/core';
import {
  parseRaceColumns,
  traceRaceSheet,
  type RaceSheet,
  type RaceTraceFrame,
} from '../../shared';

/** Returns the exact product of winning hold-time counts across all races in the sheet. */
export function solveRaceSheet(sheet: RaceSheet): bigint {
  return sheet.errorMargin;
}

/** Advent of Code 2023 Day 6 Part 1 solver ("Wait For It"). */
export const solver: PuzzleSolver<RaceSheet, bigint, RaceTraceFrame> = Object.freeze({
  parse: parseRaceColumns,
  solve: solveRaceSheet,
  trace: traceRaceSheet,
});
