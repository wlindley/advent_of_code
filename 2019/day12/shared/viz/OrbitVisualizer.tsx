import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  computeOrbitBounds,
  DEFAULT_MAX_TRACE_FRAMES,
  NBodySolver,
  type NBodyTraceFrame,
  type OrbitBounds,
  type OrbitViewMode,
} from '../index';
import { OrbitCanvasSvg } from './OrbitCanvasSvg';
import { OrbitTelemetryPanel } from './OrbitTelemetryPanel';

export interface OrbitVisualizerProps<TAnswer, TTrace extends NBodyTraceFrame> {
  readonly rawInput: string;
  readonly solver: NBodySolver<TAnswer, TTrace>;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly NBodyTraceFrame[]; readonly bounds: OrbitBounds; readonly answerLabel: string; readonly maxMoonEnergy: number }
  | { readonly ok: false; readonly message: string };

function findMaxMoonEnergy(frames: readonly NBodyTraceFrame[]): number {
  let max = 0;
  for (const frame of frames) {
    for (const moon of frame.moons) {
      if (moon.totalEnergy > max) max = moon.totalEnergy;
    }
  }
  return max;
}

function buildVizState<TAnswer, TTrace extends NBodyTraceFrame>(
  rawInput: string, solver: NBodySolver<TAnswer, TTrace>,
): VizState {
  try {
    const system = solver.parse(rawInput);
    const answerLabel = solver.formatAnswer(solver.solve(system));
    const frames = solver.trace(system, { maxSteps: DEFAULT_MAX_TRACE_FRAMES });
    return { ok: true, frames, bounds: computeOrbitBounds(frames), answerLabel, maxMoonEnergy: findMaxMoonEnergy(frames) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive N-Body orbital and cycle visualizer shared by Day 12 Parts 1 and 2. */
export function OrbitVisualizer<TAnswer, TTrace extends NBodyTraceFrame>({
  rawInput, solver,
}: OrbitVisualizerProps<TAnswer, TTrace>) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 80);
  const [viewMode, setViewMode] = useState<OrbitViewMode>('iso');

  if (!state.ok) {
    return <div className="stack"><p className="error-text">Unable to visualize input: {state.message}</p></div>;
  }

  const frame = frames[playback.step]!;
  const stepBadge = frame.kind === 'orbit-step'
    ? `Step ${frame.step} / ${frame.totalSteps}`
    : `Step ${String(frame.step)} · ${frame.phase}`;

  return (
    <div className="stack">
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge">{solver.policy.label}</span>
          <span className="badge">{stepBadge}</span>
          <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
            Answer: {state.answerLabel}
          </span>
        </div>
        <div className="playback-buttons">
          <button type="button" className={viewMode === 'iso' ? 'primary' : ''} onClick={() => setViewMode('iso')}>
            3D Isometric
          </button>
          <button type="button" className={viewMode === 'dual' ? 'primary' : ''} onClick={() => setViewMode('dual')}>
            XY + XZ Planes
          </button>
        </div>
      </div>
      <OrbitCanvasSvg frame={frame} bounds={state.bounds} viewMode={viewMode} />
      <OrbitTelemetryPanel frame={frame} maxMoonEnergy={state.maxMoonEnergy} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay} onStepChange={playback.setStep} onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
