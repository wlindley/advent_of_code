import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  type ConwayCubesSolver,
  DEFAULT_MAX_TRACE_STEPS,
  type PocketCycleTraceFrame,
  type PocketSlice,
} from '../index';
import { SliceCardCanvas } from './SliceCardCanvas';

export interface ConwayCubesVisualizerProps {
  readonly rawInput: string;
  readonly solver: ConwayCubesSolver;
}

type TraceState =
  | { readonly ok: true; readonly seed: PocketSlice; readonly frames: readonly PocketCycleTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildConwayTrace(rawInput: string, solver: ConwayCubesSolver): TraceState {
  try {
    const seed = solver.parse(rawInput);
    const frames = solver.trace(seed, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, seed, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({
  solver,
  seed,
  frame,
}: {
  readonly solver: ConwayCubesSolver;
  readonly seed: PocketSlice;
  readonly frame: PocketCycleTraceFrame;
}) {
  const { bounds } = frame;
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="meta-row">
        <span className="badge">{solver.policy.label}</span>
        <span className="badge">{`Seed ${seed.width}x${seed.height}`}</span>
        <span className="badge status-solved">{`Cycle ${frame.cycle} / ${frame.totalCycles}`}</span>
        <span className="badge">{`Active: ${frame.activeCount}`}</span>
        <span className="badge">{`Keep ${frame.survivingCount} | +${frame.bornCount} | -${frame.dyingCount}`}</span>
        <span className="badge muted">{`X[${bounds.xMin}..${bounds.xMax}] Y[${bounds.yMin}..${bounds.yMax}] Z[${bounds.zMin}..${bounds.zMax}]`}</span>
      </div>
      <div className="meta-row">
        <span className="badge" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Inactive (.)</span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Surviving (#)</span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Born (+)</span>
        <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>Dying (-)</span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>z = 0 Plane</span>
      </div>
    </div>
  );
}

function HyperplaneSelector({
  wValues,
  activeW,
  onSelectW,
}: {
  readonly wValues: readonly number[];
  readonly activeW: number;
  readonly onSelectW: (w: number) => void;
}) {
  if (wValues.length <= 1) return null;
  return (
    <div className="meta-row" role="group" aria-label="4D hyperplane w-coordinate selector">
      <span className="muted" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Hyperplane w:</span>
      {wValues.map((w) => (
        <button
          key={w}
          type="button"
          className={w === activeW ? 'primary' : undefined}
          onClick={() => onSelectW(w)}
        >
          {`w=${w}`}
        </button>
      ))}
    </div>
  );
}

/** Interactive multi-slice Conway Cubes cycle visualizer shared by Part 1 (3D) and Part 2 (4D). */
export function ConwayCubesVisualizer({ rawInput, solver }: ConwayCubesVisualizerProps) {
  const resetKey = `${solver.policy.id}:${rawInput}`;
  const state = useMemo(() => buildConwayTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, resetKey, 450);
  const [selectedW, setSelectedW] = useState(0);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  const wValues = frame.wValues;
  const activeW = wValues.includes(selectedW) ? selectedW : (wValues[0] ?? 0);
  const slices = frame.slicesForW(activeW);

  return (
    <div className="stack">
      <TelemetryBadges solver={solver} seed={state.seed} frame={frame} />
      <HyperplaneSelector wValues={wValues} activeW={activeW} onSelectW={setSelectedW} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '0.7rem' }}>
        {slices.map((slice) => (
          <SliceCardCanvas key={`${slice.w}:${slice.z}`} slice={slice} dimensions={frame.dimensions} />
        ))}
      </div>
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
