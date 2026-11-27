import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { alignScanners } from './aligner';
import { parseScannerReports } from './parser';
import type { BeaconScannerPolicy } from './policy';
import type { ScannerReport } from './scanner';
import { traceBeaconAlignment, type BeaconTraceFrame } from './trace';

/** Parameterizable solver for 2021 Day 19 Beacon Scanner (Part 1 = beacon count, Part 2 = max Manhattan). */
export class BeaconScannerSolver
  implements Required<PuzzleSolver<readonly ScannerReport[], number, BeaconTraceFrame>>
{
  constructor(readonly policy: BeaconScannerPolicy) {
    Object.freeze(this);
  }

  parse(raw: string): readonly ScannerReport[] {
    return parseScannerReports(raw);
  }

  solve(input: readonly ScannerReport[]): number {
    return this.policy.solve(alignScanners(input, this.policy.minOverlap));
  }

  trace(input: readonly ScannerReport[], options?: TraceOptions): readonly BeaconTraceFrame[] {
    return traceBeaconAlignment(input, this.policy, options);
  }

  formatAnswer(answer: number): string {
    return this.policy.formatAnswer(answer);
  }
}
