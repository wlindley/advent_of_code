import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  CpuProgram,
  CpuTimeline,
  CrtTraceFrame,
  buildCrtTrace,
  sampleTimelineProbes,
} from '../../shared';

/** Official Part 1 clock-cycle probe instants. */
export const STANDARD_PROBE_CYCLES: readonly number[] = Object.freeze([20, 60, 100, 140, 180, 220]);

/** Sums signal strengths across all valid probe cycles within timeline.totalCycles. */
export function sumSignalStrengths(
  timeline: CpuTimeline,
  probeCycles: readonly number[] = STANDARD_PROBE_CYCLES,
): number {
  const probes = sampleTimelineProbes(timeline, probeCycles);
  let sum = 0;
  for (const probe of probes) {
    const next = sum + probe.signalStrength;
    if (!Number.isSafeInteger(next)) {
      throw new RangeError('Signal strength sum overflowed safe integer range');
    }
    sum = next;
  }
  return sum;
}

/** Pure Part 1 solver summing signal strengths at cycles 20, 60, 100, 140, 180, and 220. */
export const solver: PuzzleSolver<CpuProgram, number, CrtTraceFrame> = Object.freeze({
  parse: (raw: string) => CpuProgram.parse(raw),
  solve: (program: CpuProgram) => sumSignalStrengths(CpuTimeline.execute(program)),
  trace: (program: CpuProgram, options?: TraceOptions) =>
    buildCrtTrace(CpuTimeline.execute(program), STANDARD_PROBE_CYCLES, options),
});
