import type { CSSProperties } from 'react';
import type { HashCharTransition } from '../index';

export interface HashPipelineRibbonProps {
  readonly text: string;
  readonly transitions: readonly HashCharTransition[];
  readonly resultLabel?: string;
  readonly subtitle?: string;
}

const CARD_STYLE: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.7rem 0.85rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.4rem',
};

const STEP_CHIP_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.28rem 0.5rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  fontSize: '0.78rem',
  fontVariantNumeric: 'tabular-nums',
};

function TransitionStepChip({ step }: { readonly step: HashCharTransition }) {
  return (
    <span
      style={STEP_CHIP_STYLE}
      title={`Step ${step.index + 1}: '${step.char}' (ASCII ${step.ascii}) from ${step.before}: (${step.before} + ${step.ascii}) * 17 & 255 = ${step.after}`}
    >
      <strong style={{ color: 'var(--text)' }}>
        <code>{step.char}</code> ({step.ascii})
      </strong>
      <span className="muted">→ +{step.ascii}</span>
      <span className="muted">→ ×17</span>
      <span className="muted">→ &amp;255 =</span>
      <strong style={{ color: 'var(--accent)' }}>{step.after}</strong>
    </span>
  );
}

/** Reusable horizontal character-by-character HASH pipeline ribbon (shared by Part 1 & Part 2). */
export function HashPipelineRibbon({
  text,
  transitions,
  resultLabel = 'HASH',
  subtitle,
}: HashPipelineRibbonProps) {
  const finalHash = transitions.length > 0 ? transitions[transitions.length - 1]!.after : 0;

  return (
    <div style={CARD_STYLE} aria-label={`HASH pipeline for ${text}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>
          Token Pipeline: <code>{text}</code>
        </span>
        {subtitle ? <span className="muted" style={{ fontSize: '0.78rem' }}>{subtitle}</span> : null}
      </div>
      <div style={ROW_STYLE}>
        <span className="badge">Start: <strong>0</strong></span>
        {transitions.map((step) => (
          <TransitionStepChip key={`${step.index}-${step.char}`} step={step} />
        ))}
        <span
          className="badge"
          style={{ borderColor: 'var(--ok)', color: 'var(--ok)', background: 'var(--surface)' }}
        >
          {resultLabel}: <strong>{finalHash}</strong>
        </span>
      </div>
    </div>
  );
}
