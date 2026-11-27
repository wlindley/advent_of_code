import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { DEFAULT_TRACE_MAX_STEPS, type OctopusSolver, type OctopusStepFrame } from '../index';
import { FlashSparklineSvg } from './FlashSparklineSvg';
import { OctopusGridSvg } from './OctopusGridSvg';

export interface OctopusVisualizerProps {
  readonly rawInput: string;
  readonly solver: OctopusSolver;
}

type VisualizerModel =
  | { readonly ok: true; readonly answer: number; readonly frames: readonly OctopusStepFrame[] }
  | { readonly ok: false; readonly message: string };

function buildModel(rawInput: string, solver: OctopusSolver): VisualizerModel {
  try {
    const grid = solver.parse(rawInput);
    const answer = solver.solve(grid);
    const frames = solver.trace(grid, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
    return { ok: true, answer, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Shared interactive Dumbo Octopus visualizer parameterized by an `OctopusSolver`. */
export function OctopusVisualizer({ rawInput, solver }: OctopusVisualizerProps) {
  const model = useMemo(() => buildModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 140);
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
        <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
          <div className="meta-row" style={{ margin: 0 }}>
            <span className="badge">{solver.policy.label}</span>
            <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              Step: <strong>{activeFrame.step}</strong> / {activeFrame.flashHistory.length}
            </span>
            <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
              Step Flashes: <strong>{activeFrame.stepFlashes}</strong>
            </span>
            <span
              className={`badge ${activeFrame.isSynchronized ? 'status-solved' : ''}`}
              style={activeFrame.isSynchronized ? undefined : { borderColor: 'var(--border)' }}
            >
              {activeFrame.isSynchronized ? (
                <strong>Synchronized!</strong>
              ) : (
                <>
                  Total Flashes: <strong>{activeFrame.totalFlashes.toLocaleString()}</strong>
                </>
              )}
            </span>
          </div>
          <span className="badge status-solved">
            Final Answer: <strong>{model.answer.toLocaleString()}</strong>
          </span>
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
      <OctopusGridSvg frame={activeFrame} />
      <FlashSparklineSvg frame={activeFrame} />
    </div>
  );
}
