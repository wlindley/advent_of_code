import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_DETERMINISTIC_TARGET,
  DeterministicTurnFrame,
  DiracDiceInput,
  parseDiracDice,
  solveDeterministicGame,
  traceDeterministicGame,
} from '../../shared';

/** Part 1 solver for 2021 Day 21 (Dirac Dice with deterministic 100-sided die). */
export const solver: PuzzleSolver<DiracDiceInput, number, DeterministicTurnFrame> = {
  parse(raw: string): DiracDiceInput {
    return parseDiracDice(raw);
  },
  solve(input: DiracDiceInput): number {
    return solveDeterministicGame(input, DEFAULT_DETERMINISTIC_TARGET);
  },
  trace(input: DiracDiceInput, options?: TraceOptions): readonly DeterministicTurnFrame[] {
    return traceDeterministicGame(input, DEFAULT_DETERMINISTIC_TARGET, options);
  },
};
