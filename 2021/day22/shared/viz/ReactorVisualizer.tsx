import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  computeSceneBounds,
  DEFAULT_MAX_TRACE_STEPS,
  INITIALIZATION_REGION,
  type Cuboid,
  type ReactorSolver,
  type ReactorTraceFrame,
  type SceneBounds,
} from '../index';
import { ReactorIsoSvg } from './ReactorIsoSvg';

export interface ReactorVisualizerProps {
  readonly rawInput: string;
  readonly solver: ReactorSolver;
}

type TraceModel =
  | {
      readonly ok: true;
      readonly frames: readonly ReactorTraceFrame[];
      readonly bounds: SceneBounds;
      readonly regionBox: Cuboid | null;
    }
  | { readonly ok: false; readonly message: string };

function buildTraceModel(rawInput: string, solver: ReactorSolver): TraceModel {
  try {
    const steps = solver.parse(rawInput);
    const frames = solver.trace(steps, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const regionBox = solver.policy.mode === 'initialization' ? INITIALIZATION_REGION : null;
    const sceneCuboids: Cuboid[] = regionBox !== null ? [regionBox] : [];
    for (const frame of frames) {
      if (frame.clippedCuboid !== null) sceneCuboids.push(frame.clippedCuboid);
      for (const c of frame.activeCuboids) sceneCuboids.push(c);
    }
    const bounds = computeSceneBounds(
      sceneCuboids.length > 0 ? sceneCuboids : [INITIALIZATION_REGION],
    );
    return { ok: true, frames, bounds, regionBox };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatDelta(delta: bigint): string {
  return delta >= 0n ? `+${delta.toLocaleString()}` : delta.toLocaleString();
}

function TelemetryBadges({
  frame,
  delta,
}: {
  readonly frame: ReactorTraceFrame;
  readonly delta: bigint;
}) {
  const actionColor = frame.skipped
    ? 'var(--muted)'
    : frame.step.action === 'on'
      ? 'var(--ok)'
      : 'var(--err)';
  const actionLabel = frame.skipped
    ? `${frame.step.action.toUpperCase()} (skipped)`
    : frame.step.action.toUpperCase();

  return (
    <div className="meta-row" aria-label="Reactor reboot telemetry">
      <span className="badge">
        Step {frame.stepIndex + 1} / {frame.totalSteps}
      </span>
      <span className="badge" style={{ borderColor: actionColor, color: actionColor }}>
        Action {actionLabel}
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        ON Cubes {frame.onCount.toLocaleString()}
      </span>
      <span className="badge">Delta {formatDelta(delta)}</span>
      <span className="badge">Disjoint Cuboids {frame.cuboidCount}</span>
    </div>
  );
}

/** Interactive 3D isometric Reactor Reboot visualizer shared by Part 1 and Part 2. */
export function ReactorVisualizer({ rawInput, solver }: ReactorVisualizerProps) {
  const model = useMemo(() => buildTraceModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.mode}:${rawInput}`, 200);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize reactor reboot: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  const prevOn = playback.step > 0 ? frames[playback.step - 1]!.onCount : 0n;
  const delta = activeFrame.onCount - prevOn;

  return (
    <div className="stack">
      <TelemetryBadges frame={activeFrame} delta={delta} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
      <figure className="chart-card">
        <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
          <strong>3D Isometric Reactor Core</strong>
          <span className="chart-sub muted">
            {solver.policy.mode === 'initialization' ? 'Initialization [-50..50]³' : 'Full Reactor Grid'}
          </span>
        </div>
        <ReactorIsoSvg frame={activeFrame} bounds={model.bounds} regionBox={model.regionBox} />
      </figure>
    </div>
  );
}
