import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  type Blueprint,
  buildFactoryTrace,
  DEFAULT_TRACE_MAX_STEPS,
  type FactoryMode,
  type FactoryTraceFrame,
} from '../index';
import { BlueprintChart } from './BlueprintChart';
import { BlueprintSummaryTable } from './BlueprintSummaryTable';

export interface FactoryVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<readonly Blueprint[], number, FactoryTraceFrame>;
  readonly timeLimit: number;
  readonly mode: FactoryMode;
  readonly partLabel: string;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly FactoryTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<readonly Blueprint[], number, FactoryTraceFrame>,
  timeLimit: number,
  mode: FactoryMode,
): VizState {
  try {
    const blueprints = solver.parse(rawInput);
    const frames = solver.trace
      ? solver.trace(blueprints, { maxSteps: DEFAULT_TRACE_MAX_STEPS })
      : buildFactoryTrace(blueprints, timeLimit, mode, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
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

function findFrameForBlueprint(frames: readonly FactoryTraceFrame[], bpIdx: number): number {
  let match = -1;
  for (let i = 0; i < frames.length; i += 1) {
    if (frames[i]!.activeBlueprintIndex === bpIdx) match = i;
  }
  if (match >= 0) return match;
  return frames.findIndex((f) => f.activeBlueprintIndex >= bpIdx);
}

/** Shared interactive blueprint optimization & timeline visualizer for Day 19 Parts 1 & 2. */
export function FactoryVisualizer({
  rawInput,
  solver,
  timeLimit,
  mode,
  partLabel,
}: FactoryVisualizerProps) {
  const state = useMemo(
    () => buildVizState(rawInput, solver, timeLimit, mode),
    [rawInput, solver, timeLimit, mode],
  );
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 120);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const snap = frame.activeSnapshot;
  const aggLabel = mode === 'quality-sum' ? 'Quality Sum' : 'Geode Product';

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge">{partLabel}</span>
        <span className="badge">
          Blueprint <code>#{frame.activeResult.blueprint.id}</code> ({frame.activeBlueprintIndex + 1}/{frame.results.length})
        </span>
        <span className="badge">
          Minute <code>{snap.minute} / {frame.timeLimit}</code>
        </span>
        <span className="badge">
          Build: <code>{snap.action ?? 'wait'}</code>
        </span>
        <span className="badge status-solved">
          {aggLabel}: <strong className="gold"><code>{frame.runningAggregate.toLocaleString()} / {frame.finalAggregate.toLocaleString()}</code></strong>
        </span>
      </div>
      <BlueprintChart
        blueprintId={frame.activeResult.blueprint.id}
        timeLimit={frame.timeLimit}
        snapshots={frame.snapshots}
        activeMinute={snap.minute}
      />
      <BlueprintSummaryTable
        results={frame.results}
        activeIndex={frame.activeBlueprintIndex}
        mode={mode}
        onSelectBlueprint={(bpIdx) => {
          const target = findFrameForBlueprint(frames, bpIdx);
          if (target >= 0) handleStepChange(playback, target);
        }}
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
