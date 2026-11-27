import type { BeaconTraceFrame } from '../index';

export interface TrenchTelemetryProps {
  readonly frame: BeaconTraceFrame;
  readonly policyLabel: string;
  readonly answerText: string;
}

function TelemetryLegend() {
  return (
    <div className="chart-legend" style={{ color: 'var(--muted)' }}>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--ok)', height: 8, width: 10, borderTop: 0 }} />
        Anchor Scanner
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--accent)', height: 8, width: 10, borderTop: 0 }} />
        Active Scanner &amp; Link
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--gold)', height: 8, width: 10, borderTop: 0 }} />
        Newly Added Beacons
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--muted)', height: 8, width: 10, borderTop: 0 }} />
        Prior Beacons
      </span>
    </div>
  );
}

/** Compact telemetry badges and legend for 3D beacon alignment replay. */
export function TrenchTelemetry({ frame, policyLabel, answerText }: TrenchTelemetryProps) {
  const scanner = frame.activeScanner;
  const matchInfo = scanner.isAnchor
    ? 'Anchor Frame'
    : `Linked <- S${scanner.matchedParentId} (${scanner.overlapCount} overlap)`;

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            S{scanner.id} · {matchInfo}
          </span>
          <span className="badge">
            Scanners <strong>{frame.alignedScanners.length}</strong> / {frame.totalRawSteps}
          </span>
          <span className="badge">
            Beacons <strong>{frame.beacons.length}</strong> (+{frame.newlyAddedCount})
          </span>
          <span className="badge" style={{ color: 'var(--muted)' }}>
            pos {scanner.position.format()} · rot {scanner.rotation.label}
          </span>
        </div>
        <span
          className={frame.isComplete ? 'badge status-solved' : 'badge'}
          style={frame.isComplete ? undefined : { color: 'var(--muted)' }}
        >
          {policyLabel}: <strong>{frame.metricValue}</strong> / {answerText}
        </span>
      </div>
      <TelemetryLegend />
    </div>
  );
}
