import {
  buildElementBars,
  formatCompactBigInt,
  formatGroupedBigInt,
  type ElementRole,
  type FrequencyScaleMode,
  type PolymerState,
} from '../index';

export interface ElementFrequencyChartProps {
  readonly state: PolymerState;
  readonly scaleMode: FrequencyScaleMode;
}

const ROLE_COLORS: Record<ElementRole, string> = {
  most: 'var(--ok)',
  least: 'var(--gold)',
  middle: 'var(--accent)',
};

/** Horizontal bar chart of element counts with most/least role highlights. */
export function ElementFrequencyChart({ state, scaleMode }: ElementFrequencyChartProps) {
  const bars = buildElementBars(state, scaleMode);

  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>Element Frequencies</strong>
        <span className="chart-sub muted">
          {scaleMode === 'log' ? 'Log₂(count + 1) scale' : 'Linear scale'}
        </span>
      </div>
      <div className="stack" style={{ gap: '0.45rem' }}>
        {bars.map((bar) => (
          <div
            key={bar.element}
            style={{
              display: 'grid',
              gridTemplateColumns: '2rem 1fr auto',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <strong style={{ color: ROLE_COLORS[bar.role], fontFamily: 'monospace' }}>
              {bar.element}
            </strong>
            <div
              style={{
                height: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(2, bar.ratio * 100)}%`,
                  height: '100%',
                  background: ROLE_COLORS[bar.role],
                }}
              />
            </div>
            <span
              className="nowrap muted"
              style={{ fontSize: '0.8rem', minWidth: '7.5rem', textAlign: 'right' }}
              title={formatGroupedBigInt(bar.count)}
            >
              {formatCompactBigInt(bar.count)} ({bar.sharePercent.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
