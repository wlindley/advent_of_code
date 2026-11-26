import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import { CubeBag, type CubeColor, type GameRecord } from '../../shared';

/** Part 1 bag limits: 12 red, 13 green, 14 blue cubes. */
export const PART1_LIMITS = new CubeBag(12, 13, 14);

/** Default upper bound on trace frames emitted for interactive playback. */
export const DEFAULT_MAX_TRACE_STEPS = 200;

/**
 * Immutable snapshot of one evaluated game during Part 1 execution.
 * Peak bag, feasibility, and exceeded colors are computed dynamically from `game` and `limits`.
 */
export class CubeGameTraceFrame {
  readonly gameIndex: number;
  readonly totalGames: number;
  readonly game: GameRecord;
  readonly limits: CubeBag;
  readonly runningSum: number;
  readonly possibleCount: number;

  constructor(
    gameIndex: number,
    totalGames: number,
    game: GameRecord,
    limits: CubeBag,
    runningSum: number,
    possibleCount: number,
  ) {
    this.gameIndex = gameIndex;
    this.totalGames = totalGames;
    this.game = game;
    this.limits = limits;
    this.runningSum = runningSum;
    this.possibleCount = possibleCount;
    Object.freeze(this);
  }

  /** Minimum cube counts observed across this game's reveals. */
  get peakBag(): CubeBag {
    return this.game.minimumBag;
  }

  /** Whether this game is feasible under `limits`. */
  get isPossible(): boolean {
    return this.peakBag.fitsWithin(this.limits);
  }

  /** Colors whose peak count breaches `limits`. */
  get exceededColors(): readonly CubeColor[] {
    return this.peakBag.exceededColors(this.limits);
  }
}

/** Sums IDs of all games feasible within `limits`. */
export function solveGames(games: readonly GameRecord[], limits: CubeBag): number {
  let sum = 0;
  for (const game of games) {
    if (game.isPossibleWith(limits)) {
      sum += game.id;
    }
  }
  return sum;
}

/**
 * Generates sampled trace frames across `games` while maintaining exact
 * cumulative `runningSum` and `possibleCount` across every game.
 */
export function traceGames(
  games: readonly GameRecord[],
  limits: CubeBag,
  options?: TraceOptions,
): readonly CubeGameTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledSet = new Set(sampleTraceIndices(games.length, maxSteps));
  const frames: CubeGameTraceFrame[] = [];
  let runningSum = 0;
  let possibleCount = 0;
  for (let i = 0; i < games.length; i += 1) {
    const game = games[i]!;
    if (game.isPossibleWith(limits)) {
      runningSum += game.id;
      possibleCount += 1;
    }
    if (sampledSet.has(i)) {
      frames.push(new CubeGameTraceFrame(i, games.length, game, limits, runningSum, possibleCount));
    }
  }
  return Object.freeze(frames);
}
