import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type GrowthScaleMode,
  type LanternfishSolver,
  type LanternfishTraceFrame,
} from '../index';
import { CohortBarChart } from './CohortBarChart';
import { GrowthCurveChart } from './GrowthCurveChart';
import { SchoolStatsBar } from './SchoolStatsBar';

export interface LanternfishVisualizerProps {
  readonly rawInput: string;
  readonly solver: LanternfishSolver;
}

type VisualizerModel =
  | {
      readonly ok: true;
      readonly answer: bigint;
      readonly frames: readonly LanternfishTraceFrame[];
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

function buildVisualizerModel(rawInput: string, solver: LanternfishSolver): VisualizerModel {
  try {
    const school = solver.parse(rawInput);
    const answer = solver.solve(school);
    const frames = solver.trace(school, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answer, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive cohort histogram and population trajectory visualizer for Lanternfish. */
export function LanternfishVisualizer({ rawInput, solver }: LanternfishVisualizerProps) {
  const [scaleMode, setScaleMode] = useState<GrowthScaleMode>('log');
  const model = useMemo(() => buildVisualizerModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.days}:${rawInput}`, 140);
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
      <SchoolStatsBar
        frame={activeFrame}
        totalDays={solver.days}
        answer={model.answer}
        scaleMode={scaleMode}
        onToggleScale={() => setScaleMode((prev) => (prev === 'log' ? 'linear' : 'log'))}
      />
      <CohortBarChart school={activeFrame.school} spawningNext={activeFrame.spawningNext} />
      <GrowthCurveChart frames={frames} activeIndex={playback.step} scaleMode={scaleMode} />
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
