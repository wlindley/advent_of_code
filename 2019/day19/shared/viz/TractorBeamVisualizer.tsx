import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  TractorBeamSolver,
  buildTractorBeamSvgLayout,
  type ScanSvgLayout,
  type SquareSvgLayout,
  type TractorBeamPolicy,
  type TractorBeamSvgLayout,
  type TractorBeamTraceFrame,
} from '../index';

interface TractorBeamVisualizerProps {
  readonly rawInput: string;
  readonly solver: TractorBeamSolver;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly TractorBeamTraceFrame[]; readonly finalAnswer: string }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, solver: TractorBeamSolver): VizState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const finalAnswer = solver.policy.formatFrameAnswer(frames[frames.length - 1]!);
    return { ok: true, frames, finalAnswer };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function HudBadges({
  policy,
  frame,
  finalAnswer,
}: {
  readonly policy: TractorBeamPolicy;
  readonly frame: TractorBeamTraceFrame;
  readonly finalAnswer: string;
}) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{policy.label}</span>
      <span className="badge">Step {frame.stepIndex} / {frame.totalSteps}</span>
      <span className="badge">Probes: {frame.probeCount}</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Current: {policy.formatFrameAnswer(frame)}
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Answer: {finalAnswer}
      </span>
    </div>
  );
}

function BeamLegend({ kind }: { readonly kind: TractorBeamTraceFrame['kind'] }) {
  return (
    <div className="meta-row" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Emitter (0,0)</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        {kind === 'scan' ? 'Pulled Span' : 'Beam Left Edge'}
      </span>
      <span className="badge" style={{ borderColor: kind === 'scan' ? 'var(--warn)' : 'var(--ok)', color: kind === 'scan' ? 'var(--warn)' : 'var(--ok)' }}>
        {kind === 'scan' ? 'Active Scanline' : 'Fitted Square'}
      </span>
      {kind === 'square' ? <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>Missed Probe</span> : null}
    </div>
  );
}

function ScanSvgBody({ layout }: { readonly layout: ScanSvgLayout }) {
  return (
    <>
      {layout.bars.map((bar, idx) => (
        <rect key={idx} x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill="var(--accent)" opacity={0.78} />
      ))}
      <line x1={16} y1={layout.scanlineY} x2={404} y2={layout.scanlineY} stroke="var(--warn)" strokeWidth={1.6} strokeDasharray="4 3" />
      <circle cx={layout.emitter.x} cy={layout.emitter.y} r={3.5} fill="var(--gold)" />
    </>
  );
}

function SquareSvgBody({ layout, fits }: { readonly layout: SquareSvgLayout; readonly fits: boolean }) {
  const squareStroke = fits ? 'var(--ok)' : 'var(--warn)';
  const probeColor = fits ? 'var(--ok)' : 'var(--err)';
  return (
    <>
      {layout.leftEdgePoints ? (
        <polyline points={layout.leftEdgePoints} fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinecap="round" />
      ) : null}
      {layout.candidateRect ? (
        <rect
          x={layout.candidateRect.x}
          y={layout.candidateRect.y}
          width={layout.candidateRect.width}
          height={layout.candidateRect.height}
          fill={squareStroke}
          fillOpacity={fits ? 0.22 : 0.12}
          stroke={squareStroke}
          strokeWidth={2}
        />
      ) : null}
      <circle cx={layout.emitter.x} cy={layout.emitter.y} r={3.5} fill="var(--gold)" />
      <circle cx={layout.anchor.x} cy={layout.anchor.y} r={3} fill="var(--muted)" />
      <circle cx={layout.probeDot.x} cy={layout.probeDot.y} r={4} fill={probeColor} stroke="var(--surface)" strokeWidth={1} />
    </>
  );
}

function BeamCanvas({ frame, layout }: { readonly frame: TractorBeamTraceFrame; readonly layout: TractorBeamSvgLayout }) {
  return (
    <div className="card" style={{ margin: 0, padding: '0.75rem', background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span>{layout.statusSummary}</span>
        <span className="muted">{layout.kind === 'scan' ? `${frame.kind === 'scan' ? frame.gridSize : 50}×50 Sector` : `Scale 0..${layout.maxCoord}`}</span>
      </div>
      <svg
        viewBox={layout.viewBox}
        role="img"
        aria-label="Intcode tractor beam field visualization"
        style={{ width: '100%', maxHeight: '440px', display: 'block', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}
      >
        {layout.kind === 'scan' ? <ScanSvgBody layout={layout} /> : <SquareSvgBody layout={layout} fits={frame.kind === 'square' && frame.fits} />}
      </svg>
    </div>
  );
}

/** Interactive light-mode SVG visualizer for AoC 2019 Day 19 Parts 1 and 2. */
export function TractorBeamVisualizer({ rawInput, solver }: TractorBeamVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 90);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text" style={{ color: 'var(--err)' }}>Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const layout = buildTractorBeamSvgLayout(frame);

  return (
    <div className="stack">
      <HudBadges policy={solver.policy} frame={frame} finalAnswer={state.finalAnswer} />
      <BeamLegend kind={frame.kind} />
      <BeamCanvas frame={frame} layout={layout} />
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
