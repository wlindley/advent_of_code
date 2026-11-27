import type { SnailfishTraceFrame, SnailfishTraceKind } from '../index';

export interface SnailfishTelemetryProps {
  readonly frame: SnailfishTraceFrame;
  readonly policyLabel: string;
  readonly answerText: string;
}

function formatKindLabel(kind: SnailfishTraceKind, focusIndex: number): string {
  if (kind === 'initial') return 'Initial Operand';
  if (kind === 'add') return 'Pair Addition';
  if (kind === 'explode') return `Explode @${focusIndex}`;
  return `Split @${focusIndex}`;
}

function getKindColor(kind: SnailfishTraceKind): string {
  if (kind === 'explode') return 'var(--warn)';
  if (kind === 'split') return 'var(--gold)';
  return 'var(--accent)';
}

function TelemetryLegend() {
  return (
    <div className="chart-legend" style={{ color: 'var(--muted)' }}>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--warn)', height: 8, width: 10, borderTop: 0 }} />
        Depth ≥ 5 (Explode)
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--gold)', height: 8, width: 10, borderTop: 0 }} />
        Value ≥ 10 (Split)
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--accent)', height: 8, width: 10, borderTop: 0 }} />
        Active Focus / Reducing
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--ok)', height: 8, width: 10, borderTop: 0 }} />
        Reduced
      </span>
    </div>
  );
}

/** Compact telemetry badges, legend, and live expression readout for Snailfish replay. */
export function SnailfishTelemetry({ frame, policyLabel, answerText }: SnailfishTelemetryProps) {
  const pct = Math.round(frame.progressRatio * 100);
  const actionColor = getKindColor(frame.kind);

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge" style={{ borderColor: actionColor, color: actionColor }}>
            {formatKindLabel(frame.kind, frame.focusIndex)} ({pct}%)
          </span>
          <span className="badge">
            Operand <strong>{frame.operandIndex + 1}</strong> / {frame.totalOperands}
          </span>
          <span className="badge">
            <strong>{frame.leafCount}</strong> leaves · depth <strong>{frame.maxDepth}</strong>
          </span>
          <span className="badge" style={{ color: 'var(--muted)' }}>
            {frame.planDescription}
          </span>
        </div>
        <span
          className={frame.isComplete ? 'badge status-solved' : 'badge'}
          style={frame.isComplete ? undefined : { color: 'var(--muted)' }}
        >
          {policyLabel}: <strong>{frame.magnitude}</strong> / {answerText}
        </span>
      </div>
      <TelemetryLegend />
      <code
        style={{
          display: 'block',
          padding: '0.45rem 0.65rem',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontSize: '0.82rem',
          wordBreak: 'break-all',
        }}
      >
        {frame.expression}
      </code>
    </div>
  );
}
