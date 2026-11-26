import {
  CANONICAL_DEDUCTION_RULES,
  WIRE_INDICES,
  WIRE_LETTERS,
  type DisplayTraceFrame,
} from '../index';

export interface WireDeductionCardProps {
  readonly frame: DisplayTraceFrame;
}

/** Table displaying observed wire frequencies, deduced canonical segments, and rules. */
export function WireDeductionCard({ frame }: WireDeductionCardProps) {
  const { entry, mapping } = frame.decoded;
  const freqs = entry.wireFrequencies;

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <span className="eyebrow" style={{ marginBottom: '0.5rem' }}>
        Wire Frequency &amp; Bijection Deduction
      </span>
      <div className="table-scroll">
        <table className="quality-table">
          <thead>
            <tr>
              <th>Observed Wire</th>
              <th>Signal Freq</th>
              <th>Canonical Segment</th>
              <th>Closed-Form Rule</th>
            </tr>
          </thead>
          <tbody>
            {WIRE_INDICES.map((wire) => {
              const canonical = mapping.toCanonical(wire);
              return (
                <tr key={wire}>
                  <td><code>{WIRE_LETTERS[wire]}</code></td>
                  <td><strong>{freqs[wire]}</strong> / 10</td>
                  <td><strong style={{ color: 'var(--accent)' }}>{WIRE_LETTERS[canonical]}</strong></td>
                  <td className="muted">{CANONICAL_DEDUCTION_RULES[canonical]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
