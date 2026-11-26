import {
  type PuzzleSolver,
  type TraceOptions,
  sampleTraceIndices,
  validateMaxSteps,
} from '../../../shared/core';
import { type MoveDir, type WarehouseSpec, parseWarehouseSpec } from './parse';
import type { WarehouseSnapshot, WarehouseState } from './warehouseState';

export const DEFAULT_MAX_TRACE_STEPS = 240;

export interface WarehouseRule {
  buildInitialState(spec: WarehouseSpec): WarehouseState;
  step(state: WarehouseState, move: MoveDir): boolean;
}

export interface WarehouseFrame {
  readonly step: number;
  readonly totalMoves: number;
  readonly move: MoveDir | null;
  readonly moved: boolean;
  readonly snapshot: WarehouseSnapshot;
}

/** Runs all moves under a rule and returns the final immutable warehouse snapshot. */
export function runWarehouseSimulation(spec: WarehouseSpec, rule: WarehouseRule): WarehouseSnapshot {
  const state = rule.buildInitialState(spec);
  for (const move of spec.moves) {
    rule.step(state, move);
  }
  return state.snapshot();
}

/** Simulates a warehouse and records endpoint-preserving sampled frames up to `maxSteps`. */
export function buildWarehouseTrace(
  spec: WarehouseSpec,
  rule: WarehouseRule,
  options?: TraceOptions,
): readonly WarehouseFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalMoves = spec.moves.length;
  const sampledSteps = new Set(sampleTraceIndices(totalMoves + 1, limit));
  const state = rule.buildInitialState(spec);
  const frames: WarehouseFrame[] = [];

  if (sampledSteps.has(0)) {
    frames.push(Object.freeze({ step: 0, totalMoves, move: null, moved: false, snapshot: state.snapshot() }));
  }

  let step = 0;
  for (const move of spec.moves) {
    const moved = rule.step(state, move);
    step += 1;
    if (sampledSteps.has(step)) {
      frames.push(Object.freeze({ step, totalMoves, move, moved, snapshot: state.snapshot() }));
    }
  }
  return Object.freeze(frames);
}

/** Creates a `PuzzleSolver` bound to a specific warehouse push rule. */
export function createWarehouseSolver(
  rule: WarehouseRule,
): PuzzleSolver<WarehouseSpec, number, WarehouseFrame> {
  return {
    parse: parseWarehouseSpec,
    solve: (spec) => runWarehouseSimulation(spec, rule).gpsSum,
    trace: (spec, options) => buildWarehouseTrace(spec, rule, options),
  };
}
