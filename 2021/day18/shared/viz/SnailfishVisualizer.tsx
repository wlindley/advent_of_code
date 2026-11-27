import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type SnailfishSolver,
  type SnailfishTraceFrame,
} from '../index';
import { DepthBarChart } from './DepthBarChart';
import { SnailfishTelemetry } from './SnailfishTelemetry';

export interface SnailfishVisualizerProps {
  readonly rawInput: string;
  readonly solver: SnailfishSolver;
}

type SnailfishModel =
  | { readonly ok: true; readonly answerText: string; readonly frames: readonly SnailfishTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildSnailfishModel(rawInput: string, solver: SnailfishSolver): SnailfishModel {
  try {
    const homework = solver.parse(rawInput);
    const answer = solver.solve(homework);
    const frames = solver.trace(homework, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answerText: solver.formatAnswer(answer), frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive step-by-step snailfish addition and reduction visualizer. */
export function SnailfishVisualizer({ rawInput, solver }: SnailfishVisualizerProps) {
  const model = useMemo(() => buildSnailfishModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.mode}:${rawInput}`, 160);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize snailfish homework: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <SnailfishTelemetry
          frame={activeFrame}
          policyLabel={solver.policy.label}
          answerText={model.answerText}
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
      <DepthBarChart frame={activeFrame} />
    </div>
  );
}
