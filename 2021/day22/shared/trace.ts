import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { Cuboid } from './cuboid';
import type { RebootStep } from './parser';
import type { ReactorPolicy } from './policy';
import { applyEffectiveStep, totalOnVolume } from './reactor';

export const DEFAULT_MAX_TRACE_STEPS = 80;

/** Immutable trace snapshot after a single reboot step; derives counts dynamically via getters. */
export class ReactorTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly step: RebootStep;
  readonly clippedCuboid: Cuboid | null;
  readonly activeCuboids: readonly Cuboid[];

  constructor(
    stepIndex: number,
    totalSteps: number,
    step: RebootStep,
    clippedCuboid: Cuboid | null,
    activeCuboids: readonly Cuboid[],
  ) {
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    this.step = step;
    this.clippedCuboid = clippedCuboid;
    this.activeCuboids = activeCuboids;
    Object.freeze(this);
  }

  get onCount(): bigint {
    return totalOnVolume(this.activeCuboids);
  }

  get cuboidCount(): number {
    return this.activeCuboids.length;
  }

  get skipped(): boolean {
    return this.clippedCuboid === null;
  }
}

/** Simulates all reboot steps under `policy` while capturing up to `options.maxSteps` frames. */
export function traceReboot(
  steps: readonly RebootStep[],
  policy: ReactorPolicy,
  options?: TraceOptions,
): readonly ReactorTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = new Set(sampleTraceIndices(steps.length, maxSteps));
  const frames: ReactorTraceFrame[] = [];
  let active: readonly Cuboid[] = Object.freeze([]);

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]!;
    const clipped = policy.clip(step.cuboid);
    if (clipped !== null) {
      active = applyEffectiveStep(active, step.action, clipped);
    }
    if (sampled.has(i)) {
      frames.push(new ReactorTraceFrame(i, steps.length, step, clipped, active));
    }
  }
  return Object.freeze(frames);
}
