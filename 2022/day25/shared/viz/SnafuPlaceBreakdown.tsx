import type { CSSProperties } from 'react';
import type { SnafuDigitTerm, SnafuNumber } from '../index';

export interface SnafuPlaceBreakdownProps {
  readonly title: string;
  readonly number: SnafuNumber;
}

function digitAccentColor(digitValue: number): string {
  if (digitValue > 0) return 'var(--accent)';
  if (digitValue < 0) return 'var(--warn)';
  return 'var(--muted)';
}

function formatContribution(value: bigint): string {
  return value > 0n ? `+${value.toString()}` : value.toString();
}

const PANEL_STYLE: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.75rem',
  background: 'var(--surface)',
  color: 'var(--text)',
};

const STRIP_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.45rem',
  marginTop: '0.55rem',
};

function DigitTermCard({ term }: { readonly term: SnafuDigitTerm }) {
  const accent = digitAccentColor(term.digitValue);
  return (
    <div
      style={{
        minWidth: 74,
        border: `1px solid ${term.digitValue === 0 ? 'var(--border)' : accent}`,
        borderRadius: 6,
        padding: '0.35rem 0.5rem',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.15rem',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span className="muted" style={{ fontSize: '0.72rem' }}>
        5^{term.placeIndex} ({term.placeValue.toString()})
      </span>
      <strong style={{ fontSize: '1.1rem', fontFamily: 'monospace', color: accent }}>
        {term.digit}
      </strong>
      <span style={{ fontSize: '0.74rem', color: 'var(--text)' }}>
        ×{term.digitValue} = {formatContribution(term.contribution)}
      </span>
    </div>
  );
}

/** Displays MSB-to-LSB place-value decomposition of a `SnafuNumber`. */
export function SnafuPlaceBreakdown({ title, number }: SnafuPlaceBreakdownProps) {
  const terms = number.digitTerms;
  return (
    <div style={PANEL_STYLE}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '0.9rem' }}>{title}</strong>
        <span style={{ fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }}>
          <code>{number.text}</code> = <strong>{number.decimal.toString()}</strong>
        </span>
      </div>
      <div style={STRIP_STYLE}>
        {terms.map((term) => (
          <DigitTermCard key={term.placeIndex} term={term} />
        ))}
      </div>
    </div>
  );
}
