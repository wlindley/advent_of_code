import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  traceCavernPath,
  type CavernRiskSolver,
  type CavernTraceFrame,
} from '../index';
import { CavernCanvas } from './CavernCanvas';
import { CavernTelemetry } from './CavernTelemetry';

export interface CavernVisualizerProps {
  readonly rawInput: string;
  readonly solver: CavernRiskSolver;
}

type CavernModel =
  | { readonly ok: true; readonly answerText: string; readonly frames: readonly CavernTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildCavernModel(rawInput: string, solver: CavernRiskSolver): CavernModel {
  try {
    const grid = solver.parse(rawInput);
    const result = solver.analyze(grid);
    const frames = traceCavernPath(result, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answerText: solver.formatAnswer(result.totalRisk), frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive Chiton lowest-risk wavefront and optimal-path visualizer. */
export function CavernVisualizer({ rawInput, solver }: CavernVisualizerProps) {
  const model = useMemo(() => buildCavernModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.tileFactor}:${rawInput}`, 140);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize cavern: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <CavernTelemetry frame={activeFrame} answerText={model.answerText} />
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
      <CavernCanvas frame={activeFrame} />
    </div>
  );
}
