import { useMemo, useState } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_TRACE_MAX_STEPS,
  type DropletTraceFrame,
  traceTotalSurface,
  type VoxelDroplet,
} from '../index';
import { DropletIsometricCanvas } from './DropletIsometricCanvas';
import { DropletSliceCanvas } from './DropletSliceCanvas';

export interface DropletVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<VoxelDroplet, number, DropletTraceFrame>;
  readonly partLabel: string;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly DropletTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const LEGEND_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['Active Z Slice', 'var(--gold)'],
  ['Lava Cube', '#334155'],
  ['Exterior Air', 'rgba(8, 145, 178, 0.35)'],
  ['Trapped Air', 'rgba(217, 119, 6, 0.45)'],
];

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<VoxelDroplet, number, DropletTraceFrame>,
): VizState {
  try {
    const droplet = solver.parse(rawInput);
    const frames = solver.trace
      ? solver.trace(droplet, { maxSteps: DEFAULT_TRACE_MAX_STEPS })
      : traceTotalSurface(droplet, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
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

function KpiBadges({ frame, partLabel, yaw, onRotate }: {
  readonly frame: DropletTraceFrame;
  readonly partLabel: string;
  readonly yaw: number;
  readonly onRotate: () => void;
}) {
  return (
    <div className="meta-row">
      <span className="badge">{partLabel}</span>
      <span className="badge">Z Slice: <code>{frame.worldZ}</code></span>
      <span className="badge">
        Cubes: <code>{frame.cumulativeLavaCount.toLocaleString()} / {frame.droplet.cubeCount.toLocaleString()}</code>
      </span>
      <span className="badge status-solved">
        Surface: <strong className="gold"><code>{frame.cumulativeExposedFaces.toLocaleString()} / {frame.totalSurfaceArea.toLocaleString()}</code></strong>
      </span>
      {frame.mode === 'exterior' && (
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Trapped Pockets: <code>{frame.trappedAirCount} ({frame.trappedSurfaceArea} faces)</code>
        </span>
      )}
      <button type="button" onClick={onRotate}>Rotate 90° ({yaw * 90}°)</button>
    </div>
  );
}

function DropletLegend() {
  return (
    <div className="meta-row">
      {LEGEND_ITEMS.map(([label, color]) => (
        <span key={label} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Reusable interactive 3D isometric + 2D XY slice droplet visualizer for Day 18 Parts 1 & 2. */
export function DropletVisualizer({ rawInput, solver, partLabel }: DropletVisualizerProps) {
  const [yaw, setYaw] = useState(0);
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 140);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div className="stack">
      <KpiBadges frame={frame} partLabel={partLabel} yaw={yaw} onRotate={() => setYaw((y) => (y + 1) % 4)} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.9rem', alignItems: 'start' }}>
        <DropletIsometricCanvas frame={frame} yaw={yaw} />
        <DropletSliceCanvas frame={frame} />
      </div>
      <DropletLegend />
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
