import type { CSSProperties, ReactNode } from 'react';
import {
  classifyBoostOutput,
  type BoostMode,
  type BoostOutputBadgeKind,
  type BoostTraceFrame,
} from '../index';

interface OutputStreamPanelProps {
  readonly frame: BoostTraceFrame;
  readonly mode: BoostMode;
}

const BADGE_STYLES: Readonly<Record<BoostOutputBadgeKind, CSSProperties>> = {
  error: { borderColor: 'var(--err)', color: 'var(--err)', background: 'var(--surface)' },
  code: { borderColor: 'var(--ok)', color: 'var(--ok)', background: 'var(--surface)' },
  pending: { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--surface)' },
};

function badgeLabel(kind: BoostOutputBadgeKind, mode: BoostMode): string {
  if (kind === 'error') return 'MALFUNCTION';
  if (kind === 'code') return mode.outputLabel.toUpperCase();
  return 'EMITTED';
}

function renderOutputs(frame: BoostTraceFrame, mode: BoostMode): ReactNode {
  if (frame.outputs.length === 0) {
    return <span className="muted">No outputs emitted yet</span>;
  }
  return frame.outputs.map((value, idx) => {
    const kind = classifyBoostOutput(idx, frame.outputs.length, frame.step.halted);
    return (
      <span key={idx} className="badge" style={BADGE_STYLES[kind]}>
        {badgeLabel(kind, mode)} #{idx + 1}: <code>{value.toString()}</code>
      </span>
    );
  });
}

/** Displays Day 9 input queue consumption and emitted diagnostic/keycode stream. */
export function OutputStreamPanel({ frame, mode }: OutputStreamPanelProps) {
  const inputStatus =
    frame.pendingInputs.length > 0
      ? `Queued: [${frame.pendingInputs.map((v) => v.toString()).join(', ')}]`
      : `Consumed (Signal ${mode.inputSignal.toString()})`;

  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="day-header">
        <span>I/O Stream ({mode.label})</span>
        <span className="badge">{inputStatus}</span>
      </div>
      <div className="meta-row" style={{ marginBottom: 0 }}>
        <span className="muted" style={{ fontSize: '0.82rem' }}>Outputs:</span>
        {renderOutputs(frame, mode)}
      </div>
    </section>
  );
}
