import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import type { ExecutionStep } from './execution';
import type { BootInstruction } from './instruction';
import type { BootDiagnosisPolicy, BootDiagnosisPolicyId } from './policy';
import type { BootProgram } from './program';

/** Default frame budget for debugger visualization traces. */
export const DEFAULT_MAX_TRACE_STEPS = 240;

/** Execution phase represented by a debugger trace frame. */
export type TraceFramePhase = 'executing' | 'loop-detected' | 'terminated';

/** Immutable snapshot of boot-code execution at one sampled step or halt state. */
export class BootTraceFrame {
  readonly policyId: BootDiagnosisPolicyId;
  readonly program: BootProgram;
  readonly patchedIndex: number | null;
  readonly phase: TraceFramePhase;
  readonly step: ExecutionStep;
  readonly totalSteps: number;
  private readonly visitOrder: ReadonlyMap<number, number>;

  constructor(
    policyId: BootDiagnosisPolicyId,
    program: BootProgram,
    patchedIndex: number | null,
    phase: TraceFramePhase,
    step: ExecutionStep,
    totalSteps: number,
    visitOrder: ReadonlyMap<number, number>,
  ) {
    this.policyId = policyId;
    this.program = program;
    this.patchedIndex = patchedIndex;
    this.phase = phase;
    this.step = step;
    this.totalSteps = totalSteps;
    this.visitOrder = new Map(visitOrder);
    Object.freeze(this);
  }

  get isHalted(): boolean {
    return this.phase !== 'executing';
  }

  get activePc(): number {
    return this.isHalted ? this.step.nextPc : this.step.pc;
  }

  get accumulator(): bigint {
    return this.step.accAfter;
  }

  get executedSteps(): number {
    return this.step.stepIndex + 1;
  }

  get visitedCount(): number {
    return this.visitOrder.size;
  }

  get isPatchedStep(): boolean {
    return this.patchedIndex !== null && this.step.pc === this.patchedIndex;
  }

  get patchedInstruction(): BootInstruction | null {
    return this.patchedIndex === null ? null : this.program.at(this.patchedIndex);
  }

  get originalPatchedInstruction(): BootInstruction | null {
    return this.patchedIndex === null ? null : this.program.at(this.patchedIndex).toggled();
  }

  visitOrderAt(pc: number): number | null {
    const order = this.visitOrder.get(pc);
    return order === undefined ? null : order;
  }
}

function advanceVisits(
  steps: readonly ExecutionStep[],
  fromIndex: number,
  targetApplied: number,
  runningVisits: Map<number, number>,
): number {
  let applied = fromIndex;
  while (applied < targetApplied) {
    const next = steps[applied]!;
    runningVisits.set(next.pc, next.stepIndex + 1);
    applied += 1;
  }
  return applied;
}

/** Diagnoses a BootProgram and returns a uniformly sampled trace ending at halt. */
export function traceBootDiagnosis(
  program: BootProgram,
  policy: BootDiagnosisPolicy,
  options?: TraceOptions,
): readonly BootTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const diagnosis = policy.diagnose(program);
  const steps = diagnosis.run.steps;
  const stepCount = steps.length;
  const haltPhase: TraceFramePhase =
    diagnosis.run.status === 'loop-detected' ? 'loop-detected' : 'terminated';
  const runningVisits = new Map<number, number>();
  const frames: BootTraceFrame[] = [];
  let applied = 0;

  for (const frameIndex of sampleTraceIndices(stepCount + 1, limit)) {
    applied = advanceVisits(steps, applied, Math.min(frameIndex + 1, stepCount), runningVisits);
    const isExecuting = frameIndex < stepCount;
    const phase: TraceFramePhase = isExecuting ? 'executing' : haltPhase;
    const step = isExecuting ? steps[frameIndex]! : diagnosis.run.lastStep;
    frames.push(
      new BootTraceFrame(
        diagnosis.policyId,
        diagnosis.program,
        diagnosis.patchedIndex,
        phase,
        step,
        stepCount,
        runningVisits,
      ),
    );
  }
  return Object.freeze(frames);
}
