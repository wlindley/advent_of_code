import type { PuzzleSolver } from '../../../../shared/core';
import { traceRaceSheet, type RaceSheet, type RaceTraceFrame } from '../../shared';
import { parseMergedRace } from './parser';

/** Returns the exact count of winning button-hold durations for the merged race sheet. */
export function solveMergedRace(sheet: RaceSheet): bigint {
  return sheet.errorMargin;
}

/** Advent of Code 2023 Day 6 Part 2 solver ("Wait For It: Kerning-Fixed Single Race"). */
export const solver: PuzzleSolver<RaceSheet, bigint, RaceTraceFrame> = Object.freeze({
  parse: parseMergedRace,
  solve: solveMergedRace,
  trace: traceRaceSheet,
});
