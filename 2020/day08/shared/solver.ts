import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import type { BootDiagnosisPolicy } from './policy';
import { parseBootProgram, type BootProgram } from './program';
import { traceBootDiagnosis, type BootTraceFrame } from './trace';

/** Shared Day 8 PuzzleSolver parameterized by a BootDiagnosisPolicy. */
export class BootCodeSolver
  implements Required<PuzzleSolver<BootProgram, bigint, BootTraceFrame>>
{
  readonly policy: BootDiagnosisPolicy;

  constructor(policy: BootDiagnosisPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): BootProgram {
    return parseBootProgram(raw);
  }

  solve(program: BootProgram): bigint {
    return this.policy.diagnose(program).answer;
  }

  trace(program: BootProgram, options?: TraceOptions): readonly BootTraceFrame[] {
    return traceBootDiagnosis(program, this.policy, options);
  }
}
