import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import type { ForestGrid } from '../../shared';
import { CanopySightlineSvg } from '../../shared/viz/CanopySightlineSvg';
import { DEFAULT_MAX_TRACE_STEPS, solver, VisibilityTraceFrame } from '../domain';

type TraceResult =
  | { readonly ok: true; readonly forest: ForestGrid; readonly frames: readonly VisibilityTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const DIR_PHASE_LABELS = ['UP (top→bottom)', 'RIGHT (right→left)', 'DOWN (bottom→top)', 'LEFT (left→right)'] as const;

function buildTraceResult(rawInput: string): TraceResult {
  try {
    const forest = solver.parse(rawInput);
    const frames = solver.trace(forest, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, forest, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function TelemetryHeader({ frame }: { readonly frame: VisibilityTraceFrame }) {
  const axis = frame.activeDir === 0 || frame.activeDir === 2 ? 'row' : 'col';
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Pass: {DIR_PHASE_LABELS[frame.activeDir]} · {axis} {frame.wavefrontCoord}
      </span>
      <span className="badge">
        Wavefront: <code>{frame.rawStep + 1} / {frame.totalRawSteps}</code>
      </span>
      <span className="badge">
        New at line: <code>+{frame.newlyVisibleCount}</code>
      </span>
      <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
        Visible: <strong>{frame.cumulativeVisibleCount}</strong> / {frame.totalVisibleCount}
      </span>
      {frame.totalRawSteps > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalRawSteps} steps</span>
      )}
    </div>
  );
}

/** Interactive 4-pass monotonic-stack visibility wavefront visualizer for 2022 Day 8 Part 1. */
export function TreeVisibilityVisualizer({ rawInput }: VisualizerProps) {
  const [selectedCoord, setSelectedCoord] = useState<readonly [number, number] | null>(null);
  const state = useMemo(() => buildTraceResult(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 180);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const validSelected =
    selectedCoord && state.forest.inBounds(selectedCoord[0], selectedCoord[1]) ? selectedCoord : null;

  return (
    <div>
      <TelemetryHeader frame={frame} />
      <CanopySightlineSvg
        forest={state.forest}
        sightlines={frame.sightlines}
        mode="visibility"
        isCellHighlighted={(r, c) => frame.isTreeRevealed(r, c)}
        wavefront={frame.isComplete ? null : { dir: frame.activeDir, coord: frame.wavefrontCoord }}
        selectedCoord={validSelected}
        onSelectCoord={setSelectedCoord}
      />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
