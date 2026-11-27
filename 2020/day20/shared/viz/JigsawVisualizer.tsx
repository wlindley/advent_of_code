import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type JigsawPuzzle,
  type JigsawSolver,
  type JigsawTraceFrame,
} from '../index';
import { JigsawCanvas } from './JigsawCanvas';

export interface JigsawVisualizerProps {
  readonly rawInput: string;
  readonly solver: JigsawSolver;
}

type TraceState =
  | { readonly ok: true; readonly puzzle: JigsawPuzzle; readonly frames: readonly JigsawTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(rawInput: string, solver: JigsawSolver): TraceState {
  try {
    const puzzle = solver.parse(rawInput);
    const frames = solver.trace(puzzle, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, puzzle, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({
  solver,
  frame,
}: {
  readonly solver: JigsawSolver;
  readonly frame: JigsawTraceFrame;
}) {
  const isMonsters = frame.phase === 'monsters';
  const isCorners = frame.phase === 'corners';

  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{solver.policy.label}</span>
      <span className="badge">{`${frame.gridSide}×${frame.gridSide} (${frame.tileSize}×${frame.tileSize})`}</span>
      <span className="badge">{`Phase: ${frame.phase}`}</span>
      <span className="badge">{`Tiles ${frame.placedCount} / ${frame.totalTiles}`}</span>
      <span className="badge">{`Step ${frame.stepIndex + 1} / ${frame.totalSteps}`}</span>
      {isMonsters ? (
        <>
          <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
            {`Monsters: ${frame.monsterCount}`}
          </span>
          <span className="badge status-solved">{`Roughness: ${frame.waterRoughness}`}</span>
        </>
      ) : (
        <>
          <span className="badge">{`Corners: ${frame.cornerIds.join(' × ')}`}</span>
          <span
            className="badge"
            style={isCorners ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : undefined}
          >
            {`Product: ${frame.cornerProduct.toString()}`}
          </span>
        </>
      )}
    </div>
  );
}

/** Interactive step-playback visualizer for AoC 2020 Day 20 Parts 1 and 2. */
export function JigsawVisualizer({ rawInput, solver }: JigsawVisualizerProps) {
  const resetKey = `${solver.policy.id}:${rawInput}`;
  const state = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, resetKey, 140);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">
          {`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <TelemetryBadges solver={solver} frame={frame} />
      <JigsawCanvas frame={frame} />
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
