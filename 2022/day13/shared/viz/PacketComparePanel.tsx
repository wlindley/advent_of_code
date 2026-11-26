import type { ComparisonStep, ComparisonStepKind, ComparisonTrace, PacketList, PacketOrder } from '../index';

export interface PacketComparePanelProps {
  readonly left: PacketList;
  readonly right: PacketList;
  readonly comparison: ComparisonTrace;
  readonly leftLabel?: string;
  readonly rightLabel?: string;
}

const STEP_LABELS: Record<ComparisonStepKind, string> = {
  'compare-list': 'Compare lists',
  'compare-int': 'Compare ints',
  'promote-left': 'Promote left int -> [int]',
  'promote-right': 'Promote right int -> [int]',
  'left-exhausted': 'Left ran out first',
  'right-exhausted': 'Right ran out first',
};

function orderBadge(order: PacketOrder): { readonly text: string; readonly color: string } {
  if (order < 0) return { text: 'In Order (-1)', color: 'var(--ok)' };
  if (order > 0) return { text: 'Out of Order (+1)', color: 'var(--err)' };
  return { text: 'Equivalent (0)', color: 'var(--gold)' };
}

function stepOutcomeLabel(outcome: PacketOrder | null): { readonly text: string; readonly color: string } {
  if (outcome === null) return { text: '...', color: 'var(--muted)' };
  if (outcome < 0) return { text: '-1', color: 'var(--ok)' };
  if (outcome > 0) return { text: '+1', color: 'var(--err)' };
  return { text: '0', color: 'var(--gold)' };
}

function PacketBox({ label, packet }: { readonly label: string; readonly packet: PacketList }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.6rem', background: 'var(--bg)' }}>
      <span className="eyebrow">{label}</span>
      <code style={{ display: 'block', wordBreak: 'break-all', fontSize: '0.84rem', color: 'var(--text)' }}>
        {packet.format()}
      </code>
    </div>
  );
}

function TraceStepRow({ step, index }: { readonly step: ComparisonStep; readonly index: number }) {
  const verdict = stepOutcomeLabel(step.outcome);
  const indent = `${Math.min(step.depth, 6) * 0.75}rem`;
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '0.32rem 0.45rem', color: 'var(--muted)', width: '2.2rem' }}>{index + 1}</td>
      <td style={{ padding: '0.32rem 0.45rem', paddingLeft: `calc(0.45rem + ${indent})`, color: 'var(--text)' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>d{step.depth}</span> {STEP_LABELS[step.kind]}
      </td>
      <td style={{ padding: '0.32rem 0.45rem', wordBreak: 'break-all' }}>
        <code>{step.leftText}</code>
      </td>
      <td style={{ padding: '0.32rem 0.45rem', wordBreak: 'break-all' }}>
        <code>{step.rightText}</code>
      </td>
      <td style={{ padding: '0.32rem 0.45rem', fontWeight: 700, color: verdict.color, textAlign: 'right' }}>
        {verdict.text}
      </td>
    </tr>
  );
}

/** Displays two packets side-by-side along with their step-by-step comparison trace. */
export function PacketComparePanel({
  left,
  right,
  comparison,
  leftLabel = 'Left',
  rightLabel = 'Right',
}: PacketComparePanelProps) {
  const verdict = orderBadge(comparison.outcome);
  return (
    <section
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '0.85rem',
        background: 'var(--surface)',
      }}
      aria-label="Packet comparison details"
    >
      <div className="quality-header" style={{ marginBottom: '0.6rem' }}>
        <strong>Comparison Trace ({comparison.steps.length} steps)</strong>
        <span className="badge" style={{ borderColor: verdict.color, color: verdict.color }}>
          {verdict.text}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <PacketBox label={leftLabel} packet={left} />
        <PacketBox label={rightLabel} packet={right} />
      </div>
      <div className="table-scroll" style={{ maxHeight: 280 }}>
        <table className="quality-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Rule Step</th>
              <th>Left</th>
              <th>Right</th>
              <th style={{ textAlign: 'right' }}>Out</th>
            </tr>
          </thead>
          <tbody>
            {comparison.steps.map((step, index) => (
              <TraceStepRow key={`${index}-${step.kind}-${step.depth}`} step={step} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
