import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseGames, type GameRecord } from '../../shared';
import { CubePowerTraceFrame, solveGames, traceGames } from './trace';

/** Pure TypeScript solver for Advent of Code 2023 Day 2 Part 2. */
export const solver: PuzzleSolver<readonly GameRecord[], number, CubePowerTraceFrame> =
  Object.freeze({
    parse(raw: string): readonly GameRecord[] {
      return parseGames(raw);
    },

    solve(games: readonly GameRecord[]): number {
      return solveGames(games);
    },

    trace(
      games: readonly GameRecord[],
      options?: TraceOptions,
    ): readonly CubePowerTraceFrame[] {
      return traceGames(games, options);
    },
  });
