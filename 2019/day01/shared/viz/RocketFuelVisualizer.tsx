import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type FuelPolicy,
  type FuelTraceFrame,
  type ModuleManifest,
} from '../index';
import { FuelCascadeSvg } from './FuelCascadeSvg';

interface RocketFuelVisualizerProps {
  readonly rawInput: string;
  readonly policy: FuelPolicy;
  readonly solver: Required<PuzzleSolver<ModuleManifest, number, FuelTraceFrame>>;
}

type TraceState =
  | {
      readonly ok: true;
      readonly manifest: ModuleManifest;
      readonly frames: readonly FuelTraceFrame[];
      readonly totalFuel: number;
    }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  solver: Required<PuzzleSolver<ModuleManifest, number, FuelTraceFrame>>,
): TraceState {
  try {
    const manifest = solver.parse(rawInput);
    const frames = solver.trace(manifest, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const totalFuel = solver.solve(manifest);
    return { ok: true, manifest, frames, totalFuel };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({
  frame,
  manifest,
  sampledCount,
  policyLabel,
}: {
  readonly frame: FuelTraceFrame;
  readonly manifest: ModuleManifest;
  readonly sampledCount: number;
  readonly policyLabel: string;
}) {
  return (
    <div className="meta-row">
      <span className="badge">{policyLabel}</span>
      <span className="badge">Module #{frame.moduleIndex + 1} / {manifest.count}</span>
      <span className="badge">Mass: {frame.mass.toLocaleString()}</span>
      <span className="badge status-solved">Fuel: {frame.moduleFuel.toLocaleString()}</span>
      <span className="badge">Total Mass: {manifest.totalMass.toLocaleString()}</span>
      {manifest.count > sampledCount && (
        <span className="muted">Sampled {sampledCount} of {manifest.count} modules</span>
      )}
    </div>
  );
}

/** Shared interactive telemetry visualizer for AoC 2019 Day 1 Parts 1 and 2. */
export function RocketFuelVisualizer({ rawInput, policy, solver }: RocketFuelVisualizerProps) {
  const traceState = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 180);

  if (!traceState.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {traceState.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  return (
    <div className="stack">
      <TelemetryBadges
        frame={frame}
        manifest={traceState.manifest}
        sampledCount={frames.length}
        policyLabel={policy.label}
      />
      <FuelCascadeSvg
        manifest={traceState.manifest}
        frame={frame}
        totalFuel={traceState.totalFuel}
        policyLabel={policy.label}
      />
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
