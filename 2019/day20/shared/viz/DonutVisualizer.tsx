import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DonutSolver,
  computeDepthStats,
  computeDonutRenderMetrics,
  type DonutDepthStats,
  type DonutPolicy,
  type DonutTraceFrame,
} from '../index';
import { DonutCanvas } from './DonutCanvas';

interface DonutVisualizerProps {
  readonly rawInput: string;
  readonly solver: DonutSolver;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly DonutTraceFrame[]; readonly finalAnswer: number }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, solver: DonutSolver): VizState {
  try {
    const frames = solver.trace(solver.parse(rawInput), { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const last = frames[frames.length - 1]!;
    return { ok: true, frames, finalAnswer: last.path.length - 1 };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function DonutHud({ policy, stats, finalAnswer }: { readonly policy: DonutPolicy; readonly stats: DonutDepthStats; readonly finalAnswer: number }) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{policy.label}</span>
      <span className="badge">Step {stats.currentStep} / {stats.totalSteps}</span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Answer: {finalAnswer}</span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Warps: {stats.warpCount}</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Inner Portal / Trail</span>
      <span className="badge" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}>Outer Portal</span>
    </div>
  );
}

function RecursionDepthGauge({ stats }: { readonly stats: DonutDepthStats }) {
  const levels = Array.from({ length: stats.maxDepth + 1 }, (_, i) => i);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.65rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', fontSize: '0.8rem' }}>
      <span className="muted" style={{ fontWeight: 600 }}>Depth Gauge:</span>
      {levels.map((level) => {
        const active = level === stats.currentDepth;
        const accentColor = level === 0 ? 'var(--ok)' : 'var(--accent)';
        return (
          <span
            key={level}
            className="badge"
            style={{
              borderColor: active ? accentColor : 'var(--border)',
              color: active ? 'var(--surface)' : 'var(--muted)',
              background: active ? accentColor : 'transparent',
            }}
          >
            L{level}
          </span>
        );
      })}
      <span className="muted" style={{ marginLeft: 'auto' }}>Peak L{stats.maxDepth}</span>
    </div>
  );
}

/** Interactive HiDPI canvas visualizer for AoC 2019 Day 20 Parts 1 and 2. */
export function DonutVisualizer({ rawInput, solver }: DonutVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 55);
  if (!state.ok) return <div className="stack"><p className="error-text">Unable to visualize input: {state.message}</p></div>;

  const frame = frames[playback.step]!;
  const stats = computeDepthStats(frame.path, frame.stepIndex);
  const metrics = computeDonutRenderMetrics(frame.maze.rows, frame.maze.cols);

  return (
    <div className="stack">
      <DonutHud policy={solver.policy} stats={stats} finalAnswer={state.finalAnswer} />
      {solver.policy.tracksDepth && <RecursionDepthGauge stats={stats} />}
      <DonutCanvas frame={frame} metrics={metrics} tracksDepth={solver.policy.tracksDepth} />
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
