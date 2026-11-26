import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MAX_HISTOGRAM_BINS,
  OrbitMap,
  binDepthHistogram,
  computeDepthHistogram,
  computeOrbitTreeLayout,
  type HistogramBin,
  type OrbitQueryPolicy,
  type OrbitTraceFrame,
  type OrbitTreeLayout,
} from '../index';
import { DepthHistogramSvg } from './DepthHistogramSvg';
import { OrbitSummaryStrip } from './OrbitSummaryStrip';
import { OrbitTreeSvg } from './OrbitTreeSvg';

export interface OrbitMapVisualizerProps {
  readonly rawInput: string;
  readonly policy: OrbitQueryPolicy;
  readonly solver: Required<PuzzleSolver<OrbitMap, number, OrbitTraceFrame>>;
}

type VizState =
  | {
      readonly ok: true;
      readonly map: OrbitMap;
      readonly answer: number;
      readonly frames: readonly OrbitTraceFrame[];
      readonly bins: readonly HistogramBin[];
      readonly layout: OrbitTreeLayout | null;
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: Required<PuzzleSolver<OrbitMap, number, OrbitTraceFrame>>,
): VizState {
  try {
    const map = solver.parse(rawInput);
    const answer = solver.solve(map);
    const frames = solver.trace(map, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const bins = binDepthHistogram(computeDepthHistogram(map), MAX_HISTOGRAM_BINS);
    const layout = computeOrbitTreeLayout(map, 760, 380);
    return { ok: true, map, answer, frames, bins, layout };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Shared interactive visualizer for AoC 2019 Day 6 orbit trees and transfer paths. */
export function OrbitMapVisualizer({ rawInput, policy, solver }: OrbitMapVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${policy.id}:${rawInput}`, 200);

  if (!state.ok || frames.length === 0) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize orbit map: {state.ok ? 'No trace frames available' : state.message}
        </p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const activeTransferDepths = new Set<number>(
    frame.kind === 'transfer' ? frame.traversedNodeIds.map((id) => state.map.depthOfId(id)) : [],
  );

  return (
    <div className="stack">
      <OrbitSummaryStrip
        map={state.map}
        policy={policy}
        answer={state.answer}
        frame={frame}
        sampledCount={frames.length}
        layoutShown={state.layout !== null}
      />
      {state.layout !== null && <OrbitTreeSvg layout={state.layout} frame={frame} />}
      <DepthHistogramSvg
        bins={state.bins}
        frame={frame}
        activeTransferDepths={activeTransferDepths}
        maxDepth={state.map.maxDepth}
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
