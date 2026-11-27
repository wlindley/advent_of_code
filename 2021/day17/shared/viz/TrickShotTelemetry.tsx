import type { TrickShotTraceFrame } from '../index';

export interface TrickShotTelemetryProps {
  readonly frame: TrickShotTraceFrame;
  readonly answerText: string;
}

function TelemetryLegend() {
  return (
    <div className="chart-legend" style={{ color: 'var(--muted)' }}>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--ok)', height: 8, width: 10, borderTop: 0 }} />
        Target / Valid Velocities
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--accent)', height: 8, width: 10, borderTop: 0 }} />
        Active Sweep / Trajectory
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ background: 'var(--gold)', height: 8, width: 10, borderTop: 0 }} />
        Max Apex / Best Launch
      </span>
    </div>
  );
}

/** Compact telemetry badges and color legend for Trick Shot sweep and arc replay. */
export function TrickShotTelemetry({ frame, answerText }: TrickShotTelemetryProps) {
  const { target, policy, bestVelocity } = frame.snapshot;
  const band = frame.activeBand;
  const pct = Math.round(frame.progressRatio * 100);
  const phaseLabel = frame.phase === 'sweep' ? 'Velocity Sweep' : 'Ballistic Arc';

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            Phase: <strong>{phaseLabel}</strong> ({pct}%)
          </span>
          <span className="badge">
            Target: <strong>x={target.xMin}..{target.xMax}, y={target.yMin}..{target.yMax}</strong>
          </span>
          <span className="badge">
            vy=<strong>{band.yInterval.vy}</strong> · t=[{band.yInterval.firstStep}..{band.yInterval.lastStep}] ·{' '}
            <strong>{band.matchCount}</strong> vx
          </span>
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Best Launch: <strong>({bestVelocity.vx}, {bestVelocity.vy})</strong>
          </span>
        </div>
        <span
          className={frame.isComplete ? 'badge status-solved' : 'badge'}
          style={frame.isComplete ? undefined : { color: 'var(--muted)' }}
        >
          {policy.label}: <strong>{frame.activeResult}</strong> / {answerText}
        </span>
      </div>
      <TelemetryLegend />
    </div>
  );
}
