import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  computeCaveLayout,
  DEFAULT_TRACE_MAX_STEPS,
  findRevisitedSmallCave,
  type CaveGraphLayout,
  type CavePathSolver,
  type CaveTraceFrame,
} from '../index';
import { CaveGraphSvg } from './CaveGraphSvg';

export interface CaveVisualizerProps {
  readonly rawInput: string;
  readonly solver: CavePathSolver;
}

const SVG_WIDTH = 720;
const SVG_HEIGHT = 380;

type VisualizerModel =
  | {
      readonly ok: true;
      readonly answer: bigint;
      readonly layout: CaveGraphLayout;
      readonly frames: readonly CaveTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildModel(rawInput: string, solver: CavePathSolver): VisualizerModel {
  try {
    const system = solver.parse(rawInput);
    const answer = solver.solve(system);
    const layout = computeCaveLayout(system, SVG_WIDTH, SVG_HEIGHT);
    const frames = solver.trace(system, { maxSteps: DEFAULT_TRACE_MAX_STEPS });
    return { ok: true, answer, layout, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function statusLabel(frame: CaveTraceFrame): string {
  if (frame.status === 'path-found') return 'Path Found';
  if (frame.status === 'summary') return 'Complete';
  return 'Exploring';
}

/** Shared interactive cave passage pathing visualizer parameterized by a `CavePathSolver`. */
export function CaveVisualizer({ rawInput, solver }: CaveVisualizerProps) {
  const model = useMemo(() => buildModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.name}:${rawInput}`, 160);
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

  const revisitedCave = findRevisitedSmallCave(activeFrame.path);

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
          <div className="meta-row" style={{ margin: 0 }}>
            <span className="badge">{solver.policy.name}</span>
            <span
              className={`badge ${activeFrame.status === 'path-found' || activeFrame.status === 'summary' ? 'status-solved' : ''}`}
              style={
                activeFrame.status === 'exploring'
                  ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                  : undefined
              }
            >
              {statusLabel(activeFrame)}
            </span>
            <span className="badge">
              Discovered: <strong>{activeFrame.discoveredPaths.toLocaleString()}</strong>
            </span>
            {revisitedCave !== null && (
              <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                Revisited: <strong>{revisitedCave}</strong>
              </span>
            )}
            {activeFrame.truncated && (
              <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                Preview capped at {DEFAULT_TRACE_MAX_STEPS} frames
              </span>
            )}
          </div>
          <span className="badge status-solved">
            Total Paths: <strong>{model.answer.toLocaleString()}</strong>
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
      <CaveGraphSvg layout={model.layout} frame={activeFrame} />
    </div>
  );
}
