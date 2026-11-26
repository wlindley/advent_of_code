import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  type CircuitBlueprint,
  type CircuitLayout,
  computeCircuitLayout,
  DEFAULT_MAX_TRACE_STEPS,
  type PulseTraceFrame,
} from '../index';
import { PulseCircuitSvg } from './PulseCircuitSvg';

export interface PulseCircuitVisualizerProps<TAnswer = unknown> {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<CircuitBlueprint, TAnswer, PulseTraceFrame>;
  readonly partLabel: string;
}

type VizData =
  | {
      readonly ok: true;
      readonly answerText: string;
      readonly layout: CircuitLayout;
      readonly frames: readonly PulseTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizData<TAnswer>(
  rawInput: string,
  solver: PuzzleSolver<CircuitBlueprint, TAnswer, PulseTraceFrame>,
): VizData {
  try {
    const blueprint = solver.parse(rawInput);
    const answerText = String(solver.solve(blueprint));
    const layout = computeCircuitLayout(blueprint);
    const frames = solver.trace?.(blueprint, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, answerText, layout, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function TelemetryBadges({
  frame,
  step,
  totalFrames,
  answerText,
  partLabel,
}: {
  readonly frame: PulseTraceFrame;
  readonly step: number;
  readonly totalFrames: number;
  readonly answerText: string;
  readonly partLabel: string;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        <strong>{partLabel}</strong>
      </span>
      <span className="badge">
        Frame: <strong>{step + 1} / {totalFrames}</strong> (raw {frame.stepIndex + 1}/{frame.totalRawSteps})
      </span>
      <span className="badge">
        Press: <strong>{frame.press}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Low: <strong>{frame.lowTotal}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        High: <strong>{frame.highTotal}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Answer: <strong>{answerText}</strong>
      </span>
    </div>
  );
}

/** Shared interactive circuit pulse visualizer for AoC 2023 Day 20 Parts 1 & 2. */
export function PulseCircuitVisualizer<TAnswer>({
  rawInput,
  solver,
  partLabel,
}: PulseCircuitVisualizerProps<TAnswer>) {
  const data = useMemo(() => buildVizData(rawInput, solver), [rawInput, solver]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 180);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) return <p className="error-text" role="alert">Invalid circuit input: {data.message}</p>;
  if (!activeFrame) return <p className="muted">No trace frames available to visualize.</p>;

  const bannerColor = activeFrame.activePulse
    ? activeFrame.activePulse.pulse === 'low'
      ? 'var(--accent)'
      : 'var(--gold)'
    : 'var(--border)';

  return (
    <div className="stack">
      <TelemetryBadges frame={activeFrame} step={playback.step} totalFrames={totalFrames} answerText={data.answerText} partLabel={partLabel} />
      <div
        style={{
          padding: '0.45rem 0.7rem',
          borderRadius: '6px',
          border: `1px solid ${bannerColor}`,
          background: 'var(--surface)',
          color: activeFrame.activePulse ? bannerColor : 'var(--text)',
          fontWeight: 600,
          fontSize: '0.88rem',
        }}
      >
        {activeFrame.caption}
      </div>
      <PulseCircuitSvg layout={data.layout} frame={activeFrame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalFrames}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={(s) => jumpToStep(playback, s)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
