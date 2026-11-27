import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  buildPatternMatrixLayout,
  buildSpectrumLayout,
  DEFAULT_MAX_TRACE_STEPS,
  extractFrameMessage,
  FftSolver,
  type FftPolicy,
  type FftTraceFrame,
} from '../index';
import { PatternMatrixSvg } from './PatternMatrixSvg';
import { SignalSpectrumSvg } from './SignalSpectrumSvg';

interface FftVisualizerProps {
  readonly rawInput: string;
  readonly solver: FftSolver;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly FftTraceFrame[]; readonly finalAnswer: string }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, solver: FftSolver): VizState {
  try {
    const signal = solver.parse(rawInput);
    const frames = solver.trace(signal, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const finalAnswer = extractFrameMessage(frames[frames.length - 1]!);
    return { ok: true, frames, finalAnswer };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function FftHudBadges({
  policy,
  frame,
  finalAnswer,
}: {
  readonly policy: FftPolicy;
  readonly frame: FftTraceFrame;
  readonly finalAnswer: string;
}) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{policy.label}</span>
      <span className="badge">Phase {frame.phase} / {frame.totalPhases}</span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Window: {extractFrameMessage(frame)}
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Final: {finalAnswer}
      </span>
    </div>
  );
}

function FftLegend() {
  return (
    <div className="meta-row" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Message Window / Selected Row</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>+1 Weight / Signal</span>
      <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>-1 Weight</span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>0–9 Distribution</span>
    </div>
  );
}

/** Interactive light-mode FFT visualizer for AoC 2019 Day 16 Parts 1 and 2. */
export function FftVisualizer({ rawInput, solver }: FftVisualizerProps) {
  const [selectedRow, setSelectedRow] = useState(0);
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 120);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text" style={{ color: 'var(--err)' }}>Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const spectrumLayout = buildSpectrumLayout(frame);
  const matrixLayout = buildPatternMatrixLayout(frame, selectedRow);

  return (
    <div className="stack">
      <FftHudBadges policy={solver.policy} frame={frame} finalAnswer={state.finalAnswer} />
      <FftLegend />
      <div className="charts-grid">
        <SignalSpectrumSvg frame={frame} layout={spectrumLayout} />
        <PatternMatrixSvg mode={frame.mode} layout={matrixLayout} onSelectRow={setSelectedRow} />
      </div>
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
