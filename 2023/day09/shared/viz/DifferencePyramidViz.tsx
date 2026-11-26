import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls } from '../../../../shared/viz/PlaybackControls';
import { usePlayback, type PlaybackState } from '../../../../shared/viz/usePlayback';
import type { OasisReport } from '../parser';
import { DEFAULT_MAX_TRACE_STEPS, type OasisTraceFrame } from '../trace';
import { PyramidSvg } from './PyramidSvg';

export interface DifferencePyramidVizProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<OasisReport, bigint, OasisTraceFrame>;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly OasisTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(
  rawInput: string,
  solver: PuzzleSolver<OasisReport, bigint, OasisTraceFrame>,
): TraceResult {
  try {
    const report = solver.parse(rawInput);
    const frames = solver.trace!(report, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function formatFormula(frame: OasisTraceFrame): string {
  const eq = frame.activeEquation;
  if (eq) return `${eq.anchor} ${eq.operator} ${eq.below} = ${eq.result}`;
  return frame.phase === 'baseline' ? 'Seed = 0' : `Δ Layer ${frame.activeLayer + 1}`;
}

function renderTelemetry(frame: OasisTraceFrame, sampledCount: number) {
  const phaseBorder = frame.isHistoryComplete
    ? 'var(--ok)'
    : frame.phase === 'baseline'
      ? 'var(--gold)'
      : 'var(--accent)';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">History: <strong>{frame.historyIndex + 1} / {frame.historyCount}</strong></span>
      <span className="badge">Step: <strong>{frame.step + 1} / {frame.totalSteps}</strong></span>
      <span className="badge" style={{ borderColor: phaseBorder }}>
        Phase: <strong>{frame.phase}</strong>
      </span>
      <span className="badge">Degree: <strong>{frame.pyramid.degree}</strong> · Depth: <strong>{frame.pyramid.depth}</strong></span>
      <span className="badge" style={{ borderColor: frame.activeEquation ? 'var(--ok)' : 'var(--border)' }}>
        <code>{formatFormula(frame)}</code>
      </span>
      <span className="badge">Running Total: <strong className="gold">{String(frame.runningTotal)}</strong></span>
      {frame.totalSteps > sampledCount && (
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          Sampled {sampledCount} of {frame.totalSteps} steps
        </span>
      )}
    </div>
  );
}

export function DifferencePyramidViz({ rawInput, solver }: DifferencePyramidVizProps) {
  const trace = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = trace.ok ? trace.frames : [];
  const playback = usePlayback(frames.length, rawInput, 420);
  const activeFrame = frames[playback.step];

  if (!trace.ok) return <p className="error-text">Unable to visualize input: {trace.message}</p>;
  if (!activeFrame) return <p className="muted">No extrapolation steps to visualize.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {renderTelemetry(activeFrame, frames.length)}
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)', padding: '0.5rem' }}>
        <PyramidSvg frame={activeFrame} />
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, frames.length)}
        onStepChange={(next) => selectStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
