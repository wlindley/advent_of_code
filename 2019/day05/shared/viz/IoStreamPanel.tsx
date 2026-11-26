import type { CSSProperties, ReactNode } from 'react';
import {
  classifyOutputBadge,
  formatDecodedOperand,
  type DiagnosticTraceFrame,
  type OutputBadgeKind,
} from '../index';

interface IoStreamPanelProps {
  readonly frame: DiagnosticTraceFrame;
  readonly systemId: bigint;
}

const OUTPUT_STYLES: Readonly<Record<OutputBadgeKind, CSSProperties>> = {
  pass: { borderColor: 'var(--ok)', color: 'var(--ok)', background: 'var(--surface)' },
  fail: { borderColor: 'var(--err)', color: 'var(--err)', background: 'var(--surface)' },
  diagnostic: { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--surface)' },
};

const OUTPUT_LABELS: Readonly<Record<OutputBadgeKind, string>> = {
  pass: 'PASS',
  fail: 'FAIL',
  diagnostic: 'CODE',
};

function renderOutputBadges(frame: DiagnosticTraceFrame): ReactNode {
  if (frame.outputs.length === 0) {
    return <span className="muted">No outputs emitted yet</span>;
  }
  const badges: ReactNode[] = [];
  for (let i = 0; i < frame.outputs.length; i += 1) {
    const value = frame.outputs[i]!;
    const kind = classifyOutputBadge(i, frame.outputs.length, value, frame.step.halted);
    badges.push(
      <span key={i} className="badge" style={OUTPUT_STYLES[kind]}>
        {OUTPUT_LABELS[kind]} #{i + 1}: <code>{value.toString()}</code>
      </span>,
    );
  }
  return badges;
}

function renderDecodedReads(frame: DiagnosticTraceFrame): ReactNode {
  if (frame.step.reads.length === 0) {
    return <span className="muted">No parameter reads this step</span>;
  }
  const pills: ReactNode[] = [];
  for (let i = 0; i < frame.step.reads.length; i += 1) {
    const read = frame.step.reads[i]!;
    const border = read.mode === 'immediate' ? 'var(--accent)' : 'var(--gold)';
    pills.push(
      <span key={i} className="badge" style={{ borderColor: border, color: 'var(--text)' }}>
        P{i + 1} ({read.mode}): <code>{formatDecodedOperand(read)}</code>
      </span>,
    );
  }
  return pills;
}

/** Displays Day 5 input queue status, decoded operand modes, and pass/fail/diagnostic outputs. */
export function IoStreamPanel({ frame, systemId }: IoStreamPanelProps) {
  const inputStatus =
    frame.pendingInputs.length > 0
      ? `Queued: [${frame.pendingInputs.map((v) => v.toString()).join(', ')}]`
      : `Consumed (ID ${systemId.toString()})`;

  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="day-header">
        <span>I/O &amp; Parameter Decoding</span>
        <span className="badge">{inputStatus}</span>
      </div>
      <div className="meta-row" style={{ marginBottom: '0.4rem' }}>
        <span className="muted" style={{ fontSize: '0.82rem' }}>Operands:</span>
        {renderDecodedReads(frame)}
      </div>
      <div className="meta-row" style={{ marginBottom: 0 }}>
        <span className="muted" style={{ fontSize: '0.82rem' }}>Outputs:</span>
        {renderOutputBadges(frame)}
      </div>
    </section>
  );
}
