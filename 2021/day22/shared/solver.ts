import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { parseRebootSteps, type RebootStep } from './parser';
import type { ReactorPolicy } from './policy';
import { executeReboot, totalOnVolume } from './reactor';
import { traceReboot, type ReactorTraceFrame } from './trace';

export interface ReactorSolver extends PuzzleSolver<readonly RebootStep[], bigint, ReactorTraceFrame> {
  readonly policy: ReactorPolicy;
  trace(input: readonly RebootStep[], options?: TraceOptions): readonly ReactorTraceFrame[];
}

/** Creates a Day 22 Reactor Reboot solver parameterized by clipping policy (Part 1 vs Part 2). */
export function createReactorSolver(policy: ReactorPolicy): ReactorSolver {
  return {
    policy,
    parse: parseRebootSteps,
    solve: (steps) => totalOnVolume(executeReboot(steps, policy)),
    trace: (steps, options) => traceReboot(steps, policy, options),
  };
}
