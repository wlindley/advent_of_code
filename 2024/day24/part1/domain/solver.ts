import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type CircuitSnapshot,
  type LogicCircuit,
  buildEvaluationTrace,
  evaluateCircuit,
  parseCircuit,
} from '../../shared';

/** Evaluates the combinational logic circuit and returns the decimal value on `z*` wires. */
export function solvePart1(circuit: LogicCircuit): bigint {
  return evaluateCircuit(circuit).zValue;
}

export const solver: PuzzleSolver<LogicCircuit, bigint, CircuitSnapshot> = Object.freeze({
  parse: (raw: string) => parseCircuit(raw),
  solve: (circuit: LogicCircuit) => solvePart1(circuit),
  trace: (circuit: LogicCircuit, options?: TraceOptions) => buildEvaluationTrace(circuit, options),
});
