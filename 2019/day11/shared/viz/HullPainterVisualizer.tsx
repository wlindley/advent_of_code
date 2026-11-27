import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PaintingRobotSolver,
  buildHullSvgLayout,
  executePaintingRobot,
  tryDecodeHullRegistration,
  type HullTraceFrame,
} from '../index';

interface HullPainterVisualizerProps<TAnswer> {
  readonly rawInput: string;
  readonly solver: PaintingRobotSolver<TAnswer>;
}

type VizState =
  | {
      readonly ok: true;
      readonly frames: readonly HullTraceFrame[];
      readonly answerLabel: string;
      readonly registration: string | null;
    }
  | { readonly ok: false; readonly message: string };

function buildVizState<TAnswer>(rawInput: string, solver: PaintingRobotSolver<TAnswer>): VizState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const report = executePaintingRobot(program, solver.policy.startPanelColor);
    const registration = solver.policy.showRegistrationBanner ? tryDecodeHullRegistration(report.whitePanels) : null;
    const answerLabel = solver.policy.showRegistrationBanner
      ? (registration ?? `${report.paintedCount} painted`)
      : String(solver.policy.extractAnswer(report));
    return { ok: true, frames, answerLabel, registration };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive hull-painting robot visualizer for AoC 2019 Day 11 Parts 1 and 2. */
export function HullPainterVisualizer<TAnswer>({ rawInput, solver }: HullPainterVisualizerProps<TAnswer>) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 60);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const layout = buildHullSvgLayout(frame);

  return (
    <div className="stack">
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">{solver.policy.label}</span>
        <span className="badge">Step {frame.stepIndex} / {frame.totalSteps}</span>
        <span className="badge">Pos ({frame.robotX}, {frame.robotY}) · {layout.headingLabel}</span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Painted: {layout.paintedCount} ({layout.multiPaintedCount} repainted)
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          White: {layout.whiteCount}
        </span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Answer: {state.answerLabel}
        </span>
      </div>
      {solver.policy.showRegistrationBanner ? (
        <div
          className="card"
          style={{
            margin: 0, padding: '0.6rem 0.9rem', background: 'var(--surface)',
            borderColor: state.registration ? 'var(--ok)' : 'var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span className="eyebrow" style={{ margin: 0 }}>Decoded Hull Registration</span>
          <strong style={{ fontFamily: 'monospace', fontSize: '1.15rem', letterSpacing: '0.12em', color: 'var(--text)' }}>
            {state.registration ?? 'Unrecognized 5x6 glyphs'}
          </strong>
        </div>
      ) : null}
      <div className="card" style={{ margin: 0, padding: '0.75rem', background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
          <span>{layout.actionSummary}</span>
          <span className="muted">Bounds {layout.bounds.width}×{layout.bounds.height} · Start {frame.startPanelColor === 1 ? 'White' : 'Black'}</span>
        </div>
        <svg
          viewBox={layout.viewBox}
          role="img"
          aria-label="Space Police hull painting grid"
          style={{ width: '100%', maxHeight: '420px', display: 'block', background: '#0f172a', borderRadius: '6px', border: '1px solid var(--border)' }}
        >
          {layout.blackOncePath ? <path d={layout.blackOncePath} fill="#1e293b" /> : null}
          {layout.blackMultiPath ? <path d={layout.blackMultiPath} fill="#334155" stroke="#475569" strokeWidth={0.8} /> : null}
          {layout.whiteOncePath ? <path d={layout.whiteOncePath} fill="#f8fafc" /> : null}
          {layout.whiteMultiPath ? <path d={layout.whiteMultiPath} fill="#fef08a" stroke="#eab308" strokeWidth={0.8} /> : null}
          {layout.trailPoints ? <polyline points={layout.trailPoints} fill="none" stroke="#38bdf8" strokeWidth={1.6} strokeOpacity={0.75} strokeLinecap="round" strokeLinejoin="round" /> : null}
          <polygon points={layout.robotPolygonPoints} fill="#f97316" stroke="#ffffff" strokeWidth={1} />
        </svg>
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
  );
}
