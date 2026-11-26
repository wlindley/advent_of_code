import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  parseExpenseReport,
  TARGET_EXPENSE_SUM,
  traceKSumSearch,
  type ExpenseEntry,
  type KSumTraceFrame,
} from '../index';
import { ExpenseBarChart } from './ExpenseBarChart';
import { SumDeltaGauge } from './SumDeltaGauge';

export interface ExpenseRepairVisualizerProps {
  readonly rawInput: string;
  readonly tupleSize: number;
}

type TraceState =
  | { readonly ok: true; readonly sorted: readonly ExpenseEntry[]; readonly frames: readonly KSumTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(rawInput: string, tupleSize: number): TraceState {
  try {
    const report = parseExpenseReport(rawInput);
    const sorted = report.sortedEntries();
    const frames = traceKSumSearch(report, tupleSize, TARGET_EXPENSE_SUM, DEFAULT_MAX_TRACE_STEPS);
    return { ok: true, sorted, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export function ExpenseRepairVisualizer({ rawInput, tupleSize }: ExpenseRepairVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput, tupleSize), [rawInput, tupleSize]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge">k = {tupleSize}</span>
        <span className="badge">Entries: {state.sorted.length}</span>
        <span className="badge">Target: {TARGET_EXPENSE_SUM}</span>
        <span className="badge">
          Pointers: [{frame.selectedPositions.join(', ')}]
        </span>
      </div>
      <ExpenseBarChart sorted={state.sorted} frame={frame} />
      <SumDeltaGauge frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
