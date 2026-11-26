import { useMemo, useState } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  parsePipeMaze,
  traceMainLoop,
  type MainLoop,
  type PipeMaze,
} from '../../shared';
import { PipeMazeCanvas, type ClutterMode } from '../../shared/viz/PipeMazeCanvas';
import { analyzeEnclosedTiles, buildEnclosedScanTrace, type EnclosedScanFrame } from '../domain';

type VizData =
  | {
      readonly ok: true;
      readonly maze: PipeMaze;
      readonly loop: MainLoop;
      readonly enclosedMask: Uint8Array;
      readonly totalEnclosed: number;
      readonly frames: readonly EnclosedScanFrame[];
    }
  | { readonly ok: false; readonly message: string };

interface ScanHudProps {
  readonly maze: PipeMaze;
  readonly frame: EnclosedScanFrame;
  readonly totalEnclosed: number;
  readonly clutterMode: ClutterMode;
  readonly onToggleClutter: () => void;
}

function buildVizData(rawInput: string): VizData {
  try {
    const maze = parsePipeMaze(rawInput);
    const loop = traceMainLoop(maze);
    const analysis = analyzeEnclosedTiles(maze, loop);
    const frames = buildEnclosedScanTrace(analysis, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return {
      ok: true,
      maze,
      loop,
      enclosedMask: analysis.copyMask(),
      totalEnclosed: analysis.count,
      frames,
    };
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

function ScanHud({ maze, frame, totalEnclosed, clutterMode, onToggleClutter }: ScanHudProps) {
  const scanComplete = frame.row >= frame.totalRows - 1;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <span className="badge">Grid: <strong>{maze.rows}×{maze.cols}</strong></span>
        <span className="badge" style={{ borderColor: 'var(--accent)' }}>Inferred S: <strong>{maze.inferredStartTile}</strong></span>
        <span className="badge" style={{ borderColor: 'var(--accent)' }}>
          Scan Row: <strong>{frame.row + 1}/{frame.totalRows}</strong> (N-crossings: {frame.northCrossings}, +{frame.enclosedInRow})
        </span>
        <span className="badge" style={{ borderColor: scanComplete ? 'var(--ok)' : 'var(--gold)' }}>
          Enclosed: <strong className={scanComplete ? 'ok' : 'gold'}>{frame.cumulativeEnclosed}</strong>/{totalEnclosed}
        </span>
      </div>
      <button type="button" aria-pressed={clutterMode === 'hide'} onClick={onToggleClutter}>
        {clutterMode === 'dim' ? 'Hide Clutter' : 'Dim Clutter'}
      </button>
    </div>
  );
}

/** Interactive row-parity interior enclosure visualizer for 2023 Day 10 Part 2. */
export function PipeMazePart2Visualizer({ rawInput }: VisualizerProps) {
  const [clutterMode, setClutterMode] = useState<ClutterMode>('dim');
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const frames = data.ok ? data.frames : [];
  const playback = usePlayback(frames.length, rawInput, 180);
  const activeFrame = frames[playback.step];

  if (!data.ok) {
    return <p className="error-text">Unable to visualize input: {data.message}</p>;
  }
  if (!activeFrame) {
    return <p className="muted">No scan rows to visualize.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text)' }}>
      <ScanHud
        maze={data.maze}
        frame={activeFrame}
        totalEnclosed={data.totalEnclosed}
        clutterMode={clutterMode}
        onToggleClutter={() => setClutterMode((m) => (m === 'dim' ? 'hide' : 'dim'))}
      />
      <PipeMazeCanvas
        maze={data.maze}
        loop={data.loop}
        clutterMode={clutterMode}
        enclosedMask={data.enclosedMask}
        revealedUpToRow={activeFrame.row}
        activeScanRow={activeFrame.row}
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
