import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import { DishPlatform } from '../../shared';

/** Default cap on sampled column-settling trace frames. */
export const DEFAULT_MAX_TRACE_STEPS = 80;

export interface Part1TraceStep {
  readonly step: number;
  readonly settledColumns: number;
  readonly platform: DishPlatform;
}

/** Composes a snapshot where columns `[0, settledColumns)` are tilted north and the rest stay initial. */
export function composePlatformSnapshot(
  before: DishPlatform,
  after: DishPlatform,
  beforeLines: readonly string[],
  afterLines: readonly string[],
  settledColumns: number,
): DishPlatform {
  if (settledColumns === 0) return before;
  if (settledColumns === before.width) return after;
  const lines: string[] = [];
  for (let r = 0; r < beforeLines.length; r += 1) {
    lines.push(afterLines[r]!.slice(0, settledColumns) + beforeLines[r]!.slice(settledColumns));
  }
  return DishPlatform.fromLines(lines);
}

/** Builds a bounded trace of left-to-right column settling under a north tilt. */
export function traceNorthTilt(
  platform: DishPlatform,
  options?: TraceOptions,
): readonly Part1TraceStep[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const after = platform.tilt('north');
  const beforeLines = platform.toLines();
  const afterLines = after.toLines();
  const sampled = sampleTraceIndices(platform.width + 1, limit);
  const frames: Part1TraceStep[] = [];
  for (let step = 0; step < sampled.length; step += 1) {
    const settledColumns = sampled[step]!;
    frames.push(
      Object.freeze({
        step,
        settledColumns,
        platform: composePlatformSnapshot(platform, after, beforeLines, afterLines, settledColumns),
      }),
    );
  }
  return Object.freeze(frames);
}
