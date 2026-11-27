import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  ScaffoldSolver,
  buildScaffoldSvgLayout,
  type RoutinePlan,
  type ScaffoldPolicy,
  type ScaffoldSvgLayout,
  type ScaffoldTraceFrame,
} from '../index';

interface ScaffoldVisualizerProps {
  readonly rawInput: string;
  readonly solver: ScaffoldSolver;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly ScaffoldTraceFrame[]; readonly finalAnswer: string }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, solver: ScaffoldSolver): VizState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const finalAnswer = solver.policy.formatFrameAnswer(frames[frames.length - 1]!);
    return { ok: true, frames, finalAnswer };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function ScaffoldHudBadges({
  policy,
  frame,
  layout,
  finalAnswer,
}: {
  readonly policy: ScaffoldPolicy;
  readonly frame: ScaffoldTraceFrame;
  readonly layout: ScaffoldSvgLayout;
  readonly finalAnswer: string;
}) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{policy.label}</span>
      <span className="badge">Step {frame.stepIndex} / {frame.totalSteps}</span>
      <span className="badge">Intersections: {layout.intersectionCount}</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Phase: {frame.phase}
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Answer: {finalAnswer}
      </span>
    </div>
  );
}

function RoutineBadges({ plan }: { readonly plan: RoutinePlan }) {
  return (
    <div className="meta-row" style={{ margin: 0, fontSize: '0.78rem' }}>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Main: {plan.mainText}
      </span>
      <span className="badge">A: {plan.routineAText}</span>
      <span className="badge">B: {plan.routineBText}</span>
      <span className="badge">C: {plan.routineCText}</span>
    </div>
  );
}

function ScaffoldLegend() {
  return (
    <div className="meta-row" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
      <span className="badge" style={{ borderColor: 'var(--text)', color: 'var(--text)' }}>Scaffold</span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Intersection</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Robot</span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Swept Path</span>
    </div>
  );
}

function ScaffoldCanvas({
  frame,
  layout,
}: {
  readonly frame: ScaffoldTraceFrame;
  readonly layout: ScaffoldSvgLayout;
}) {
  return (
    <div className="card" style={{ margin: 0, padding: '0.75rem', background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span>{layout.statusSummary}</span>
        <span className="muted">
          Grid {frame.map.width}×{frame.map.height} · Cells {frame.map.scaffoldCount}
        </span>
      </div>
      <svg
        viewBox={layout.viewBox}
        role="img"
        aria-label="ASCII scaffold camera feed and vacuum robot grid"
        style={{ width: '100%', maxHeight: '460px', display: 'block', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}
      >
        {layout.scaffoldPath ? <path d={layout.scaffoldPath} fill="var(--text)" opacity={0.85} /> : null}
        {layout.sweptPolyline ? (
          <polyline points={layout.sweptPolyline} fill="none" stroke="var(--ok)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {layout.intersectionPath ? (
          <path d={layout.intersectionPath} fill="var(--gold)" stroke="var(--surface)" strokeWidth={0.8} />
        ) : null}
        {layout.robotMarker ? (
          <polygon points={layout.robotMarker.arrowPoints} fill="var(--accent)" stroke="var(--surface)" strokeWidth={0.9} />
        ) : null}
      </svg>
    </div>
  );
}

/** Interactive light-mode visualizer for AoC 2019 Day 17 Parts 1 and 2. */
export function ScaffoldVisualizer({ rawInput, solver }: ScaffoldVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 80);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text" style={{ color: 'var(--err)' }}>Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const layout = buildScaffoldSvgLayout(frame, solver.policy);

  return (
    <div className="stack">
      <ScaffoldHudBadges policy={solver.policy} frame={frame} layout={layout} finalAnswer={state.finalAnswer} />
      {frame.plan !== null ? <RoutineBadges plan={frame.plan} /> : null}
      <ScaffoldLegend />
      <ScaffoldCanvas frame={frame} layout={layout} />
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
