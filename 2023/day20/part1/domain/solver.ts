import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { buildPulseTrace, type CircuitBlueprint, CircuitSimulator, parseCircuitBlueprint, type PulseTraceFrame } from '../../shared';

export const PART1_BUTTON_PRESSES = 1000;
export const PART1_TRACE_PRESSES = 4;

/** AoC 2023 Day 20 Part 1 solver: simulates 1000 button presses and multiplies pulse totals. */
export const solver: PuzzleSolver<CircuitBlueprint, bigint, PulseTraceFrame> = {
  parse(raw: string): CircuitBlueprint {
    return parseCircuitBlueprint(raw);
  },

  solve(blueprint: CircuitBlueprint): bigint {
    const simulator = new CircuitSimulator(blueprint);
    simulator.runPresses(PART1_BUTTON_PRESSES);
    return simulator.product;
  },

  trace(blueprint: CircuitBlueprint, options?: TraceOptions): readonly PulseTraceFrame[] {
    return buildPulseTrace(blueprint, PART1_TRACE_PRESSES, options);
  },
};
