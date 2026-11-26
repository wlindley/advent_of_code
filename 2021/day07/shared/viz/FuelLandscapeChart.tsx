import {
  formatSignedCompactBigInt,
  scaleBigIntRange,
  type AlignmentSearchFrame,
  type FuelLandscape,
} from '../index';

export interface FuelLandscapeChartProps {
  readonly landscape: FuelLandscape;
  readonly frame: AlignmentSearchFrame;
}

const LEFT = 58;
const RIGHT = 618;
const TOP = 20;
const BOTTOM = 154;
const WIDTH = RIGHT - LEFT;
const HEIGHT = BOTTOM - TOP;

function xForRatio(ratio: number): number {
  return LEFT + ratio * WIDTH;
}

function yForRatio(ratio: number): number {
  return BOTTOM - ratio * HEIGHT;
}

function buildCurvePaths(landscape: FuelLandscape): { line: string; area: string } {
  const coords = landscape.points.map((p) => [xForRatio(p.xRatio), yForRatio(p.yRatio)] as const);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const firstX = coords[0]?.[0] ?? LEFT;
  const lastX = coords[coords.length - 1]?.[0] ?? RIGHT;
  const segs = coords.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `M ${firstX.toFixed(1)} ${BOTTOM} ${segs} L ${lastX.toFixed(1)} ${BOTTOM} Z`;
  return { line, area };
}

/** Responsive SVG convex fuel landscape curve with live search probe markers. */
export function FuelLandscapeChart({ landscape, frame }: FuelLandscapeChartProps) {
  const { minPosition, maxPosition, minFuel, maxFuel, optimalTarget, points } = landscape;
  const { line, area } = buildCurvePaths(landscape);
  const loX = xForRatio(scaleBigIntRange(frame.lo, minPosition, maxPosition));
  const hiX = xForRatio(scaleBigIntRange(frame.hi, minPosition, maxPosition));
  const optX = xForRatio(scaleBigIntRange(optimalTarget, minPosition, maxPosition));
  const midX = xForRatio(scaleBigIntRange(frame.mid, minPosition, maxPosition));
  const midY = yForRatio(scaleBigIntRange(frame.midFuel, minFuel, maxFuel));
  const alignRight = midX > LEFT + WIDTH * 0.72;

  return (
    <figure className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
        <strong>Convex Fuel Landscape</strong>
        <span className="chart-sub muted">
          Optimum x={formatSignedCompactBigInt(optimalTarget)} ({formatSignedCompactBigInt(minFuel)})
        </span>
      </div>
      <svg viewBox="0 0 640 188" className="chart-svg" role="img" aria-label="Total fuel cost landscape">
        {[0, 0.5, 1].map((frac) => (
          <line key={frac} x1={LEFT} y1={yForRatio(frac)} x2={RIGHT} y2={yForRatio(frac)} className="chart-grid" />
        ))}
        <rect
          x={Math.min(loX, hiX)}
          y={TOP}
          width={Math.max(4, Math.abs(hiX - loX))}
          height={HEIGHT}
          fill="var(--accent)"
          fillOpacity={0.08}
        />
        <path d={area} fill="var(--accent)" fillOpacity={0.14} />
        {points.length > 1 && (
          <polyline fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinejoin="round" points={line} />
        )}
        <line x1={optX} y1={TOP} x2={optX} y2={BOTTOM} className="chart-ref-line" />
        <circle cx={optX} cy={BOTTOM} r={4} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.5} />
        {frame.nextPosition !== null && frame.nextFuel !== null && (
          <circle
            cx={xForRatio(scaleBigIntRange(frame.nextPosition, minPosition, maxPosition))}
            cy={yForRatio(scaleBigIntRange(frame.nextFuel, minFuel, maxFuel))}
            r={3.5}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={1.2}
          />
        )}
        <circle
          cx={midX}
          cy={midY}
          r={4.8}
          fill={frame.isConverged ? 'var(--ok)' : 'var(--warn)'}
          stroke="var(--surface)"
          strokeWidth={1.5}
        />
        <text
          x={alignRight ? midX - 8 : midX + 8}
          y={Math.max(TOP + 12, midY - 8)}
          textAnchor={alignRight ? 'end' : 'start'}
          className="chart-axis-text"
          style={{ fill: 'var(--text)', fontWeight: 600 }}
        >
          {formatSignedCompactBigInt(frame.midFuel)}
        </text>
        <text x={LEFT - 6} y={TOP + 4} textAnchor="end" className="chart-axis-text">
          {formatSignedCompactBigInt(maxFuel)}
        </text>
        <text x={LEFT - 6} y={BOTTOM + 4} textAnchor="end" className="chart-axis-text">
          {formatSignedCompactBigInt(minFuel)}
        </text>
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
