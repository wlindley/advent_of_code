import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type HomeworkProgram,
  type OperationOrderSolver,
  type OperationTraceFrame,
} from '../index';
import { AstTreeSvg } from './AstTreeSvg';

export interface OperationOrderVisualizerProps {
  readonly rawInput: string;
  readonly solver: OperationOrderSolver;
}

type TraceState =
  | { readonly ok: true; readonly program: HomeworkProgram; readonly frames: readonly OperationTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildOperationTrace(rawInput: string, solver: OperationOrderSolver): TraceState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, program, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({
  solver,
  frame,
}: {
  readonly solver: OperationOrderSolver;
  readonly frame: OperationTraceFrame;
}) {
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="meta-row">
        <span className="badge">{solver.policy.label}</span>
        <span className="badge">{`Expr ${frame.expressionIndex + 1} / ${frame.expressionCount} (Line ${frame.expression.lineNumber})`}</span>
        <span className="badge">{`Op Step ${frame.stepIndex + 1} / ${frame.totalSteps}`}</span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          {frame.operationLabel}
        </span>
        <span className={`badge ${frame.expressionComplete ? 'status-solved' : ''}`}>
          {`Sum: ${frame.cumulativeSum}`}
        </span>
      </div>
      <div className="meta-row">
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Active Node</span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Evaluated</span>
        <span className="badge muted">Pending</span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Dashed: ( ) Group</span>
      </div>
    </div>
  );
}

function ExpressionStrip({ frame }: { readonly frame: OperationTraceFrame }) {
  return (
    <div
      style={{
        padding: '0.55rem 0.75rem',
        border: '1px solid var(--border)',
        borderRadius: 8,
        background: 'var(--surface)',
        color: 'var(--text)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '0.9rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      <span className="muted" style={{ marginRight: '0.5rem' }}>{`L${frame.expression.lineNumber}:`}</span>
      <span>{frame.expression.source}</span>
    </div>
  );
}

/** Interactive AST evaluation visualizer shared by Part 1 and Part 2 Operation Order solvers. */
export function OperationOrderVisualizer({ rawInput, solver }: OperationOrderVisualizerProps) {
  const resetKey = `${solver.policy.id}:${rawInput}`;
  const state = useMemo(() => buildOperationTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, resetKey, 260);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <TelemetryBadges solver={solver} frame={frame} />
      <ExpressionStrip frame={frame} />
      <AstTreeSvg root={frame.expression.root} activeNodeId={frame.activeNodeId} nodeValues={frame.nodeValues} />
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
