import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_HISTOGRAM_BINS,
  DEFAULT_LANDSCAPE_SAMPLES,
  DEFAULT_MAX_TRACE_STEPS,
  buildFuelLandscape,
  buildSwarmHistogram,
  type AlignmentSearchFrame,
  type CrabAlignmentSolver,
  type FuelLandscape,
  type SwarmHistogram,
} from '../index';
import { AlignmentStatsBar } from './AlignmentStatsBar';
import { FuelLandscapeChart } from './FuelLandscapeChart';
import { SwarmAlignmentChart } from './SwarmAlignmentChart';

export interface CrabAlignmentVisualizerProps {
  readonly rawInput: string;
  readonly solver: CrabAlignmentSolver;
}

type VisualizerModel =
  | {
      readonly ok: true;
      readonly answer: bigint;
      readonly fleetSize: number;
      readonly frames: readonly AlignmentSearchFrame[];
      readonly histogram: SwarmHistogram;
      readonly landscape: FuelLandscape;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

function buildVisualizerModel(rawInput: string, solver: CrabAlignmentSolver): VisualizerModel {
  try {
    const fleet = solver.parse(rawInput);
    const answer = solver.solve(fleet);
    const frames = solver.trace(fleet, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const histogram = buildSwarmHistogram(fleet, DEFAULT_HISTOGRAM_BINS);
    const landscape = buildFuelLandscape(fleet, solver.model, DEFAULT_LANDSCAPE_SAMPLES);
    return { ok: true, answer, fleetSize: fleet.size, frames, histogram, landscape };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive crab swarm distribution, convex fuel curve, and search playback visualizer. */
export function CrabAlignmentVisualizer({ rawInput, solver }: CrabAlignmentVisualizerProps) {
  const model = useMemo(() => buildVisualizerModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.model.id}:${rawInput}`, 220);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize input: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <AlignmentStatsBar
        frame={activeFrame}
        stepIndex={playback.step}
        totalSteps={frames.length}
        fleetSize={model.fleetSize}
        answer={model.answer}
        model={solver.model}
      />
      <div className="charts-grid">
        <SwarmAlignmentChart
          histogram={model.histogram}
          frame={activeFrame}
          optimalTarget={model.landscape.optimalTarget}
        />
        <FuelLandscapeChart landscape={model.landscape} frame={activeFrame} />
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
