import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  PassportBatch,
  PassportTraceFrame,
  STRICT_FIELD_POLICY,
  countValidPassports,
  parsePassportBatch,
  tracePassportScan,
} from '../../shared';

/** Part 2 solver counting passports whose seven mandatory fields satisfy strict value rules. */
export const solver: PuzzleSolver<PassportBatch, number, PassportTraceFrame> = {
  parse: parsePassportBatch,

  solve(batch: PassportBatch): number {
    return countValidPassports(batch, STRICT_FIELD_POLICY);
  },

  trace(batch: PassportBatch, options?: TraceOptions): readonly PassportTraceFrame[] {
    return tracePassportScan(batch, STRICT_FIELD_POLICY, options?.maxSteps);
  },
};
