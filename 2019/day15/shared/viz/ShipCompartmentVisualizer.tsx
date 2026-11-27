import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  OxygenSystemSolver,
  buildOxygenSvgLayout,
  type OxygenPolicy,
  type OxygenSvgLayout,
  type OxygenTraceFrame,
} from '../index';

interface ShipCompartmentVisualizerProps {
  readonly rawInput: string;
  readonly solver: OxygenSystemSolver;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly OxygenTraceFrame[]; readonly finalAnswer: string }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, solver: OxygenSystemSolver): VizState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const finalAnswer = solver.policy.formatFrameAnswer(frames[frames.length - 1]!);
    return { ok: true, frames, finalAnswer };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function OxygenHudBadges({
  policy,
  frame,
  layout,
  finalAnswer,
}: {
  readonly policy: OxygenPolicy;
  readonly frame: OxygenTraceFrame;
  readonly layout: OxygenSvgLayout;
  readonly finalAnswer: string;
}) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{policy.label}</span>
      <span className="badge">Step {frame.stepIndex} / {frame.totalSteps}</span>
      <span className="badge">Open: {layout.openCount} · Walls: {layout.wallCount}</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Phase: {frame.phase}
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Answer: {finalAnswer}
      </span>
    </div>
  );
}

function OxygenLegend() {
  return (
    <div className="meta-row" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Origin</span>
      <span className="badge" style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}>Droid</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Oxygen</span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Shortest Path</span>
    </div>
  );
}

function CompartmentMarkers({ layout }: { readonly layout: OxygenSvgLayout }) {
  return (
    <>
      <circle cx={layout.originCenter.x} cy={layout.originCenter.y} r={4.5} fill="var(--gold)" stroke="var(--text)" strokeWidth={0.9} />
      {layout.oxygenCenter ? (
        <circle cx={layout.oxygenCenter.x} cy={layout.oxygenCenter.y} r={5} fill="var(--accent)" stroke="var(--text)" strokeWidth={0.9} />
      ) : null}
      {layout.droidCenter ? (
        <circle cx={layout.droidCenter.x} cy={layout.droidCenter.y} r={4} fill="var(--warn)" stroke="var(--text)" strokeWidth={0.9} />
      ) : null}
    </>
  );
}

function CompartmentSvg({ layout }: { readonly layout: OxygenSvgLayout }) {
  return (
    <div className="card" style={{ margin: 0, padding: '0.75rem', background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span>{layout.statusSummary}</span>
        <span className="muted">
          Grid {layout.bounds.width}×{layout.bounds.height} · Reached {layout.reachedCount}
        </span>
      </div>
      <svg
        viewBox={layout.viewBox}
        role="img"
        aria-label="Ship compartment repair droid map"
        style={{ width: '100%', maxHeight: '440px', display: 'block', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}
      >
        {layout.openPath ? <path d={layout.openPath} fill="#ffffff" stroke="#cbd5e1" strokeWidth={0.6} /> : null}
        {layout.wavePath ? <path d={layout.wavePath} fill="#dbeafe" stroke="#bae6fd" strokeWidth={0.6} /> : null}
        {layout.frontierPath ? <path d={layout.frontierPath} fill="#60a5fa" stroke="#0284c7" strokeWidth={0.8} /> : null}
        {layout.wallPath ? <path d={layout.wallPath} fill="#334155" /> : null}
        {layout.shortestPathPoints ? (
          <polyline points={layout.shortestPathPoints} fill="none" stroke="var(--ok)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        <CompartmentMarkers layout={layout} />
      </svg>
    </div>
  );
}

/** Interactive light-mode blueprint visualizer for AoC 2019 Day 15 Parts 1 and 2. */
export function ShipCompartmentVisualizer({ rawInput, solver }: ShipCompartmentVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 60);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text" style={{ color: 'var(--err)' }}>Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const layout = buildOxygenSvgLayout(frame, solver.policy);

  return (
    <div className="stack">
      <OxygenHudBadges policy={solver.policy} frame={frame} layout={layout} finalAnswer={state.finalAnswer} />
      <OxygenLegend />
      <CompartmentSvg layout={layout} />
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
