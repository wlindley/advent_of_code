import {
  buildGrowthCurve,
  formatCompactBigInt,
  type GrowthCurvePoint,
  type GrowthScaleMode,
  type LanternfishTraceFrame,
} from '../index';

export interface GrowthCurveChartProps {
  readonly frames: readonly LanternfishTraceFrame[];
  readonly activeIndex: number;
  readonly scaleMode: GrowthScaleMode;
}

const PLOT_LEFT = 60;
const PLOT_RIGHT = 618;
const PLOT_TOP = 20;
const PLOT_BOTTOM = 156;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;

function xFor(index: number, count: number): number {
  return count <= 1 ? PLOT_LEFT + PLOT_WIDTH / 2 : PLOT_LEFT + (index / (count - 1)) * PLOT_WIDTH;
}

function yFor(ratio: number): number {
  return PLOT_BOTTOM - ratio * PLOT_HEIGHT;
}

function buildPaths(points: readonly GrowthCurvePoint[]): { line: string; area: string } {
  const coords = points.map((p, idx) => [xFor(idx, points.length), yFor(p.ratio)] as const);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const firstX = coords[0]?.[0] ?? PLOT_LEFT;
  const lastX = coords[coords.length - 1]?.[0] ?? PLOT_RIGHT;
  const segments = coords.map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `M ${firstX.toFixed(1)} ${PLOT_BOTTOM} ${segments} L ${lastX.toFixed(1)} ${PLOT_BOTTOM} Z`;
  return { line, area };
}

/** Responsive SVG area/polyline trajectory synced to the active playback day. */
export function GrowthCurveChart({ frames, activeIndex, scaleMode }: GrowthCurveChartProps) {
  const curve = buildGrowthCurve(frames, scaleMode);
  const { points } = curve;
  const clampedIdx = Math.max(0, Math.min(activeIndex, points.length - 1));
  const active = points[clampedIdx]!;
  const lastPoint = points[points.length - 1]!;
  const { line, area } = buildPaths(points);
  const activeX = xFor(clampedIdx, points.length);
  const activeY = yFor(active.ratio);
  const alignRight = clampedIdx > points.length * 0.72;

  return (
    <figure className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
        <strong>Population Trajectory ({scaleMode === 'log' ? 'Log₂ Scale' : 'Linear Scale'})</strong>
        <span className="chart-sub muted">Peak: {formatCompactBigInt(curve.maxPopulation)}</span>
      </div>
      <svg viewBox="0 0 640 190" className="chart-svg" role="img" aria-label="Lanternfish population growth curve">
        {[0, 0.5, 1].map((frac) => {
          const y = yFor(frac);
          return <line key={frac} x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y} className="chart-grid" />;
        })}
        <text x={PLOT_LEFT - 8} y={PLOT_TOP + 4} textAnchor="end" className="chart-axis-text">
          {formatCompactBigInt(curve.maxPopulation)}
        </text>
        <text x={PLOT_LEFT - 8} y={PLOT_BOTTOM + 4} textAnchor="end" className="chart-axis-text">
          0
        </text>
        <path d={area} fill="var(--accent)" fillOpacity={0.14} />
        {points.length > 1 && (
          <polyline fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinejoin="round" points={line} />
        )}
        <line x1={activeX} y1={PLOT_TOP} x2={activeX} y2={PLOT_BOTTOM} className="chart-cursor" />
        <circle cx={activeX} cy={activeY} r={4.5} fill="var(--ok)" stroke="var(--surface)" strokeWidth={1.5} />
        <text
          x={alignRight ? activeX - 8 : activeX + 8}
          y={Math.max(PLOT_TOP + 12, activeY - 8)}
          textAnchor={alignRight ? 'end' : 'start'}
          className="chart-axis-text"
          style={{ fill: 'var(--text)', fontWeight: 600 }}
        >
          d{active.day}: {active.compactLabel}
        </text>
        <text x={PLOT_LEFT} y={PLOT_BOTTOM + 20} textAnchor="start" className="chart-axis-text">
          Day {points[0]?.day ?? 0}
        </text>
        <text x={PLOT_RIGHT} y={PLOT_BOTTOM + 20} textAnchor="end" className="chart-axis-text">
          Day {lastPoint.day}
        </text>
      </svg>
    </figure>
  );
}
