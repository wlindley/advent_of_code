import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type IncidenceTraceFrame,
  type MirrorPattern,
} from '../index';
import { MirrorGridSvg } from './MirrorGridSvg';

export interface IncidenceVisualizerProps {
  readonly rawInput: string;
  readonly targetSmudges: number;
  readonly solver: PuzzleSolver<readonly MirrorPattern[], number, IncidenceTraceFrame>;
}

type VizData =
  | { readonly ok: true; readonly totalPatterns: number; readonly frames: readonly IncidenceTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizData(
  rawInput: string,
  solver: PuzzleSolver<readonly MirrorPattern[], number, IncidenceTraceFrame>,
): VizData {
  try {
    const patterns = solver.parse(rawInput);
    const frames = solver.trace?.(patterns, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, totalPatterns: patterns.length, frames };
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

function formatSmudges(frame: IncidenceTraceFrame): string {
  return frame.match.mismatches
    .map((p) => `(${p.near.row + 1},${p.near.col + 1})<->(${p.far.row + 1},${p.far.col + 1})`)
    .join(', ');
}

function TelemetryBadges({
  totalPatterns,
  targetSmudges,
  frame,
}: {
  readonly totalPatterns: number;
  readonly targetSmudges: number;
  readonly frame: IncidenceTraceFrame;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">Patterns: <strong>{totalPatterns}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Smudges: <strong>{targetSmudges}</strong></span>
      <span className="badge">Pattern: <strong>#{frame.patternIndex + 1} / {frame.totalPatterns}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Axis: <strong>{frame.match.orientation} @ {frame.match.index}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Score: <strong>{frame.match.score}</strong></span>
      <span className="badge">Cumulative: <strong>{frame.cumulativeScore}</strong></span>
      {frame.match.smudgeCount > 0 && (
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Smudge: <strong>{formatSmudges(frame)}</strong>
        </span>
      )}
    </div>
  );
}

function PatternSelectorStrip({
  frames,
  activeStep,
  onSelectStep,
}: {
  readonly frames: readonly IncidenceTraceFrame[];
  readonly activeStep: number;
  readonly onSelectStep: (step: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }} role="listbox" aria-label="Sampled mirror patterns">
      {frames.map((frame, idx) => {
        const isActive = idx === activeStep;
        const axisCode = `${frame.match.orientation === 'vertical' ? 'V' : 'H'}${frame.match.index}`;
        return (
          <button
            key={frame.patternIndex}
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={() => onSelectStep(idx)}
            className={isActive ? 'primary' : undefined}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}
          >
            #{frame.patternIndex + 1} · {axisCode}
          </button>
        );
      })}
    </div>
  );
}

/** Interactive reflection-axis visualizer for Point of Incidence mirror fields. */
export function IncidenceVisualizer({ rawInput, targetSmudges, solver }: IncidenceVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput, solver), [rawInput, solver]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, `${rawInput}:${targetSmudges}`, 220);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) {
    return <p className="error-text" role="alert">Invalid mirror patterns: {data.message}</p>;
  }
  if (!activeFrame) {
    return <p className="muted">No mirror patterns available to visualize.</p>;
  }

  return (
    <div className="stack">
      <TelemetryBadges totalPatterns={data.totalPatterns} targetSmudges={targetSmudges} frame={activeFrame} />
      <PatternSelectorStrip frames={data.frames} activeStep={playback.step} onSelectStep={(s) => jumpToStep(playback, s)} />
      <MirrorGridSvg pattern={activeFrame.pattern} match={activeFrame.match} />
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
