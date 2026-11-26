import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type PasswordRange,
  type PasswordTraceFrame,
  type RunLengthPolicy,
} from '../index';
import { OdometerStrip } from './OdometerStrip';

export interface SecureContainerVisualizerProps {
  readonly rawInput: string;
  readonly policy: RunLengthPolicy;
  readonly solver: Required<PuzzleSolver<PasswordRange, number, PasswordTraceFrame>>;
}

type TraceState =
  | { readonly ok: true; readonly range: PasswordRange; readonly frames: readonly PasswordTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  solver: Required<PuzzleSolver<PasswordRange, number, PasswordTraceFrame>>,
): TraceState {
  try {
    const range = solver.parse(rawInput);
    const frames = solver.trace(range, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, range, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBar({
  frame,
  policy,
  sampledCount,
}: {
  readonly frame: PasswordTraceFrame;
  readonly policy: RunLengthPolicy;
  readonly sampledCount: number;
}) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">Rule: {policy.name}</span>
      <span className="badge">
        Candidate {frame.stepIndex + 1} / {frame.totalCandidates}
      </span>
      <span className={frame.matchedCount > 0 ? 'badge status-solved' : 'badge'}>
        Matches: {frame.matchedCount}
      </span>
      <span className="badge">Rejected: {frame.rejectedCount}</span>
      {frame.totalCandidates > sampledCount && (
        <span className="muted">
          Sampled {sampledCount} of {frame.totalCandidates}
        </span>
      )}
    </div>
  );
}

function RangeProgress({ frame }: { readonly frame: PasswordTraceFrame }) {
  const offset = frame.candidate.value - frame.range.low + 1;
  return (
    <div className="progress-row" style={{ margin: 0 }}>
      <span className="muted nowrap">{frame.range.low}</span>
      <progress max={frame.range.span} value={offset} aria-label="Search range progress" />
      <span className="muted nowrap">{frame.range.high}</span>
    </div>
  );
}

function EmptyRangeNotice({ range }: { readonly range: PasswordRange }) {
  return (
    <div className="stack">
      <div
        style={{
          padding: '0.85rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
        }}
      >
        0 matches in [{range.low}, {range.high}] (no non-decreasing 6-digit candidates in range).
      </div>
    </div>
  );
}

/** Interactive Secure Container odometer visualizer shared across Day 4 Parts 1 and 2. */
export function SecureContainerVisualizer({
  rawInput,
  policy,
  solver,
}: SecureContainerVisualizerProps) {
  const traceState = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 120);

  if (!traceState.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {traceState.message}</p>
      </div>
    );
  }
  if (frames.length === 0) return <EmptyRangeNotice range={traceState.range} />;

  const frame = frames[playback.step]!;
  return (
    <div className="stack">
      <TelemetryBar frame={frame} policy={policy} sampledCount={frames.length} />
      <RangeProgress frame={frame} />
      <OdometerStrip frame={frame} policy={policy} />
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
