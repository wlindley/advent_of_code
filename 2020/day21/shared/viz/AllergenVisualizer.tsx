import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  type AllergenAssessmentSolver,
  type AllergenTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
} from '../index';
import { IntersectionMatrixSvg } from './IntersectionMatrixSvg';
import { PeelingMatrixSvg } from './PeelingMatrixSvg';

export interface AllergenVisualizerProps<TAnswer, TTrace extends AllergenTraceFrame> {
  readonly rawInput: string;
  readonly solver: AllergenAssessmentSolver<TAnswer, TTrace>;
}

type TraceResult<TTrace> =
  | { readonly ok: true; readonly frames: readonly TTrace[] }
  | { readonly ok: false; readonly message: string };

function buildTrace<TAnswer, TTrace extends AllergenTraceFrame>(
  rawInput: string,
  solver: AllergenAssessmentSolver<TAnswer, TTrace>,
): TraceResult<TTrace> {
  try {
    const doc = solver.parse(rawInput);
    const trace = solver.trace(doc, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames: trace };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function AllergenTelemetry({ label, frame }: { readonly label: string; readonly frame: AllergenTraceFrame }) {
  const statusClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  if (frame.kind === 'intersection') {
    return (
      <div className="meta-row">
        <span className="badge">{label}</span>
        <span className={`badge ${statusClass}`}>{`Food ${frame.scannedCount} / ${frame.totalFoods}${frame.isFinal ? ' · Final' : ''}`}</span>
        <span className="badge">{`Safe ingredients: ${frame.safeCount} / ${frame.doc.ingredientCount}`}</span>
        <span className="badge">{`Safe appearances: ${frame.runningSafeAppearances}`}</span>
      </div>
    );
  }
  return (
    <div className="meta-row">
      <span className="badge">{label}</span>
      <span className={`badge ${statusClass}`}>{`Round ${frame.roundNumber} / ${frame.totalRounds}${frame.isFinal ? ' · Final' : ''}`}</span>
      <span className="badge">{`Locked: ${frame.lockedCount} / ${frame.doc.allergenCount}`}</span>
      <span className="badge">{`List: ${frame.canonicalDangerousSoFar || '—'}`}</span>
    </div>
  );
}

/** Shared interactive visualizer for AoC 2020 Day 21 Parts 1 and 2. */
export function AllergenVisualizer<TAnswer, TTrace extends AllergenTraceFrame>({
  rawInput,
  solver,
}: AllergenVisualizerProps<TAnswer, TTrace>) {
  const state = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <AllergenTelemetry label={solver.policy.label} frame={frame} />
      {frame.kind === 'intersection' ? <IntersectionMatrixSvg frame={frame} /> : <PeelingMatrixSvg frame={frame} />}
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
