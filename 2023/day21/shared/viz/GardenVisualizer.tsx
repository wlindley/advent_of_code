import { useMemo } from 'react';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  buildGardenTrace,
  computeFiniteDistances,
  DEFAULT_MAX_TRACE_STEPS,
  type FiniteDistanceMap,
  type GardenMap,
  type GardenTraceFrame,
  parseGardenMap,
} from '../index';
import { GardenCanvas } from './GardenCanvas';

export interface GardenVisualizerProps {
  readonly rawInput: string;
  readonly steps: number;
  readonly partLabel: string;
}

type VizData =
  | {
      readonly ok: true;
      readonly map: GardenMap;
      readonly distMap: FiniteDistanceMap;
      readonly frames: readonly GardenTraceFrame[];
      readonly answer: number;
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string, steps: number): VizData {
  try {
    const map = parseGardenMap(rawInput);
    const distMap = computeFiniteDistances(map, steps);
    const answer = distMap.countReachableAt(steps);
    const frames = buildGardenTrace(map, steps, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, map, distMap, frames, answer };
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

/** Interactive finite-grid garden BFS parity and wavefront visualizer. */
export function GardenVisualizer({ rawInput, steps, partLabel }: GardenVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput, steps), [rawInput, steps]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, `${rawInput}:${steps}`, 140);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) return <p className="error-text" role="alert">Invalid garden map: {data.message}</p>;
  if (!activeFrame) return <p className="muted">No trace frames available to visualize.</p>;

  const bannerColor = activeFrame.frontierCount > 0 ? 'var(--accent)' : 'var(--gold)';

  return (
    <div className="stack">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          <strong>{partLabel}</strong>
        </span>
        <span className="badge">
          Grid: <strong>{data.map.width}×{data.map.height}</strong>
        </span>
        <span className="badge">
          Step: <strong>{activeFrame.step} / {activeFrame.totalSteps}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Reachable: <strong>{activeFrame.reachableCount}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Wavefront: <strong>{activeFrame.frontierCount}</strong>
        </span>
        <span className="badge">
          Parity: <strong>{activeFrame.parity}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Target ({steps}): <strong>{data.answer}</strong>
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
      <GardenCanvas map={data.map} distMap={data.distMap} frame={activeFrame} />
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
