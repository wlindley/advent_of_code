import { euclideanMod, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import {
  isShape,
  Outcome,
  parseStrategyGuide,
  ResolvedRound,
  scoreStrategyGuide,
  Shape,
  StrategyRound,
  traceStrategyGuide,
  type ResponseCode,
  type RoundResolver,
  type StrategyTraceFrame,
} from '../../shared';

/** Part 2 mapping from response code (`X/Y/Z`) to desired round outcome (`Loss/Draw/Win`). */
export const RESPONSE_OUTCOMES: Readonly<Record<ResponseCode, Outcome>> = Object.freeze({
  X: Outcome.Loss,
  Y: Outcome.Draw,
  Z: Outcome.Win,
});

function isOutcome(value: number): value is Outcome {
  return value === Outcome.Loss || value === Outcome.Draw || value === Outcome.Win;
}

/** Derives the player shape achieving `desiredOutcome` against `opponent` via modular inversion. */
export function derivePlayerShape(opponent: Shape, desiredOutcome: Outcome): Shape {
  if (!isShape(opponent)) {
    throw new RangeError(`opponent must be a valid Shape (0, 1, or 2), got ${opponent}`);
  }
  if (!isOutcome(desiredOutcome)) {
    throw new RangeError(`desiredOutcome must be a valid Outcome (0, 1, or 2), got ${desiredOutcome}`);
  }
  return euclideanMod(opponent + desiredOutcome - 1, 3) as Shape;
}

/** Part 2 resolver interpreting `X/Y/Z` as desired outcome and deriving the player's shape. */
export class DesiredOutcomeResolver implements RoundResolver {
  resolve(round: StrategyRound): ResolvedRound {
    const desiredOutcome = RESPONSE_OUTCOMES[round.responseCode];
    return new ResolvedRound(round, derivePlayerShape(round.opponentShape, desiredOutcome));
  }
}

export const part2RoundResolver: RoundResolver = Object.freeze(new DesiredOutcomeResolver());

/** Computes the total strategy guide score under Part 2 desired-outcome rules. */
export function solvePart2(rounds: readonly StrategyRound[]): number {
  return scoreStrategyGuide(rounds, part2RoundResolver);
}

/** Simulates all rounds under Part 2 rules and emits bounded cumulative trace frames. */
export function tracePart2(
  rounds: readonly StrategyRound[],
  options?: TraceOptions,
): readonly StrategyTraceFrame[] {
  return traceStrategyGuide(rounds, part2RoundResolver, options);
}

export const solver: PuzzleSolver<readonly StrategyRound[], number, StrategyTraceFrame> = Object.freeze({
  parse: parseStrategyGuide,
  solve: solvePart2,
  trace: tracePart2,
});
