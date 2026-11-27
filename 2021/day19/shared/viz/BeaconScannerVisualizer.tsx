import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type BeaconScannerSolver,
  type BeaconTraceFrame,
} from '../index';
import { TrenchProjectionSvg } from './TrenchProjectionSvg';
import { TrenchTelemetry } from './TrenchTelemetry';

export interface BeaconScannerVisualizerProps {
  readonly rawInput: string;
  readonly solver: BeaconScannerSolver;
}

type VisualizerModel =
  | { readonly ok: true; readonly answerText: string; readonly frames: readonly BeaconTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVisualizerModel(rawInput: string, solver: BeaconScannerSolver): VisualizerModel {
  try {
    const reports = solver.parse(rawInput);
    const answer = solver.solve(reports);
    const frames = solver.trace(reports, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answerText: solver.formatAnswer(answer), frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive step-by-step 3D scanner alignment and beacon map visualizer. */
export function BeaconScannerVisualizer({ rawInput, solver }: BeaconScannerVisualizerProps) {
  const model = useMemo(() => buildVisualizerModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.mode}:${rawInput}`, 420);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize scanner alignment: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <TrenchTelemetry
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
      <TrenchProjectionSvg frame={activeFrame} />
    </div>
  );
}
