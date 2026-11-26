import {
  bigintLog2,
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import type { WastelandNetwork } from '../../shared';
import {
  analyzeGhostConvergence,
  type ConvergencePlan,
  type MergeStepRecord,
} from './convergence';
import { isGhostTargetLabel, type GhostCycle } from './ghostCycle';

export type ConvergenceStage = 'discovery' | 'merge' | 'converged';

export const DEFAULT_MAX_TRACE_STEPS = 64;
export const MAX_LOCKSTEP_STRIP_STEPS = 24n;

export interface LockstepStep {
  readonly step: number;
  readonly nodeIds: readonly number[];
  readonly allTargets: boolean;
}

interface RawFrameSpec {
  readonly stage: ConvergenceStage;
  readonly mergeStep: MergeStepRecord | undefined;
}

/** Immutable visualization frame representing one stage of ghost cycle/CRT convergence. */
export class GhostConvergenceFrame {
  readonly stepIndex: number;
  readonly totalTraceSteps: number;
  readonly stage: ConvergenceStage;
  readonly plan: ConvergencePlan;
  readonly mergeStep: MergeStepRecord | undefined;
  readonly lockstepTimeline: readonly LockstepStep[];

  constructor(
    stepIndex: number,
    totalTraceSteps: number,
    stage: ConvergenceStage,
    plan: ConvergencePlan,
    mergeStep: MergeStepRecord | undefined,
    lockstepTimeline: readonly LockstepStep[],
  ) {
    if (!Number.isInteger(stepIndex) || stepIndex < 0) {
      throw new RangeError(`stepIndex must be non-negative integer, got ${stepIndex}`);
    }
    if (!Number.isInteger(totalTraceSteps) || totalTraceSteps < 1 || stepIndex >= totalTraceSteps) {
      throw new RangeError(
        `stepIndex ${stepIndex} out of bounds for totalTraceSteps=${totalTraceSteps}`,
      );
    }
    if (stage === 'merge' && mergeStep === undefined) {
      throw new Error('Merge frame requires a mergeStep record');
    }
    if (stage !== 'merge' && mergeStep !== undefined) {
      throw new Error('Non-merge frame must not carry a mergeStep record');
    }
    this.stepIndex = stepIndex;
    this.totalTraceSteps = totalTraceSteps;
    this.stage = stage;
    this.plan = plan;
    this.mergeStep = mergeStep;
    this.lockstepTimeline = lockstepTimeline;
    Object.freeze(this);
  }

  get ghostCount(): number {
    return this.plan.cycles.length;
  }

  get maxPrefixLength(): number {
    return this.plan.maxPrefixLength;
  }

  get minSteadyStep(): bigint {
    return this.plan.minSteadyStep;
  }

  get activeGhost(): GhostCycle | undefined {
    return this.mergeStep?.ghost;
  }

  get runningStep(): bigint {
    if (this.stage === 'discovery') return 0n;
    if (this.stage === 'merge') return this.mergeStep!.bestStep;
    return this.plan.answer;
  }

  get runningModulus(): bigint {
    if (this.stage === 'discovery') return 1n;
    if (this.stage === 'merge') return this.mergeStep!.bestCandidate.modulus;
    return this.plan.mergeSteps.at(-1)?.bestCandidate.modulus ?? 1n;
  }

  get isConverged(): boolean {
    return this.stage === 'converged';
  }

  get log2ScaleRatio(): number {
    const current = this.runningStep;
    if (current === 0n) return 0;
    if (this.plan.answer === 1n) return 1;
    return bigintLog2(current) / bigintLog2(this.plan.answer);
  }
}

function buildLockstepTimeline(
  network: WastelandNetwork,
  cycles: readonly GhostCycle[],
  answer: bigint,
): readonly LockstepStep[] {
  if (answer > MAX_LOCKSTEP_STRIP_STEPS) return Object.freeze([]);
  const limit = Number(answer);
  const tapeLen = network.tapeLength;
  const positions = cycles.map((c) => c.startId);
  const timeline: LockstepStep[] = [];
  let ip = 0;

  for (let step = 0; step <= limit; step += 1) {
    timeline.push(
      Object.freeze({
        step,
        nodeIds: Object.freeze([...positions]),
        allTargets: positions.every((id) => isGhostTargetLabel(network.labelOf(id))),
      }),
    );
    for (let g = 0; g < positions.length; g += 1) {
      positions[g] = network.stepFrom(positions[g]!, ip);
    }
    ip = ip + 1 === tapeLen ? 0 : ip + 1;
  }
  return Object.freeze(timeline);
}

/** Produces a bounded sequence of trace frames for the Day 8 Part 2 convergence process. */
export function traceHauntedWastelandPart2(
  network: WastelandNetwork,
  options?: TraceOptions,
): readonly GhostConvergenceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const plan = analyzeGhostConvergence(network);
  const timeline = buildLockstepTimeline(network, plan.cycles, plan.answer);

  const rawSpecs: RawFrameSpec[] = [
    { stage: 'discovery', mergeStep: undefined },
    ...plan.mergeSteps.map((mergeStep) => ({ stage: 'merge' as const, mergeStep })),
    { stage: 'converged', mergeStep: undefined },
  ];

  const sampled = sampleTraceIndices(rawSpecs.length, maxSteps);
  return Object.freeze(
    sampled.map((rawIdx, idx) => {
      const spec = rawSpecs[rawIdx]!;
      return new GhostConvergenceFrame(
        idx,
        sampled.length,
        spec.stage,
        plan,
        spec.mergeStep,
        timeline,
      );
    }),
  );
}
