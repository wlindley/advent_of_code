import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  parseForestMap,
  traceTrajectories,
  type ForestMap,
  type Slope,
  type TrajectoryTraceFrame,
} from '../index';
import { ForestTrajectoryCanvas } from './ForestTrajectoryCanvas';
import { SlopeScoreboard } from './SlopeScoreboard';

export interface TobogganTrajectoryVisualizerProps {
  readonly rawInput: string;
  readonly slopes: readonly Slope[];
}

type TrajectoryTraceState =
  | { readonly ok: true; readonly forest: ForestMap; readonly frames: readonly TrajectoryTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrajectoryTrace(rawInput: string, slopes: readonly Slope[]): TrajectoryTraceState {
  try {
    const forest = parseForestMap(rawInput);
    const frames = traceTrajectories(forest, slopes, DEFAULT_MAX_TRACE_STEPS);
    return { ok: true, forest, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TrajectoryMetaRow({ forest, frame }: { forest: ForestMap; frame: TrajectoryTraceFrame }) {
  const singleSlope = frame.slopes.length === 1;
  return (
    <div className="meta-row">
      <span className="badge">Forest: {forest.cols} x {forest.rows}</span>
      <span className="badge">Row {frame.row + 1} / {frame.totalRows}</span>
      <span className="badge status-solved">
        {singleSlope ? `Trees hit: ${frame.treeProduct}` : `Tree product: ${frame.treeProduct}`}
      </span>
    </div>
  );
}

/** Interactive step-by-step toboggan trajectory visualizer shared across Day 3 parts. */
export function TobogganTrajectoryVisualizer({ rawInput, slopes }: TobogganTrajectoryVisualizerProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const state = useMemo(() => buildTrajectoryTrace(rawInput, slopes), [rawInput, slopes]);
  const frames = state.ok ? state.frames : [];
  const resetKey = `${slopes.map((s) => s.label).join('|')}:${rawInput}`;
  const playback = usePlayback(frames.length, resetKey, 160);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>
      </div>
    );
  }

  const safeFocused = Math.min(focusedIndex, Math.max(0, frame.slopes.length - 1));

  return (
    <div className="stack">
      <TrajectoryMetaRow forest={state.forest} frame={frame} />
      <ForestTrajectoryCanvas forest={state.forest} frame={frame} focusedIndex={safeFocused} />
      <SlopeScoreboard frame={frame} focusedIndex={safeFocused} onFocusSlope={setFocusedIndex} />
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
