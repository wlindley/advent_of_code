import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls } from '../../../../shared/viz/PlaybackControls';
import { usePlayback, type PlaybackState } from '../../../../shared/viz/usePlayback';
import type { WastelandNetwork } from '../network';
import { DEFAULT_MAX_TRACE_STEPS, type WastelandTraceFrame } from '../trace';
import { FullNetworkSvg } from './FullNetworkSvg';
import { LocalDecisionHubSvg } from './LocalDecisionHubSvg';
import { TapeRibbon } from './TapeRibbon';

export interface WastelandVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<WastelandNetwork, number, WastelandTraceFrame>;
}

type TraceResult =
  | { readonly ok: true; readonly frames: readonly WastelandTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(
  rawInput: string,
  solver: PuzzleSolver<WastelandNetwork, number, WastelandTraceFrame>,
): TraceResult {
  try {
    const network = solver.parse(rawInput);
    const frames = solver.trace!(network, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
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

function renderTelemetry(frame: WastelandTraceFrame, sampledCount: number) {
  const totalStates = frame.totalSteps + 1;
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">Step: <strong>{frame.step} / {frame.totalSteps}</strong></span>
      <span className="badge" style={{ borderColor: frame.isGoal ? 'var(--ok)' : 'var(--accent)' }}>
        Node: <strong>{frame.nodeLabel}</strong>
      </span>
      <span className="badge">IP: <strong>{frame.nextTapeIndex} / {frame.network.tapeLength}</strong></span>
      <span className="badge">Laps: <strong className="gold">{frame.completedLaps}</strong></span>
      <span className="badge">Nodes: <strong>{frame.network.nodeCount}</strong></span>
      {totalStates > sampledCount && (
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          Sampled {sampledCount} of {totalStates} states
        </span>
      )}
    </div>
  );
}

export function WastelandVisualizer({ rawInput, solver }: WastelandVisualizerProps) {
  const trace = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = trace.ok ? trace.frames : [];
  const playback = usePlayback(frames.length, rawInput, 360);
  const activeFrame = frames[playback.step];

  if (!trace.ok) return <p className="error-text">Unable to visualize input: {trace.message}</p>;
  if (!activeFrame) return <p className="muted">No wasteland steps to visualize.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {renderTelemetry(activeFrame, frames.length)}
      <TapeRibbon frame={activeFrame} />
      {activeFrame.network.nodeCount <= 20 ? (
        <FullNetworkSvg frame={activeFrame} />
      ) : (
        <LocalDecisionHubSvg frame={activeFrame} />
      )}
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
