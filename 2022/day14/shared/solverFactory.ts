import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import type { CaveBoundaryPolicy } from './boundaryPolicy';
import { type CaveScan, parseCaveScan } from './caveScan';
import { simulateReservoir } from './simulation';
import { buildReservoirTrace, type ReservoirTraceFrame } from './trace';

/** Builds an immutable `PuzzleSolver` parameterized by a `CaveBoundaryPolicy`. */
export function createReservoirSolver(
  policy: CaveBoundaryPolicy,
): PuzzleSolver<CaveScan, number, ReservoirTraceFrame> {
  return Object.freeze({
    parse: parseCaveScan,
    solve: (scan: CaveScan) => simulateReservoir(scan, policy).settledCount,
    trace: (scan: CaveScan, options?: TraceOptions) =>
      buildReservoirTrace(simulateReservoir(scan, policy), options),
  });
}
