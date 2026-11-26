import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseGames, type GameRecord } from '../../shared';
import {
  CubeGameTraceFrame,
  PART1_LIMITS,
  solveGames,
  traceGames,
} from './trace';

/** Pure TypeScript solver for Advent of Code 2023 Day 2 Part 1. */
export const solver: PuzzleSolver<readonly GameRecord[], number, CubeGameTraceFrame> =
  Object.freeze({
    parse(raw: string): readonly GameRecord[] {
      return parseGames(raw);
    },

    solve(games: readonly GameRecord[]): number {
      return solveGames(games, PART1_LIMITS);
    },

    trace(
      games: readonly GameRecord[],
      options?: TraceOptions,
    ): readonly CubeGameTraceFrame[] {
      return traceGames(games, PART1_LIMITS, options);
    },
  });
