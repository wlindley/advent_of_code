import type { KSumTraceFrame, ProbeVerdict } from '../index';

export interface SumDeltaGaugeProps {
  readonly frame: KSumTraceFrame;
}

function verdictBadgeClass(verdict: ProbeVerdict): string {
  if (verdict === 'match') return 'badge status-solved';
  if (verdict === 'too-low') return 'badge status-in_progress';
  return 'badge status-blocked';
}

function verdictText(verdict: ProbeVerdict): string {
  if (verdict === 'match') return 'Exact Match';
  if (verdict === 'too-low') return 'Too Low (advance L →)';
  return 'Too High (← retreat R)';
}

function verdictColor(verdict: ProbeVerdict): string {
  if (verdict === 'match') return 'var(--ok)';
  if (verdict === 'too-low') return 'var(--accent)';
  return 'var(--warn)';
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

export function SumDeltaGauge({ frame }: SumDeltaGaugeProps) {
  const terms = frame.selectedEntries.map((entry) => entry.value).join(' + ');
  const ratio = Math.max(-1, Math.min(1, frame.delta / Math.max(frame.target, 1)));
  const markerX = 360 + ratio * 310;
  const color = verdictColor(frame.verdict);

  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <code style={{ fontSize: '0.95rem', fontWeight: 600 }}>
          {terms} = {frame.sum}
        </code>
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge">Δ {formatDelta(frame.delta)}</span>
          <span className={verdictBadgeClass(frame.verdict)}>{verdictText(frame.verdict)}</span>
          {frame.product !== null && (
            <span className="badge status-solved">
              Product: <strong>{frame.product}</strong>
            </span>
          )}
        </div>
      </div>
      <svg
        viewBox="0 0 720 46"
        className="chart-svg"
        role="img"
        aria-label={`Candidate sum ${frame.sum} vs target ${frame.target}, delta ${formatDelta(frame.delta)}`}
      >
        <line x1={30} y1={24} x2={690} y2={24} stroke="var(--border)" strokeWidth={6} strokeLinecap="round" />
        <line x1={360} y1={8} x2={360} y2={40} className="chart-ref-line" />
        <line x1={360} y1={24} x2={markerX} y2={24} stroke={color} strokeWidth={6} strokeLinecap="round" />
        <circle cx={markerX} cy={24} r={7} fill={color} stroke="var(--surface)" strokeWidth={2} />
        <text x={30} y={13} className="chart-axis-text">Too Low</text>
        <text x={360} y={13} textAnchor="middle" className="chart-ref-text">Target {frame.target}</text>
        <text x={690} y={13} textAnchor="end" className="chart-axis-text">Too High</text>
      </svg>
    </div>
  );
}
