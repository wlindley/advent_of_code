import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import type { CpuTimeline, CycleSnapshot } from './timeline';

/** Default frame cap matching a full 40x6 CRT refresh (240 cycles). */
export const DEFAULT_MAX_TRACE_STEPS = 240;

/** Immutable register X observation at a specific probe cycle. */
export class ProbeReading {
  readonly cycle: number;
  readonly xDuring: number;

  constructor(cycle: number, xDuring: number) {
    if (!Number.isSafeInteger(cycle) || cycle < 1) {
      throw new RangeError(`Probe cycle must be a positive safe integer, got ${cycle}`);
    }
    if (!Number.isSafeInteger(xDuring)) {
      throw new RangeError(`Probe xDuring must be a safe integer, got ${xDuring}`);
    }
    this.cycle = cycle;
    this.xDuring = xDuring;
    Object.freeze(this);
  }

  /** Signal strength (cycle * xDuring), guarded against safe-integer overflow. */
  get signalStrength(): number {
    const product = this.cycle * this.xDuring;
    if (!Number.isSafeInteger(product)) {
      throw new RangeError(`Signal strength overflowed safe integer range at cycle ${this.cycle}`);
    }
    return product;
  }
}

/** Immutable visualization trace frame for a single sampled cycle. */
export class CrtTraceFrame {
  readonly snapshot: CycleSnapshot;
  readonly totalCycles: number;
  readonly completedProbes: readonly ProbeReading[];

  constructor(
    snapshot: CycleSnapshot,
    totalCycles: number,
    completedProbes: readonly ProbeReading[],
  ) {
    if (!Number.isSafeInteger(totalCycles) || totalCycles < snapshot.cycle) {
      throw new RangeError(
        `totalCycles must be a safe integer >= snapshot.cycle (${snapshot.cycle}), got ${totalCycles}`,
      );
    }
    this.snapshot = snapshot;
    this.totalCycles = totalCycles;
    this.completedProbes = Object.freeze([...completedProbes]);
    Object.freeze(this);
  }

  /** 1-based cycle index of this frame. */
  get cycle(): number {
    return this.snapshot.cycle;
  }

  /** True when this frame lands on a sampled probe cycle. */
  get isProbeCycle(): boolean {
    return this.completedProbes.some((probe) => probe.cycle === this.snapshot.cycle);
  }

  /** Cumulative signal strength across all probes completed up to this frame. */
  get cumulativeSignalStrength(): number {
    let sum = 0;
    for (const probe of this.completedProbes) {
      const next = sum + probe.signalStrength;
      if (!Number.isSafeInteger(next)) {
        throw new RangeError('Cumulative signal strength overflowed safe integer range');
      }
      sum = next;
    }
    return sum;
  }

  /** True on the terminal cycle of the timeline. */
  get isComplete(): boolean {
    return this.snapshot.cycle === this.totalCycles;
  }
}

/** Samples all valid probe cycles <= timeline.totalCycles in caller order. */
export function sampleTimelineProbes(
  timeline: CpuTimeline,
  probeCycles: readonly number[],
): readonly ProbeReading[] {
  const readings: ProbeReading[] = [];
  for (const cycle of probeCycles) {
    if (!Number.isSafeInteger(cycle) || cycle < 1) {
      throw new RangeError(`Probe cycle must be a positive safe integer, got ${cycle}`);
    }
    if (cycle <= timeline.totalCycles) {
      readings.push(new ProbeReading(cycle, timeline.xDuringCycle(cycle)));
    }
  }
  return Object.freeze(readings);
}

/** Builds a bounded, uniformly sampled array of CrtTraceFrame objects. */
export function buildCrtTrace(
  timeline: CpuTimeline,
  probeCycles: readonly number[],
  options?: TraceOptions,
): readonly CrtTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const probes = sampleTimelineProbes(timeline, probeCycles);
  const indices = sampleTraceIndices(timeline.totalCycles, limit);

  const frames = indices.map((idx) => {
    const cycle = idx + 1;
    const completed = probes.filter((probe) => probe.cycle <= cycle);
    return new CrtTraceFrame(timeline.snapshotAt(cycle), timeline.totalCycles, completed);
  });
  return Object.freeze(frames);
}
