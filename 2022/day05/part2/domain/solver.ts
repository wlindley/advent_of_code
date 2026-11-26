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

/** CrateMover 9001 lifts multi-crate batches together, preserving vertical order. */
export class CrateMover9001 implements CraneStrategy {
  readonly name = 'CrateMover 9001';
  readonly modelNumber = 9001;

  arrangeLifted(liftedBottomToTop: readonly Crate[]): readonly Crate[] {
    return Object.freeze([...liftedBottomToTop]);
  }
}

export const CRATE_MOVER_9001: CraneStrategy = Object.freeze(new CrateMover9001());

/** Simulates the procedure using CrateMover 9001 and returns the final top-crate message. */
export function solvePart2(procedure: SupplyProcedure): string {
  return executeProcedure(procedure, CRATE_MOVER_9001);
}

/** Simulates Part 2 and returns bounded trace snapshots for visualization. */
export function tracePart2(
  procedure: SupplyProcedure,
  options?: TraceOptions,
): readonly CraneTraceFrame[] {
  return traceProcedure(procedure, CRATE_MOVER_9001, options);
}

export const solver: PuzzleSolver<SupplyProcedure, string, CraneTraceFrame> = Object.freeze({
  parse: parseSupplyProcedure,
  solve: solvePart2,
  trace: tracePart2,
});
