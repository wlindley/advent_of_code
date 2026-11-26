import { useMemo } from 'react';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  buildHikeTrace,
  contractTrailGraph,
  DEFAULT_MAX_TRACE_STEPS,
  findLongestPath,
  type HikeTraceFrame,
  type LongestPathResult,
  parseTrailMap,
  type TrailGraph,
  type TrailMap,
} from '../index';
import { TrailCanvas } from './TrailCanvas';

export interface TrailVisualizerProps {
  readonly rawInput: string;
  readonly ignoreSlopes: boolean;
}

type VizData =
  | {
      readonly ok: true;
      readonly map: TrailMap;
      readonly graph: TrailGraph;
      readonly result: LongestPathResult | null;
      readonly frames: readonly HikeTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string, ignoreSlopes: boolean): VizData {
  try {
    const map = parseTrailMap(rawInput);
    const graph = contractTrailGraph(map, ignoreSlopes);
    const result = findLongestPath(graph);
    const frames = buildHikeTrace(map, graph, result, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, map, graph, result, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

/** Interactive trail contraction and longest-walk search visualizer. */
export function TrailVisualizer({ rawInput, ignoreSlopes }: TrailVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput, ignoreSlopes), [rawInput, ignoreSlopes]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, `${rawInput}:${ignoreSlopes}`, 160);

  if (!data.ok) {
    return <p className="error-text" role="alert">Invalid trail map: {data.message}</p>;
  }
  const activeFrame = data.frames[playback.step];
  if (!activeFrame) {
    return <p className="muted">No trace frames available to visualize.</p>;
  }

  const bestSteps = data.result === null ? '—' : data.result.distance;
  const prunedCount = data.result === null ? 0 : data.result.prunedBranches;
  const bannerColor = activeFrame.phase === 'hike'
    ? 'var(--ok)'
    : activeFrame.phase === 'search'
      ? 'var(--gold)'
      : 'var(--accent)';

  return (
    <div className="stack">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          <strong>{ignoreSlopes ? 'Part 2: Dry Slopes' : 'Part 1: Icy Slopes'}</strong>
        </span>
        <span className="badge">Grid: <strong>{data.map.rows}×{data.map.cols}</strong></span>
        <span className="badge">Junctions: <strong>{data.graph.vertexCount}</strong></span>
        <span className="badge">Corridors: <strong>{data.graph.edgeCount}</strong></span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Steps: <strong>{activeFrame.distance} / {bestSteps}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Pruned: <strong>{prunedCount}</strong>
        </span>
      </div>
      <div
        style={{
          padding: '0.45rem 0.7rem',
          borderRadius: '6px',
          border: `1px solid ${bannerColor}`,
          background: 'var(--surface)',
          color: 'var(--text)',
          fontWeight: 600,
          fontSize: '0.88rem',
        }}
      >
        {activeFrame.caption}
      </div>
      <TrailCanvas
        map={data.map}
        graph={data.graph}
        frame={activeFrame}
        ignoreSlopes={ignoreSlopes}
      />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalFrames}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={(s) => jumpToStep(playback, s)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
