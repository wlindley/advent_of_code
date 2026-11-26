import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import { countArrangements } from './dp';
import { validateUnfoldFactor, type SpringRecord } from './record';

/** Default cap on sampled frames emitted by `buildHotSpringsTrace`. */
export const DEFAULT_MAX_TRACE_STEPS = 80;

/** Lightweight playback snapshot for one sampled spring condition record. */
export interface HotSpringsTraceFrame {
  readonly rowIndex: number;
  readonly totalRows: number;
  readonly record: SpringRecord;
  readonly arrangements: bigint;
  readonly cumulativeTotal: bigint;
}

/**
 * Computes arrangement counts across all `records` (unfolded by `unfoldFactor`)
 * and emits uniformly sampled, frozen trace frames bounded by `maxSteps`.
 */
export function buildHotSpringsTrace(
  records: readonly SpringRecord[],
  unfoldFactor: number,
  options?: TraceOptions,
): readonly HotSpringsTraceFrame[] {
  const factor = validateUnfoldFactor(unfoldFactor);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  if (records.length === 0) return Object.freeze([]);

  const sampled = sampleTraceIndices(records.length, limit);
  const frames: HotSpringsTraceFrame[] = [];
  let sampleCursor = 0;
  let cumulativeTotal = 0n;

  for (let i = 0; i < records.length; i += 1) {
    const unfolded = records[i]!.unfold(factor);
    const arrangements = countArrangements(unfolded);
    cumulativeTotal += arrangements;
    if (sampled[sampleCursor] === i) {
      frames.push(
        Object.freeze({
          rowIndex: i,
          totalRows: records.length,
          record: unfolded,
          arrangements,
          cumulativeTotal,
        }),
      );
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
