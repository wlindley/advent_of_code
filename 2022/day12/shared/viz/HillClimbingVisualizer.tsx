import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  computeReverseBfs,
  DEFAULT_MAX_TRACE_STEPS,
  type HeightMap,
  type HillClimbTraceFrame,
  type ReverseBfsField,
  type StartCondition,
} from '../index';
import { ElevationCanvas } from './ElevationCanvas';

export interface HillClimbingVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<HeightMap, number, HillClimbTraceFrame>;
  readonly condition: StartCondition;
}

type VizState =
  | {
      readonly ok: true;
      readonly map: HeightMap;
      readonly field: ReverseBfsField;
      readonly frames: readonly HillClimbTraceFrame[];
      readonly winningPath: readonly number[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<HeightMap, number, HillClimbTraceFrame>,
  condition: StartCondition,
): VizState {
  try {
    const map = solver.parse(rawInput);
    const field = computeReverseBfs(map);
    const frames = solver.trace?.(map, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    const winStart = field.findNearestStart(map, condition);
    const winningPath = winStart === null ? [] : field.reconstructPath(winStart);
    return { ok: true, map, field, frames, winningPath };
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

function KpiBadges({ map, frame, condition, frameCount }: {
  readonly map: HeightMap;
  readonly frame: HillClimbTraceFrame;
  readonly condition: StartCondition;
  readonly frameCount: number;
}) {
  return (
    <div className="meta-row" style={{ marginBottom: '0.6rem' }}>
      <span className="badge">Grid: <code>{map.rows}×{map.cols}</code></span>
      <span className="badge">Mode: <code>{condition.label}</code></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Distance: <code>{frame.distance} / {frame.maxDistance}</code>
      </span>
      <span className="badge">Frontier: <code>{frame.frontierCount}</code></span>
      <span className="badge">Reached: <code>{frame.reachedCount} / {map.size}</code></span>
      {frame.winningDistance !== null ? (
        <span className={`badge ${frame.winningStartReached ? 'status-solved' : ''}`}>
          Shortest Steps: <strong>{frame.winningDistance}</strong>
        </span>
      ) : (
        <span className="badge status-blocked">Unreachable</span>
      )}
      {frameCount < frame.maxDistance + 1 && (
        <span className="muted">Sampled {frameCount} of {frame.maxDistance + 1} waves</span>
      )}
    </div>
  );
}

/** Interactive reverse-BFS wavefront and elevation path visualizer. */
export function HillClimbingVisualizer({ rawInput, solver, condition }: HillClimbingVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver, condition), [rawInput, solver, condition]);
  const frameCount = state.ok ? state.frames.length : 0;
  const playback = usePlayback(frameCount, rawInput, 140);

  if (!state.ok) return <p className="error-text">Cannot visualize input: {state.message}</p>;
  const frame = state.frames[playback.step];
  if (!frame) return <p className="muted">No trace frames available.</p>;

  return (
    <div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frameCount}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frameCount - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
      <KpiBadges map={state.map} frame={frame} condition={condition} frameCount={frameCount} />
      <ElevationCanvas
        map={state.map}
        field={state.field}
        frame={frame}
        winningPath={state.winningPath}
      />
    </div>
  );
}
