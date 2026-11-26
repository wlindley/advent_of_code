import type { CSSProperties } from 'react';
import type { EncodeStepFrame } from '../index';

export interface SnafuEncodeCascadeProps {
  readonly frames: readonly EncodeStepFrame[];
  readonly activePlaceIndex: number;
}

const CONTAINER_STYLE: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0.75rem',
  background: 'var(--surface)',
  color: 'var(--text)',
};

function EncodeStepRow({
  step,
  isActive,
}: {
  readonly step: EncodeStepFrame;
  readonly isActive: boolean;
}) {
  const rowStyle: CSSProperties = {
    background: isActive ? 'var(--bg)' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    fontVariantNumeric: 'tabular-nums',
  };
  const digitColor =
    step.digitValue > 0 ? 'var(--accent)' : step.digitValue < 0 ? 'var(--warn)' : 'var(--muted)';

  return (
    <tr style={rowStyle}>
      <td>
        <code>5^{step.placeIndex}</code>
      </td>
      <td>{step.remainingBefore.toString()}</td>
      <td>
        {step.rawQuotient.toString()} rem {step.rawRemainder}
      </td>
      <td style={{ color: step.carry === 1 ? 'var(--gold)' : 'var(--muted)' }}>
        {step.carry === 1 ? '+1 carry' : '0'}
      </td>
      <td>
        <code style={{ color: digitColor, fontWeight: 700 }}>{step.digit}</code> ({step.digitValue})
      </td>
      <td>{step.remainingAfter.toString()}</td>
      <td>
        <code style={{ color: step.isFinalStep ? 'var(--ok)' : 'var(--text)' }}>
          {step.partialSnafu}
        </code>
      </td>
    </tr>
  );
}

/** Renders the LSB-to-MSB balanced base-5 division and carry cascade table. */
export function SnafuEncodeCascade({ frames, activePlaceIndex }: SnafuEncodeCascadeProps) {
  return (
    <div style={CONTAINER_STYLE}>
      <div className="meta-row" style={{ margin: '0 0 0.5rem', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: '0.9rem' }}>Balanced Base-5 Encode Cascade (LSB → MSB)</strong>
        <span className="muted" style={{ fontSize: '0.82rem' }}>
          Remainder 3 → <code>=</code> (+1 carry), 4 → <code>-</code> (+1 carry)
        </span>
      </div>
      <div className="table-scroll">
        <table className="quality-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Remaining</th>
              <th>÷ 5</th>
              <th>Carry</th>
              <th>SNAFU Digit</th>
              <th>Next Rem</th>
              <th>Suffix</th>
            </tr>
          </thead>
          <tbody>
            {frames.map((step) => (
              <EncodeStepRow
                key={step.placeIndex}
                step={step}
                isActive={step.placeIndex === activePlaceIndex}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
