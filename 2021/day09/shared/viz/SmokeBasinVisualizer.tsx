import { useMemo } from 'react';
import { usePlayback } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type SmokeBasinSolver, type SmokeBasinTraceFrame } from '../index';
import { BathymetryCanvas } from './BathymetryCanvas';
import { SmokeBasinTelemetry } from './SmokeBasinTelemetry';

export interface SmokeBasinVisualizerProps {
  readonly rawInput: string;
  readonly solver: SmokeBasinSolver;
}

type VisualizerModel =
  | { readonly ok: true; readonly answer: number; readonly frames: readonly SmokeBasinTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildModel(rawInput: string, solver: SmokeBasinSolver): VisualizerModel {
  try {
    const heightmap = solver.parse(rawInput);
    const answer = solver.solve(heightmap);
    const frames = solver.trace(heightmap, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answer, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Shared interactive Smoke Basin visualizer parameterized by a `SmokeBasinSolver`. */
export function SmokeBasinVisualizer({ rawInput, solver }: SmokeBasinVisualizerProps) {
  const model = useMemo(() => buildModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 180);
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
      <SmokeBasinTelemetry
        policy={solver.policy}
        frame={activeFrame}
        totalSteps={frames.length}
        answer={model.answer}
        playback={playback}
      />
      <div className="card" style={{ marginBottom: 0 }}>
        <BathymetryCanvas frame={activeFrame} />
      </div>
    </div>
  );
}
