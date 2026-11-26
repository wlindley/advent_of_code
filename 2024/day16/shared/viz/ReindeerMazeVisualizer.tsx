import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type MazeTraceFrame, type ReindeerMaze } from '../index';
import { ReindeerMazeCanvas } from './ReindeerMazeCanvas';

export interface ReindeerMazeVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<ReindeerMaze, number, MazeTraceFrame>;
  readonly partLabel: string;
  readonly showAllOptimalTiles: boolean;
  readonly maxTraceSteps?: number;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly MazeTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const BASE_LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['Wall #', '#1e293b'],
  ['Start S', '#059669'],
  ['End E', '#e11d48'],
  ['Dijkstra wave', '#67e8f9'],
  ['Optimal path', '#d97706'],
];

function buildTraceState(
  rawInput: string,
  solver: PuzzleSolver<ReindeerMaze, number, MazeTraceFrame>,
  maxSteps: number,
): TraceState {
  try {
    const maze = solver.parse(rawInput);
    const frames = solver.trace?.(maze, { maxSteps }) ?? [];
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function ReindeerMazeHud({
  frame,
  partLabel,
  showAllOptimalTiles,
}: {
  readonly frame: MazeTraceFrame;
  readonly partLabel: string;
  readonly showAllOptimalTiles: boolean;
}) {
  const { analysis } = frame.context;
  const { maze } = analysis;
  const isComplete = frame.phase === 'complete';
  const phaseColor = isComplete ? 'var(--ok)' : 'var(--accent)';
  const metricLabel = showAllOptimalTiles ? 'Best Seats' : 'Lowest Score';
  const metricValue = showAllOptimalTiles
    ? analysis.optimalTileCount
    : analysis.isReachable
      ? analysis.bestScore
      : 'Unreachable';

  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">{partLabel}</span>
      <span className="badge">Grid: <code>{maze.width}×{maze.height}</code></span>
      <span className="badge" style={{ borderColor: phaseColor, color: phaseColor }}>
        Phase: <code>{frame.phase}</code>
      </span>
      <span className="badge">Frontier Cost: <code>{frame.frontierCost}</code></span>
      <span className="badge">Settled: <code>{frame.settledCount}/{analysis.settledCount}</code></span>
      <span className={isComplete ? 'badge status-solved' : 'badge'} style={isComplete ? { borderColor: 'var(--gold)' } : undefined}>
        {metricLabel}: <strong className={isComplete ? 'gold' : undefined}><code>{metricValue}</code></strong>
      </span>
    </div>
  );
}

function ReindeerMazeLegend({ showAllOptimalTiles }: { readonly showAllOptimalTiles: boolean }) {
  const items = showAllOptimalTiles
    ? [...BASE_LEGEND, ['Optimal seat', '#f59e0b'] as const]
    : BASE_LEGEND;
  return (
    <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
      {items.map(([label, color]) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: color, border: '1px solid var(--border)' }} />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Interactive Dijkstra exploration and optimal-path visualizer for Reindeer Maze. */
export function ReindeerMazeVisualizer({
  rawInput,
  solver,
  partLabel,
  showAllOptimalTiles,
  maxTraceSteps = DEFAULT_MAX_TRACE_STEPS,
}: ReindeerMazeVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput, solver, maxTraceSteps), [rawInput, solver, maxTraceSteps]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${partLabel}`, 120);

  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const frame = state.frames[playback.step];
  if (!frame) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <ReindeerMazeHud frame={frame} partLabel={partLabel} showAllOptimalTiles={showAllOptimalTiles} />
      <ReindeerMazeCanvas frame={frame} showAllOptimalTiles={showAllOptimalTiles} />
      <ReindeerMazeLegend showAllOptimalTiles={showAllOptimalTiles} />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(next) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(next);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
