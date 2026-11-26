import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  PRESENCE_POLICY,
  PassportBatch,
  PassportTraceFrame,
  countValidPassports,
  parsePassportBatch,
  tracePassportScan,
} from '../../shared';

/** Part 1 solver counting passports that contain all seven mandatory fields. */
export const solver: PuzzleSolver<PassportBatch, number, PassportTraceFrame> = {
  parse: parsePassportBatch,

  solve(batch: PassportBatch): number {
    return countValidPassports(batch, PRESENCE_POLICY);
  },

  trace(batch: PassportBatch, options?: TraceOptions): readonly PassportTraceFrame[] {
    return tracePassportScan(batch, PRESENCE_POLICY, options?.maxSteps);
  },
};
