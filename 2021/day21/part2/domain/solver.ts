import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_QUANTUM_TARGET,
  DiracDiceInput,
  QuantumTraceFrame,
  parseDiracDice,
  solveQuantumGame,
  traceQuantumGame,
} from '../../shared';

/** Part 2 solver for 2021 Day 21 (Dirac Dice with 3-sided quantum die). */
export const solver: PuzzleSolver<DiracDiceInput, bigint, QuantumTraceFrame> = {
  parse(raw: string): DiracDiceInput {
    return parseDiracDice(raw);
  },
  solve(input: DiracDiceInput): bigint {
    return solveQuantumGame(input, DEFAULT_QUANTUM_TARGET);
  },
  trace(input: DiracDiceInput, options?: TraceOptions): readonly QuantumTraceFrame[] {
    return traceQuantumGame(input, DEFAULT_QUANTUM_TARGET, options);
  },
};
