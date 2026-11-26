import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type MarkerSolver, type MarkerTraceFrame } from '../trace';
import { SignalTapeSvg } from './SignalTapeSvg';

export interface SignalTapeVisualizerProps {
  readonly rawInput: string;
  readonly solver: MarkerSolver;
  readonly markerLabel: string;
  readonly accentColor: string;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly MarkerTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceResult(rawInput: string, solver: MarkerSolver): TraceResult {
  try {
    const buffer = solver.parse(rawInput);
    const frames = solver.trace(buffer, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
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

function TelemetryHeader({ frame, markerLabel, accentColor }: { readonly frame: MarkerTraceFrame; readonly markerLabel: string; readonly accentColor: string }) {
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: accentColor, color: accentColor }}>{markerLabel} · K={frame.windowSize}</span>
      <span className="badge">Processed: <code>{frame.position} / {frame.totalVisited}</code></span>
      <span className="badge">Window: <code>{frame.windowText}</code> ({frame.windowLength}/{frame.windowSize})</span>
      <span className="badge">Collisions: <code>{frame.collisionCount}</code></span>
      {frame.isMarkerFound && <span className="badge status-solved">Locked at <strong>{frame.position}</strong></span>}
      {frame.totalVisited > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalVisited} chars</span>
      )}
    </div>
  );
}

/** Interactive signal tape and alphabet register playback visualizer for Day 6. */
export function SignalTapeVisualizer({ rawInput, solver, markerLabel, accentColor }: SignalTapeVisualizerProps) {
  const state = useMemo(() => buildTraceResult(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <TelemetryHeader frame={frame} markerLabel={markerLabel} accentColor={accentColor} />
      <SignalTapeSvg frame={frame} accentColor={accentColor} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
