import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import type { XmasStream } from './stream';
import { buildContiguousWeakness, collectWeaknessSteps, type ContiguousWeakness, type WeaknessWindowStep } from './weakness';
import { collectPreambleChecks, type WindowCheckStep } from './window';

/** Default maximum frame count for XMAS visualization traces. */
export const DEFAULT_MAX_TRACE_STEPS = 240;

function validateStepProgress(step: number, totalSteps: number): void {
  if (!Number.isInteger(step) || !Number.isInteger(totalSteps) || step < 1 || step > totalSteps) {
    throw new RangeError(`Invalid trace step ${step} / ${totalSteps}`);
  }
}

/** Immutable trace frame during Part 1 sliding-window preamble verification. */
export class PreambleScanFrame {
  readonly phase = 'preamble' as const;
  readonly step: number;
  readonly totalSteps: number;
  readonly check: WindowCheckStep;

  constructor(step: number, totalSteps: number, check: WindowCheckStep) {
    validateStepProgress(step, totalSteps);
    this.step = step;
    this.totalSteps = totalSteps;
    this.check = check;
    Object.freeze(this);
  }

  get isInvalid(): boolean {
    return !this.check.isValid;
  }

  get windowLength(): number {
    return this.check.windowLength;
  }
}

/** Immutable trace frame during Part 2 two-pointer contiguous-weakness search. */
export class WeaknessScanFrame {
  readonly phase = 'weakness' as const;
  readonly step: number;
  readonly totalSteps: number;
  readonly invalidIndex: number;
  readonly probe: WeaknessWindowStep;
  readonly weakness: ContiguousWeakness | null;

  constructor(
    step: number,
    totalSteps: number,
    invalidIndex: number,
    probe: WeaknessWindowStep,
    weakness: ContiguousWeakness | null,
  ) {
    validateStepProgress(step, totalSteps);
    if (!Number.isInteger(invalidIndex) || invalidIndex < 0) {
      throw new RangeError(`Invalid target index: ${invalidIndex}`);
    }
    this.step = step;
    this.totalSteps = totalSteps;
    this.invalidIndex = invalidIndex;
    this.probe = probe;
    this.weakness = weakness;
    Object.freeze(this);
  }

  get isFound(): boolean {
    return this.weakness !== null;
  }
}

/** Discriminated union of trace frames emitted by XMAS solvers. */
export type XmasTraceFrame = PreambleScanFrame | WeaknessScanFrame;

function samplePreambleFrames(checks: readonly WindowCheckStep[], budget: number): PreambleScanFrame[] {
  return sampleTraceIndices(checks.length, budget).map(
    (idx) => new PreambleScanFrame(idx + 1, checks.length, checks[idx]!),
  );
}

function buildTwoPhaseTrace(
  checks: readonly WindowCheckStep[],
  steps: readonly WeaknessWindowStep[],
  invalidIndex: number,
  weakness: ContiguousWeakness,
  limit: number,
): readonly XmasTraceFrame[] {
  const preambleBudget = Math.max(
    1,
    Math.min(checks.length, limit - 1, Math.round((limit * checks.length) / (checks.length + steps.length))),
  );
  const weaknessBudget = limit - preambleBudget;
  const frames: XmasTraceFrame[] = samplePreambleFrames(checks, preambleBudget);
  const lastStepIndex = steps.length - 1;
  for (const idx of sampleTraceIndices(steps.length, weaknessBudget)) {
    const frameWeakness = idx === lastStepIndex ? weakness : null;
    frames.push(new WeaknessScanFrame(idx + 1, steps.length, invalidIndex, steps[idx]!, frameWeakness));
  }
  return Object.freeze(frames);
}

/** Produces a budget-bounded trace of Part 1 preamble window checks up to the first invalid number. */
export function tracePreambleScan(
  stream: XmasStream,
  preambleLength: number,
  maxSteps: number,
): readonly PreambleScanFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const checks = collectPreambleChecks(stream, preambleLength);
  return Object.freeze(samplePreambleFrames(checks, limit));
}

/** Produces a budget-bounded two-phase trace covering preamble error discovery and weakness search. */
export function traceWeaknessAttack(
  stream: XmasStream,
  preambleLength: number,
  maxSteps: number,
): readonly XmasTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const checks = collectPreambleChecks(stream, preambleLength);
  const invalidCheck = checks[checks.length - 1]!;
  if (invalidCheck.isValid) {
    throw new Error('No invalid number found');
  }
  const target = stream.at(invalidCheck.targetIndex);
  const steps = collectWeaknessSteps(stream, target);
  const lastStep = steps[steps.length - 1]!;
  if (lastStep.runningSum !== target || lastStep.length < 2) {
    throw new Error(`No contiguous range summing to ${target} found`);
  }
  const weakness = buildContiguousWeakness(stream, lastStep.windowStart, lastStep.windowEnd - 1);
  if (limit === 1) {
    return Object.freeze([new WeaknessScanFrame(steps.length, steps.length, invalidCheck.targetIndex, lastStep, weakness)]);
  }
  return buildTwoPhaseTrace(checks, steps, invalidCheck.targetIndex, weakness, limit);
}
