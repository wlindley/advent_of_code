import type { CSSProperties, ReactNode } from 'react';
import type { CompleteParameterMode } from '../../../shared/intcode';
import {
  decodeInstructionParams,
  formatCompleteOperand,
  type BoostTraceFrame,
} from '../index';

interface RegisterDisassemblyPanelProps {
  readonly frame: BoostTraceFrame;
}

const MODE_BORDER: Readonly<Record<CompleteParameterMode, string>> = {
  position: 'var(--gold)',
  immediate: 'var(--accent)',
  relative: 'var(--ok)',
};

function renderParamPills(frame: BoostTraceFrame): ReactNode {
  const params = decodeInstructionParams(frame.step, frame.memory, frame.sparseEntries);
  if (params.length === 0) {
    return <span className="muted">No operand parameters</span>;
  }
  return params.map((param) => {
    const style: CSSProperties = {
      borderColor: MODE_BORDER[param.mode],
      background: 'var(--surface)',
      color: 'var(--text)',
    };
    return (
      <span key={param.offset} className="badge" style={style}>
        P{param.offset} [{param.badge}]: <code>{param.rawParam.toString()}</code>
      </span>
    );
  });
}

function renderResolvedReads(frame: BoostTraceFrame): ReactNode {
  if (frame.step.reads.length === 0) {
    return <span className="muted">No memory reads this step</span>;
  }
  return frame.step.reads.map((read, idx) => (
    <span
      key={idx}
      className="badge"
      style={{ borderColor: MODE_BORDER[read.mode], background: 'var(--bg)', color: 'var(--text)' }}
    >
      R{idx + 1}: <code>{formatCompleteOperand(read)}</code>
    </span>
  ));
}

/** Displays registers (IP, Relative Base) and arity-bounded POS/IMM/REL disassembly. */
export function RegisterDisassemblyPanel({ frame }: RegisterDisassemblyPanelProps) {
  const { relativeBaseBefore, relativeBaseAfter } = frame;
  const rbChanged = relativeBaseBefore !== relativeBaseAfter;
  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="day-header">
        <span>Registers &amp; Instruction Disassembly</span>
        <span
          className="badge"
          style={{
            borderColor: rbChanged ? 'var(--ok)' : 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
          }}
        >
          RB: {relativeBaseBefore.toString()} -&gt; {relativeBaseAfter.toString()}
        </span>
      </div>
      <div className="meta-row" style={{ marginBottom: '0.4rem' }}>
        <span className="muted" style={{ fontSize: '0.82rem' }}>Slots:</span>
        {renderParamPills(frame)}
      </div>
      <div className="meta-row" style={{ marginBottom: 0 }}>
        <span className="muted" style={{ fontSize: '0.82rem' }}>Resolved:</span>
        {renderResolvedReads(frame)}
      </div>
    </section>
  );
}
