import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import type { CubeBag, GameRecord } from '../../shared';

/** Default upper bound on trace frames emitted for interactive playback. */
export const DEFAULT_MAX_TRACE_STEPS = 200;

function safeGamePower(game: GameRecord): number {
  const power = game.minimumBag.power;
  if (!Number.isSafeInteger(power)) {
    throw new RangeError(`Game ${game.id} bag power ${power} exceeds safe integer range`);
  }
  return power;
}

function safeAddPower(sum: number, power: number): number {
  const next = sum + power;
  if (!Number.isSafeInteger(next)) {
    throw new RangeError(`Running power sum ${next} exceeds safe integer range`);
  }
  return next;
}

/**
 * Immutable snapshot of one evaluated game during Part 2 execution.
 * Minimum bag and its power are derived dynamically from `game` to avoid drift.
 */
export class CubePowerTraceFrame {
  readonly gameIndex: number;
  readonly totalGames: number;
  readonly game: GameRecord;
  readonly runningPowerSum: number;

  constructor(
    gameIndex: number,
    totalGames: number,
    game: GameRecord,
    runningPowerSum: number,
  ) {
    this.gameIndex = gameIndex;
    this.totalGames = totalGames;
    this.game = game;
    this.runningPowerSum = runningPowerSum;
    Object.freeze(this);
  }

  /** Tightest cube bag capable of producing all reveals in this game. */
  get minimumBag(): CubeBag {
    return this.game.minimumBag;
  }

  /** Product of the minimum required red, green, and blue cube counts. */
  get power(): number {
    return this.minimumBag.power;
  }
}

/** Sums the minimum-bag cube powers across all parsed games. */
export function solveGames(games: readonly GameRecord[]): number {
  let sum = 0;
  for (const game of games) {
    sum = safeAddPower(sum, safeGamePower(game));
  }
  return sum;
}

/**
 * Generates sampled trace frames across `games` while maintaining exact
 * cumulative `runningPowerSum` and safe-integer checks over every game.
 */
export function traceGames(
  games: readonly GameRecord[],
  options?: TraceOptions,
): readonly CubePowerTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledSet = new Set(sampleTraceIndices(games.length, maxSteps));
  const frames: CubePowerTraceFrame[] = [];
  let runningPowerSum = 0;
  for (let i = 0; i < games.length; i += 1) {
    const game = games[i]!;
    runningPowerSum = safeAddPower(runningPowerSum, safeGamePower(game));
    if (sampledSet.has(i)) {
      frames.push(new CubePowerTraceFrame(i, games.length, game, runningPowerSum));
    }
  }
  return Object.freeze(frames);
}
