import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { computeFiniteDistances } from './gardenBfs';
import type { GardenMap } from './gardenMap';

export const DEFAULT_MAX_TRACE_STEPS = 128;

export interface GardenTraceFrame {
  readonly step: number;
  readonly totalSteps: number;
  readonly reachableCount: number;
  readonly frontierCount: number;
  readonly parity: 'even' | 'odd';
  readonly caption: string;
}

function buildCaption(
  step: number,
  totalSteps: number,
  reachableCount: number,
  frontierCount: number,
  parity: 'even' | 'odd',
  isolated: boolean,
): string {
  if (step === 0) return 'Step 0: Start at S (1 plot, even parity)';
  if (isolated) return `Step ${step}/${totalSteps}: Isolated S — 0 plots reachable (${parity} parity)`;
  return `Step ${step}/${totalSteps}: ${reachableCount} reachable (${frontierCount} on wavefront, ${parity} parity)`;
}

function computeParityCumulative(histogram: readonly number[], isolated: boolean): Int32Array {
  const cumulative = new Int32Array(histogram.length);
  let even = 0;
  let odd = 0;
  for (let d = 0; d < histogram.length; d += 1) {
    const count = histogram[d]!;
    if (d % 2 === 0) {
      even += count;
      cumulative[d] = even;
    } else {
      odd += count;
      cumulative[d] = odd;
    }
  }
  if (isolated) cumulative.fill(0, 1);
  return cumulative;
}

/** Builds sampled finite-grid BFS trace frames from step 0 through `steps` without cloning grids. */
export function buildGardenTrace(
  map: GardenMap,
  steps: number,
  options?: TraceOptions,
): readonly GardenTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const histogram = computeFiniteDistances(map, steps).distanceHistogram();
  const isolated = steps >= 1 && histogram[1] === 0;
  const cumulative = computeParityCumulative(histogram, isolated);
  const sampled = sampleTraceIndices(steps + 1, limit);
  const frames: GardenTraceFrame[] = [];
  for (let i = 0; i < sampled.length; i += 1) {
    const step = sampled[i]!;
    const parity = step % 2 === 0 ? 'even' : 'odd';
    const reachableCount = cumulative[step]!;
    const frontierCount = isolated && step > 0 ? 0 : histogram[step]!;
    frames.push(
      Object.freeze({
        step,
        totalSteps: steps,
        reachableCount,
        frontierCount,
        parity,
        caption: buildCaption(step, steps, reachableCount, frontierCount, parity, isolated),
      }),
    );
  }
  return Object.freeze(frames);
}
