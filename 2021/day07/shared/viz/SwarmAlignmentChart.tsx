import {
  formatSignedCompactBigInt,
  scaleBigIntRange,
  type AlignmentSearchFrame,
  type SwarmHistogram,
} from '../index';

export interface SwarmAlignmentChartProps {
  readonly histogram: SwarmHistogram;
  readonly frame: AlignmentSearchFrame;
  readonly optimalTarget: bigint;
}

const LEFT = 48;
const RIGHT = 618;
const TOP = 20;
const BOTTOM = 154;
const WIDTH = RIGHT - LEFT;
const HEIGHT = BOTTOM - TOP;

function xForRatio(ratio: number): number {
  return LEFT + ratio * WIDTH;
}

/** Responsive SVG crab-swarm coordinate histogram with active search bracket overlay. */
export function SwarmAlignmentChart({ histogram, frame, optimalTarget }: SwarmAlignmentChartProps) {
  const { bins, minPosition, maxPosition, maxCount } = histogram;
  const loX = xForRatio(scaleBigIntRange(frame.lo, minPosition, maxPosition));
  const hiX = xForRatio(scaleBigIntRange(frame.hi, minPosition, maxPosition));
  const midX = xForRatio(scaleBigIntRange(frame.mid, minPosition, maxPosition));
  const optX = xForRatio(scaleBigIntRange(optimalTarget, minPosition, maxPosition));
  const slotW = WIDTH / bins.length;
  const barW = Math.max(3, slotW - 2);
  const alignRight = midX > LEFT + WIDTH * 0.72;

  return (
    <figure className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
        <strong>Swarm Distribution &amp; Search Bracket</strong>
        <span className="chart-sub muted">
          Width: {formatSignedCompactBigInt(frame.bracketWidth)} · Peak bin: {maxCount}
        </span>
      </div>
      <svg viewBox="0 0 640 188" className="chart-svg" role="img" aria-label="Crab swarm position histogram">
        {[0, 0.5, 1].map((frac) => (
          <line key={frac} x1={LEFT} y1={BOTTOM - frac * HEIGHT} x2={RIGHT} y2={BOTTOM - frac * HEIGHT} className="chart-grid" />
        ))}
        <rect
          x={Math.min(loX, hiX)}
          y={TOP}
          width={Math.max(4, Math.abs(hiX - loX))}
          height={HEIGHT}
          fill="var(--accent)"
          fillOpacity={0.1}
        />
        {bins.map((bin) => {
          const x = LEFT + bin.index * slotW + (slotW - barW) / 2;
          const h = bin.ratio * HEIGHT;
          const inBracket = bin.end >= frame.lo && bin.start <= frame.hi;
          return (
            <rect
              key={bin.index}
              x={x}
              y={BOTTOM - h}
              width={barW}
              height={Math.max(bin.count > 0 ? 2 : 0, h)}
              rx={2}
              fill={inBracket ? 'var(--accent)' : 'var(--muted)'}
              fillOpacity={inBracket ? 0.82 : 0.3}
            />
          );
        })}
        <line x1={optX} y1={TOP} x2={optX} y2={BOTTOM} className="chart-ref-line" />
        <line x1={midX} y1={TOP} x2={midX} y2={BOTTOM} stroke={frame.isConverged ? 'var(--ok)' : 'var(--warn)'} strokeWidth={2} />
        <text
          x={alignRight ? midX - 6 : midX + 6}
          y={TOP + 12}
          textAnchor={alignRight ? 'end' : 'start'}
          className="chart-axis-text"
          style={{ fill: 'var(--text)', fontWeight: 600 }}
        >
          mid={formatSignedCompactBigInt(frame.mid)}
        </text>
        <text x={LEFT - 6} y={TOP + 4} textAnchor="end" className="chart-axis-text">{maxCount}</text>
        <text x={LEFT - 6} y={BOTTOM + 4} textAnchor="end" className="chart-axis-text">0</text>
        <text x={LEFT} y={BOTTOM + 20} textAnchor="start" className="chart-axis-text">
          {formatSignedCompactBigInt(minPosition)}
        </text>
        <text x={RIGHT} y={BOTTOM + 20} textAnchor="end" className="chart-axis-text">
          {formatSignedCompactBigInt(maxPosition)}
        </text>
      </svg>
    </figure>
  );
}
