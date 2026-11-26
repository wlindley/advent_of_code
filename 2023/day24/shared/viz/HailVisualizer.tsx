import { useMemo } from 'react';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  buildHailTrace2D,
  DEFAULT_MAX_TRACE_STEPS,
  type HailTrace2DFrame,
  type PairIntersection,
  parseHailstones,
  type TestArea,
} from '../index';
import { Hail2DCanvas } from './Hail2DCanvas';

export interface HailVisualizerProps {
  readonly rawInput: string;
  readonly area: TestArea;
  readonly areaLabel: string;
}

type VizData =
  | { readonly ok: true; readonly stoneCount: number; readonly frames: readonly HailTrace2DFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string, area: TestArea): VizData {
  try {
    const stones = parseHailstones(rawInput);
    const frames = buildHailTrace2D(stones, area, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, stoneCount: stones.length, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatActivePair(pair: PairIntersection | null): string {
  if (!pair) return 'Initial ray projection before pair classification';
  if (pair.kind === 'parallel') return `Pair (${pair.indexA}, ${pair.indexB}): parallel XY velocities`;
  return `Pair (${pair.indexA}, ${pair.indexB}): ${pair.kind}`;
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

/** Interactive 2D hailstone ray intersection visualizer using PlaybackControls. */
export function HailVisualizer({ rawInput, area, areaLabel }: HailVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput, area), [rawInput, area]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, `${rawInput}:${areaLabel}`, 120);
  const frame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) return <p className="error-text" role="alert">Invalid hailstones: {data.message}</p>;
  if (!frame) return <p className="muted">No trace frames available.</p>;

  const s = frame.summary;
  const borderAccent = frame.activePair?.kind === 'inside' ? 'var(--ok)' : 'var(--accent)';

  return (
    <div className="stack">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          <strong>{areaLabel}</strong>
        </span>
        <span className="badge">Hailstones: <strong>{data.stoneCount}</strong></span>
        <span className="badge">Pairs: <strong>{frame.step} / {frame.totalPairs}</strong></span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Inside: <strong>{s.inside}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Outside: <strong>{s.outside}</strong>
        </span>
        <span className="badge">Past: <strong>{s.pastA + s.pastB + s.pastBoth}</strong></span>
        <span className="badge">Parallel: <strong>{s.parallel}</strong></span>
      </div>
      <div
        style={{
          padding: '0.45rem 0.7rem',
          borderRadius: '6px',
          border: `1px solid ${borderAccent}`,
          background: 'var(--surface)',
          color: 'var(--text)',
          fontWeight: 600,
          fontSize: '0.88rem',
        }}
      >
        {formatActivePair(frame.activePair)}
      </div>
      <Hail2DCanvas frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalFrames}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={(next) => jumpToStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
