import { euclideanMod } from '../../../shared/core';

/** Canonical Rock-Paper-Scissors shapes encoded modulo 3 so `(player - opponent + 1) mod 3` yields outcome. */
export const Shape = Object.freeze({
  Rock: 0,
  Paper: 1,
  Scissors: 2,
} as const);

export type Shape = (typeof Shape)[keyof typeof Shape];

/** Canonical round outcomes encoded in scoring order (`0 * 3 = 0`, `1 * 3 = 3`, `2 * 3 = 6`). */
export const Outcome = Object.freeze({
  Loss: 0,
  Draw: 1,
  Win: 2,
} as const);

export type Outcome = (typeof Outcome)[keyof typeof Outcome];

export const SHAPE_LABELS = Object.freeze(['Rock', 'Paper', 'Scissors'] as const);

export const OUTCOME_LABELS = Object.freeze(['Loss', 'Draw', 'Win'] as const);

/** Type guard verifying that a numeric value is a valid `Shape` (`0 | 1 | 2`). */
export function isShape(value: number): value is Shape {
  return value === Shape.Rock || value === Shape.Paper || value === Shape.Scissors;
}

function assertShape(value: Shape, role: string): void {
  if (!isShape(value)) {
    throw new RangeError(`${role} must be a valid Shape (0, 1, or 2), got ${value}`);
  }
}

/** Evaluates the player outcome against the opponent shape using modular arithmetic. */
export function evaluateOutcome(opponent: Shape, player: Shape): Outcome {
  assertShape(opponent, 'opponent');
  assertShape(player, 'player');
  return euclideanMod(player - opponent + 1, 3) as Outcome;
}
