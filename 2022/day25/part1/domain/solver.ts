import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type FuelTraceFrame,
  parseFuelLedger,
  type SnafuLedger,
  traceFuelLedger,
} from '../../shared';

/** Pure TypeScript Part 1 solver summing SNAFU fuel requirements into canonical SNAFU. */
export const solver: Required<PuzzleSolver<SnafuLedger, string, FuelTraceFrame>> = {
  parse: parseFuelLedger,
  solve(ledger: SnafuLedger): string {
    return ledger.totalSnafu;
  },
  trace(ledger: SnafuLedger, options?: TraceOptions): readonly FuelTraceFrame[] {
    return traceFuelLedger(ledger, options);
  },
};
