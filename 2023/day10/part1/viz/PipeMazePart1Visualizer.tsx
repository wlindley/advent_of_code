import { useMemo, useState } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  buildLoopWalkTrace,
  parsePipeMaze,
  traceMainLoop,
  type MainLoop,
  type PipeMaze,
  type PipeMazeTraceFrame,
} from '../../shared';
import { PipeMazeCanvas, type ClutterMode } from '../../shared/viz/PipeMazeCanvas';

type VizData =
  | {
      readonly ok: true;
      readonly maze: PipeMaze;
      readonly loop: MainLoop;
      readonly frames: readonly PipeMazeTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string): VizData {
  try {
    const maze = parsePipeMaze(rawInput);
    const loop = traceMainLoop(maze);
    const frames = buildLoopWalkTrace(loop, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, maze, loop, frames };
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

/** Interactive dual-wavefront pipe loop visualizer for 2023 Day 10 Part 1. */
export function PipeMazePart1Visualizer({ rawInput }: VisualizerProps) {
  const [clutterMode, setClutterMode] = useState<ClutterMode>('dim');
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const frames = data.ok ? data.frames : [];
  const playback = usePlayback(frames.length, rawInput, 160);
  const activeFrame = frames[playback.step];

  if (!data.ok) {
    return <p className="error-text">Unable to visualize input: {data.message}</p>;
  }
  if (!activeFrame) {
    return <p className="muted">No loop steps to visualize.</p>;
  }

  const { maze, loop } = data;
  const reachedPeak = activeFrame.distance === loop.farthestDistance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
          <span className="badge">Grid: <strong>{maze.rows}×{maze.cols}</strong></span>
          <span className="badge" style={{ borderColor: 'var(--accent)' }}>Inferred S: <strong>{maze.inferredStartTile}</strong></span>
          <span className="badge">Loop Length: <strong>{loop.length}</strong></span>
          <span className="badge" style={{ borderColor: reachedPeak ? 'var(--ok)' : 'var(--border)' }}>
            Wavefront: <strong>{activeFrame.distance}</strong> ({activeFrame.discoveredTiles}/{loop.length})
          </span>
          <span className="badge" style={{ borderColor: 'var(--gold)' }}>
            Farthest: <strong className="gold">{loop.farthestDistance}</strong>
          </span>
        </div>
        <button
          type="button"
          aria-pressed={clutterMode === 'hide'}
          onClick={() => setClutterMode((m) => (m === 'dim' ? 'hide' : 'dim'))}
        >
          {clutterMode === 'dim' ? 'Hide Clutter' : 'Dim Clutter'}
        </button>
      </div>
      <PipeMazeCanvas
        maze={maze}
        loop={loop}
        activeDistance={activeFrame.distance}
        frontA={activeFrame.frontA}
        frontB={activeFrame.frontB}
        clutterMode={clutterMode}
      />
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
