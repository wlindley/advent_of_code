import {
  buildTopReactions,
  DEFAULT_TOP_REACTIONS,
  formatCompactBigInt,
  formatGroupedBigInt,
  type PairReaction,
} from '../index';

export interface ActiveReactionsChartProps {
  readonly reactions: readonly PairReaction[];
  readonly totalInsertions: bigint;
}

/** Ranked bar list of the top pair-insertion rules firing on the next step. */
export function ActiveReactionsChart({
  reactions,
  totalInsertions,
}: ActiveReactionsChartProps) {
  const top = buildTopReactions(reactions, DEFAULT_TOP_REACTIONS);

  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>Top Active Reactions</strong>
        <span className="chart-sub muted">
          {reactions.length} pairs · {formatCompactBigInt(totalInsertions)} insertions next
        </span>
      </div>
      {top.length === 0 ? (
        <p className="chart-empty muted">No matching insertion rules for remaining pairs.</p>
      ) : (
        <div className="stack" style={{ gap: '0.45rem' }}>
          {top.map((item) => (
            <div
              key={item.pair}
              style={{
                display: 'grid',
                gridTemplateColumns: '4.5rem 1fr auto',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <code style={{ fontWeight: 600, color: 'var(--text)' }}>
                {item.pair}→{item.insert}
              </code>
              <div
                style={{
                  height: '14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(2, item.ratio * 100)}%`,
                    height: '100%',
                    background: 'var(--accent)',
                  }}
                />
              </div>
              <span
                className="nowrap muted"
                style={{ fontSize: '0.8rem', minWidth: '4.5rem', textAlign: 'right' }}
                title={formatGroupedBigInt(item.count)}
              >
                {formatCompactBigInt(item.count)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
