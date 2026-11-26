import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LEAST_COMMON_CRITERION,
  MOST_COMMON_CRITERION,
  type Bit,
  type BitCriterion,
  type BitTally,
  type DiagnosticReport,
} from '../../shared';
import { RatingSelection, createAllRowIndices, selectFilterBit } from './ratingFilter';

export { DEFAULT_MAX_TRACE_STEPS };
export const MAX_SAMPLE_ROWS = 6;

export type LaneStatus = 'active' | 'locked';

/** Immutable per-lane filtering snapshot for one step of life-support rating selection. */
export class LaneStepSnapshot {
  readonly tally: BitTally | null;
  readonly selectedBit: Bit | null;
  readonly candidateCount: number;
  readonly sampleRows: readonly string[];
  readonly lockedSelection: RatingSelection | null;

  constructor(
    tally: BitTally | null,
    selectedBit: Bit | null,
    candidateCount: number,
    sampleRows: readonly string[],
    lockedSelection: RatingSelection | null,
  ) {
    if ((tally === null) !== (selectedBit === null)) {
      throw new RangeError('tally and selectedBit must both be null or both be non-null');
    }
    if (!Number.isInteger(candidateCount) || candidateCount < 1) {
      throw new RangeError(`candidateCount must be a positive integer, got ${candidateCount}`);
    }
    this.tally = tally;
    this.selectedBit = selectedBit;
    this.candidateCount = candidateCount;
    this.sampleRows = Object.freeze([...sampleRows]);
    this.lockedSelection = lockedSelection;
    Object.freeze(this);
  }

  get status(): LaneStatus {
    return this.lockedSelection !== null ? 'locked' : 'active';
  }

  get eliminatedCount(): number {
    return this.tally === null ? 0 : this.tally.total - this.candidateCount;
  }
}

export interface LifeSupportTraceFrame {
  readonly step: number;
  readonly column: number | null;
  readonly oxygen: LaneStepSnapshot;
  readonly co2: LaneStepSnapshot;
}

interface LaneState {
  readonly candidates: readonly number[];
  readonly snapshot: LaneStepSnapshot;
}

function takeSampleRows(report: DiagnosticReport, indices: readonly number[]): readonly string[] {
  const count = Math.min(indices.length, MAX_SAMPLE_ROWS);
  const rows: string[] = [];
  for (let i = 0; i < count; i += 1) {
    rows.push(report.rowAt(indices[i]!));
  }
  return Object.freeze(rows);
}

function createInitialLaneState(report: DiagnosticReport): LaneState {
  const candidates = createAllRowIndices(report.rowCount);
  const samples = takeSampleRows(report, candidates);
  const locked = report.rowCount === 1 ? new RatingSelection(report.rowAt(0), 0, 0) : null;
  const snapshot = new LaneStepSnapshot(null, null, report.rowCount, samples, locked);
  return { candidates, snapshot };
}

function advanceLaneState(
  report: DiagnosticReport,
  criterion: BitCriterion,
  col: number,
  state: LaneState,
): LaneState {
  if (state.snapshot.lockedSelection !== null) {
    const carried = new LaneStepSnapshot(
      null,
      null,
      state.snapshot.candidateCount,
      state.snapshot.sampleRows,
      state.snapshot.lockedSelection,
    );
    return { candidates: state.candidates, snapshot: carried };
  }
  const tally = report.countBitsAtColumn(col, state.candidates);
  const selectedBit = selectFilterBit(tally, criterion);
  const next = report.filterRowsByBit(col, selectedBit, state.candidates);
  const isLocked = next.length === 1 || col === report.bitWidth - 1;
  // Invariant: selectFilterBit preserves >= 1 candidate per round.
  const locked = isLocked ? new RatingSelection(report.rowAt(next[0]!), next[0]!, col + 1) : null;
  const snapshot = new LaneStepSnapshot(tally, selectedBit, next.length, takeSampleRows(report, next), locked);
  return { candidates: next, snapshot };
}

function buildAllFrames(report: DiagnosticReport): readonly LifeSupportTraceFrame[] {
  let o2 = createInitialLaneState(report);
  let co2 = createInitialLaneState(report);
  const frames: LifeSupportTraceFrame[] = [
    Object.freeze({ step: 0, column: null, oxygen: o2.snapshot, co2: co2.snapshot }),
  ];
  if (report.rowCount === 1) {
    return Object.freeze(frames);
  }
  for (let col = 0; col < report.bitWidth; col += 1) {
    o2 = advanceLaneState(report, MOST_COMMON_CRITERION, col, o2);
    co2 = advanceLaneState(report, LEAST_COMMON_CRITERION, col, co2);
    frames.push(Object.freeze({ step: col + 1, column: col, oxygen: o2.snapshot, co2: co2.snapshot }));
    if (o2.snapshot.lockedSelection !== null && co2.snapshot.lockedSelection !== null) {
      break;
    }
  }
  return Object.freeze(frames);
}

/** Traces step-by-step parallel narrowing of oxygen and CO2 rating candidates, bounded by `options.maxSteps`. */
export function traceLifeSupport(
  report: DiagnosticReport,
  options?: TraceOptions,
): readonly LifeSupportTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const allFrames = buildAllFrames(report);
  const indices = sampleTraceIndices(allFrames.length, limit);
  const sampled: LifeSupportTraceFrame[] = [];
  for (const idx of indices) {
    sampled.push(allFrames[idx]!);
  }
  return Object.freeze(sampled);
}
