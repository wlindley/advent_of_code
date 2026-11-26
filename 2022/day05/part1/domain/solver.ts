import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  executeProcedure,
  parseSupplyProcedure,
  traceProcedure,
  type CraneStrategy,
  type CraneTraceFrame,
  type Crate,
  type SupplyProcedure,
} from '../../shared';

/** CrateMover 9000 lifts crates one at a time, reversing any multi-crate transfer. */
export class CrateMover9000 implements CraneStrategy {
  readonly name = 'CrateMover 9000';
  readonly modelNumber = 9000;

  arrangeLifted(liftedBottomToTop: readonly Crate[]): readonly Crate[] {
    return Object.freeze([...liftedBottomToTop].reverse());
  }
}

export const CRATE_MOVER_9000: CraneStrategy = Object.freeze(new CrateMover9000());

/** Simulates the procedure using CrateMover 9000 and returns the final top-crate message. */
export function solvePart1(procedure: SupplyProcedure): string {
  return executeProcedure(procedure, CRATE_MOVER_9000);
}

/** Simulates Part 1 and returns bounded trace snapshots for visualization. */
export function tracePart1(
  procedure: SupplyProcedure,
  options?: TraceOptions,
): readonly CraneTraceFrame[] {
  return traceProcedure(procedure, CRATE_MOVER_9000, options);
}

export const solver: PuzzleSolver<SupplyProcedure, string, CraneTraceFrame> = Object.freeze({
  parse: parseSupplyProcedure,
  solve: solvePart1,
  trace: tracePart1,
});
