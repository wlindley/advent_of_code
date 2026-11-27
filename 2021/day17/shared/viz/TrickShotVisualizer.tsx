import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  traceTrickShot,
  type TrickShotSolver,
  type TrickShotTraceFrame,
} from '../index';
import { BallisticArcSvg } from './BallisticArcSvg';
import { TrickShotTelemetry } from './TrickShotTelemetry';
import { VelocityPhaseSpaceSvg } from './VelocityPhaseSpaceSvg';

export interface TrickShotVisualizerProps {
  readonly rawInput: string;
  readonly solver: TrickShotSolver;
}

type TrickShotModel =
  | { readonly ok: true; readonly answerText: string; readonly frames: readonly TrickShotTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrickShotModel(rawInput: string, solver: TrickShotSolver): TrickShotModel {
  try {
    const target = solver.parse(rawInput);
    const analysis = solver.analyze(target);
    const answer = solver.policy.compute(analysis);
    const frames = traceTrickShot(analysis, solver.policy, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answerText: solver.formatAnswer(answer), frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive ballistic sweep and launch trajectory visualizer for Trick Shot. */
export function TrickShotVisualizer({ rawInput, solver }: TrickShotVisualizerProps) {
  const model = useMemo(() => buildTrickShotModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.mode}:${rawInput}`, 140);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize target area: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <TrickShotTelemetry frame={activeFrame} answerText={model.answerText} />
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
        <BallisticArcSvg frame={activeFrame} />
        <VelocityPhaseSpaceSvg frame={activeFrame} />
      </div>
    </div>
  );
}
