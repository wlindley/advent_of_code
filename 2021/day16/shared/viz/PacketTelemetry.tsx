import type { PacketTraceFrame } from '../index';

export interface PacketTelemetryProps {
  readonly frame: PacketTraceFrame;
  readonly answerText: string;
}

function TelemetryLegend() {
  return (
    <div className="chart-legend" style={{ color: 'var(--muted)' }}>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--accent)', height: 8, width: 10, borderTop: 0 }} />
        Active Header / Node
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--gold)', height: 8, width: 10, borderTop: 0 }} />
        Active Payload / Value
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--ok)', height: 8, width: 10, borderTop: 0 }} />
        Decoded / Reduced
      </span>
    </div>
  );
}

/** Compact telemetry badges and color legend for BITS decode and reduction replay. */
export function PacketTelemetry({ frame, answerText }: PacketTelemetryProps) {
  const { transmission, policy, nodes } = frame.snapshot;
  const pct = Math.round(frame.progressRatio * 100);
  const phaseLabel = frame.phase === 'decode' ? 'Decode Bits' : 'Reduce Tree';

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            Phase: <strong>{phaseLabel}</strong>
          </span>
          <span className="badge">
            Cursor: <strong>{frame.cursorBit} / {transmission.stream.bitLength}b</strong> ({transmission.trailingZeroBits}b pad)
          </span>
          <span className="badge">
            Decoded: <strong>{frame.decodedCount} / {nodes.length}</strong>
          </span>
          <span className="badge">
            Reduced: <strong>{frame.reducedCount} / {nodes.length}</strong> ({pct}%)
          </span>
          <span className="badge">
            Version Sum: <strong>{frame.runningVersionSum}</strong>
          </span>
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Active Value: <strong>{frame.activeResult === null ? '—' : frame.activeResult.toString()}</strong>
          </span>
        </div>
        <span className={frame.isComplete ? 'badge status-solved' : 'badge'} style={frame.isComplete ? undefined : { color: 'var(--muted)' }}>
          {policy.label}: <strong>{answerText}</strong>
        </span>
      </div>
      <TelemetryLegend />
    </div>
  );
}
