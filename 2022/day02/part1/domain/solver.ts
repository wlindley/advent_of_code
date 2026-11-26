import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  parseStrategyGuide,
  ResolvedRound,
  scoreStrategyGuide,
  Shape,
  traceStrategyGuide,
  type ResponseCode,
  type RoundResolver,
  type StrategyRound,
  type StrategyTraceFrame,
} from '../../shared';

const RESPONSE_SHAPES: Readonly<Record<ResponseCode, Shape>> = Object.freeze({
  X: Shape.Rock,
  Y: Shape.Paper,
  Z: Shape.Scissors,
});

/** Part 1 resolver interpreting `X/Y/Z` directly as Rock, Paper, and Scissors. */
export class DirectShapeResolver implements RoundResolver {
  resolve(round: StrategyRound): ResolvedRound {
    return new ResolvedRound(round, RESPONSE_SHAPES[round.responseCode]);
  }
}

export const part1RoundResolver: RoundResolver = Object.freeze(new DirectShapeResolver());

/** Computes the total strategy guide score under Part 1 direct-shape rules. */
export function solvePart1(rounds: readonly StrategyRound[]): number {
  return scoreStrategyGuide(rounds, part1RoundResolver);
}

/** Simulates all rounds under Part 1 rules and emits bounded cumulative trace frames. */
export function tracePart1(
  rounds: readonly StrategyRound[],
  options?: TraceOptions,
): readonly StrategyTraceFrame[] {
  return traceStrategyGuide(rounds, part1RoundResolver, options);
}

export const solver: PuzzleSolver<readonly StrategyRound[], number, StrategyTraceFrame> = {
  parse: parseStrategyGuide,
  solve: solvePart1,
  trace: tracePart1,
};
