import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type FrequencyScaleMode,
  type PolymerFormula,
  type PolymerizationSolver,
  type PolymerTraceFrame,
} from '../index';
import { ActiveReactionsChart } from './ActiveReactionsChart';
import { ElementFrequencyChart } from './ElementFrequencyChart';
import { PolymerStatsBar } from './PolymerStatsBar';
import { SpreadCurveChart } from './SpreadCurveChart';

export interface PolymerizationVisualizerProps {
  readonly rawInput: string;
  readonly solver: PolymerizationSolver;
}

type VisualizerModel =
  | {
      readonly ok: true;
      readonly formula: PolymerFormula;
      readonly answer: bigint;
      readonly frames: readonly PolymerTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildModel(rawInput: string, solver: PolymerizationSolver): VisualizerModel {
  try {
    const formula = solver.parse(rawInput);
    const answer = solver.solve(formula);
    const frames = solver.trace(formula, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, formula, answer, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Shared interactive Extended Polymerization visualizer parameterized by step count. */
export function PolymerizationVisualizer({ rawInput, solver }: PolymerizationVisualizerProps) {
  const model = useMemo(() => buildModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.steps}:${rawInput}`, 220);
  const [scaleMode, setScaleMode] = useState<FrequencyScaleMode>('log');
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
      <div className="card" style={{ marginBottom: 0 }}>
        <PolymerStatsBar
          frame={activeFrame}
          targetSteps={solver.steps}
          answer={model.answer}
          scaleMode={scaleMode}
          onScaleChange={setScaleMode}
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
      <div className="charts-grid">
        <ElementFrequencyChart state={activeFrame.state} scaleMode={scaleMode} />
        <ActiveReactionsChart
          reactions={activeFrame.activeReactions}
          totalInsertions={activeFrame.insertionsNext}
        />
      </div>
      <SpreadCurveChart frames={frames} currentStep={activeFrame.step} scaleMode={scaleMode} />
    </div>
  );
}
