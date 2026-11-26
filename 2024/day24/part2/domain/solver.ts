import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type CircuitSnapshot,
  type LogicCircuit,
  buildRepairTrace,
  parseCircuit,
  repairAdder,
} from '../../shared';

export const PART2_SWAP_COUNT = 4;

/** Repairs `PART2_SWAP_COUNT` swapped output wires and returns the sorted comma-joined wire names. */
export function solvePart2(circuit: LogicCircuit): string {
  return repairAdder(circuit, PART2_SWAP_COUNT).answer;
}

function tracePart2(circuit: LogicCircuit, options?: TraceOptions): readonly CircuitSnapshot[] {
  return buildRepairTrace(circuit, PART2_SWAP_COUNT, options);
}

export const solver: PuzzleSolver<LogicCircuit, string, CircuitSnapshot> = Object.freeze({
  parse: parseCircuit,
  solve: solvePart2,
  trace: tracePart2,
});
