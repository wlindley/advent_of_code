import type { CavernTraceFrame } from '../index';

export interface CavernTelemetryProps {
  readonly frame: CavernTraceFrame;
  readonly answerText: string;
}

/** Compact telemetry badges and color-key legend for the cavern wavefront and path replay. */
export function CavernTelemetry({ frame, answerText }: CavernTelemetryProps) {
  const { map, totalRisk, maxDistance, stepCount } = frame.result;
  const pct = Math.round(frame.settledRatio * 100);
  const phaseLabel = frame.phase === 'wavefront' ? 'Wavefront Scan' : 'Optimal Path';

  return (
    <div className="stack" style={{ gap: '0.5rem' }}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            Phase: <strong>{phaseLabel}</strong>
          </span>
          <span className="badge">
            Grid: <strong>{map.rows}×{map.cols}</strong> ({map.tileFactor}×)
          </span>
          <span className="badge">
            Risk Wave: <strong>{frame.riskThreshold} / {maxDistance}</strong>
          </span>
          <span className="badge">
            Settled: <strong>{frame.settledCount.toLocaleString()} ({pct}%)</strong>
          </span>
          <span className="badge">
            Frontier: <strong>{frame.frontierCount.toLocaleString()}</strong>
          </span>
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Path: <strong>{frame.pathRevealCount} / {stepCount + 1}</strong> (Risk {frame.revealedPathRisk})
          </span>
        </div>
        <span
          className={frame.goalReached ? 'badge status-solved' : 'badge'}
          style={frame.goalReached ? undefined : { color: 'var(--muted)' }}
        >
          Lowest Risk: <strong>{answerText}</strong> (Goal {totalRisk})
        </span>
      </div>
      <div className="chart-legend" style={{ color: 'var(--muted)' }}>
        <span className="chart-legend-item">
          <span className="legend-swatch" style={{ background: 'var(--ok)', height: 8, width: 8, borderRadius: '50%', borderTop: 0 }} />
          Start (0,0)
        </span>
        <span className="chart-legend-item">
          <span className="legend-swatch" style={{ background: 'var(--accent)', height: 8, width: 12, borderTop: 0 }} />
          Active Frontier / Settled Wave
        </span>
        <span className="chart-legend-item">
          <span className="legend-swatch" style={{ background: 'var(--gold)', height: 3, width: 14, borderTop: 0 }} />
          Lowest-Risk Path
        </span>
      </div>
    </div>
  );
}
