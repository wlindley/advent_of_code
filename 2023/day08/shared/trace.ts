import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { Turn, WastelandNetwork } from './network';

export const DEFAULT_MAX_TRACE_STEPS = 240;
export const MAX_BREADCRUMBS = 8;

function validateStepBounds(step: number, totalSteps: number): void {
  if (!Number.isInteger(step) || step < 0) {
    throw new RangeError(`step must be a non-negative integer, got ${step}`);
  }
  if (!Number.isInteger(totalSteps) || totalSteps < step) {
    throw new RangeError(`totalSteps (${totalSteps}) must be an integer >= step (${step})`);
  }
}

function validateRecentPath(
  network: WastelandNetwork,
  step: number,
  recentPath: readonly number[],
): readonly number[] {
  if (recentPath.length < 1 || recentPath.length > MAX_BREADCRUMBS) {
    throw new Error(`recentPath length must be in [1, ${MAX_BREADCRUMBS}], got ${recentPath.length}`);
  }
  for (const id of recentPath) network.labelOf(id);
  if (step === 0) {
    if (recentPath.length !== 1) throw new Error('recentPath at step 0 must contain exactly 1 node');
  } else {
    if (recentPath.length < 2) throw new Error(`recentPath at step ${step} must contain >= 2 nodes`);
    const prevId = recentPath[recentPath.length - 2]!;
    const currId = recentPath[recentPath.length - 1]!;
    const ip = (step - 1) % network.tapeLength;
    if (network.stepFrom(prevId, ip) !== currId) {
      throw new Error(`recentPath transition inconsistent at step ${step}`);
    }
  }
  return Object.freeze([...recentPath]);
}

/** Immutable snapshot of a single sampled step in a Haunted Wasteland walk (zero stored derived state). */
export class WastelandTraceFrame {
  readonly network: WastelandNetwork;
  readonly step: number;
  readonly totalSteps: number;
  readonly recentPath: readonly number[];

  constructor(
    network: WastelandNetwork,
    step: number,
    totalSteps: number,
    recentPath: readonly number[],
  ) {
    validateStepBounds(step, totalSteps);
    this.network = network;
    this.step = step;
    this.totalSteps = totalSteps;
    this.recentPath = validateRecentPath(network, step, recentPath);
    Object.freeze(this);
  }

  get nodeId(): number {
    return this.recentPath[this.recentPath.length - 1]!;
  }

  get previousNodeId(): number | undefined {
    return this.step === 0 ? undefined : this.recentPath[this.recentPath.length - 2]!;
  }

  get nodeLabel(): string {
    return this.network.labelOf(this.nodeId);
  }

  get leftId(): number {
    return this.network.leftOf(this.nodeId);
  }

  get rightId(): number {
    return this.network.rightOf(this.nodeId);
  }

  get leftLabel(): string {
    return this.network.labelOf(this.leftId);
  }

  get rightLabel(): string {
    return this.network.labelOf(this.rightId);
  }

  get nextTapeIndex(): number {
    return this.step % this.network.tapeLength;
  }

  get nextTurn(): Turn {
    return this.network.turnAt(this.nextTapeIndex);
  }

  get lastTapeIndex(): number | undefined {
    return this.step === 0 ? undefined : (this.step - 1) % this.network.tapeLength;
  }

  get lastTurn(): Turn | undefined {
    const idx = this.lastTapeIndex;
    return idx === undefined ? undefined : this.network.turnAt(idx);
  }

  get completedLaps(): number {
    return Math.floor(this.step / this.network.tapeLength);
  }

  get isGoal(): boolean {
    return this.step === this.totalSteps;
  }
}

/** Produces a bounded, uniformly sampled trace while preserving exact 1-step breadcrumbs. */
export function traceNetworkWalk(
  network: WastelandNetwork,
  startId: number,
  isTarget: (nodeId: number) => boolean,
  options?: TraceOptions,
): readonly WastelandTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalSteps = network.findFirstTarget(startId, isTarget);
  const sampled = sampleTraceIndices(totalSteps + 1, limit);
  const frames: WastelandTraceFrame[] = [];
  const trail: number[] = [startId];
  let current = startId;
  let samplePos = 0;

  if (sampled[samplePos] === 0) {
    frames.push(new WastelandTraceFrame(network, 0, totalSteps, trail));
    samplePos += 1;
  }

  for (let step = 1; step <= totalSteps; step += 1) {
    current = network.stepFrom(current, (step - 1) % network.tapeLength);
    trail.push(current);
    if (trail.length > MAX_BREADCRUMBS) trail.shift();
    if (sampled[samplePos] === step) {
      frames.push(new WastelandTraceFrame(network, step, totalSteps, trail));
      samplePos += 1;
    }
  }

  return Object.freeze(frames);
}
