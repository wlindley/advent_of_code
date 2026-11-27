import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  SpringdroidSolver,
  buildSpringdroidSvgLayout,
  formatSpringscriptInstruction,
  type SpringdroidPolicy,
  type SpringdroidTraceFrame,
  type SpringscriptStep,
} from '../index';
import { HullDiagramSvg } from './HullDiagramSvg';

interface SpringdroidVisualizerProps {
  readonly rawInput: string;
  readonly solver: SpringdroidSolver;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly SpringdroidTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, solver: SpringdroidSolver): VizState {
  try {
    const program = solver.parse(rawInput);
    return { ok: true, frames: solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function SpringdroidHud({ policy, frame }: { readonly policy: SpringdroidPolicy; readonly frame: SpringdroidTraceFrame }) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{policy.label}</span>
      <span className="badge">Tick {frame.stepIndex + 1} / {frame.totalSteps}</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>{policy.formula}</span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>VM Steps: {frame.vmSteps}</span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Hull Damage: {String(frame.hullDamage)}</span>
    </div>
  );
}

function renderRegisterStep(step: SpringscriptStep) {
  return (
    <tr key={step.index} style={{ borderTop: '1px solid var(--border)' }}>
      <td style={{ padding: '0.2rem 0.4rem', color: 'var(--muted)' }}>{step.index + 1}</td>
      <td style={{ padding: '0.2rem 0.4rem', fontFamily: 'ui-monospace, monospace' }}>{formatSpringscriptInstruction(step.instruction)}</td>
      <td style={{ padding: '0.2rem 0.4rem', fontWeight: 600, color: step.tAfter ? 'var(--ok)' : 'var(--muted)' }}>{step.tAfter ? '1' : '0'}</td>
      <td style={{ padding: '0.2rem 0.4rem', fontWeight: 600, color: step.jAfter ? 'var(--accent)' : 'var(--muted)' }}>{step.jAfter ? '1' : '0'}</td>
    </tr>
  );
}

function RegisterAndConsolePanel({ frame }: { readonly frame: SpringdroidTraceFrame }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem', background: 'var(--surface)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Springscript Register Trace</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '0.2rem 0.4rem' }}>#</th>
              <th style={{ padding: '0.2rem 0.4rem' }}>Instruction</th>
              <th style={{ padding: '0.2rem 0.4rem' }}>T</th>
              <th style={{ padding: '0.2rem 0.4rem' }}>J</th>
            </tr>
          </thead>
          <tbody>{frame.tick.evaluation.steps.map(renderRegisterStep)}</tbody>
        </table>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem', background: 'var(--surface)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Intcode ASCII Console &amp; Damage</div>
        <pre style={{ margin: 0, padding: '0.5rem', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.76rem', whiteSpace: 'pre-wrap' }}>
          {`${frame.asciiLog.trim()}\nHull Damage: ${String(frame.hullDamage)}`}
        </pre>
      </div>
    </div>
  );
}

/** Interactive light-mode SVG visualizer for AoC 2019 Day 21 Parts 1 and 2. */
export function SpringdroidVisualizer({ rawInput, solver }: SpringdroidVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 280);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text" style={{ color: 'var(--err)' }}>Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const layout = buildSpringdroidSvgLayout(frame);

  return (
    <div className="stack">
      <SpringdroidHud policy={solver.policy} frame={frame} />
      <HullDiagramSvg frame={frame} layout={layout} />
      <RegisterAndConsolePanel frame={frame} />
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
