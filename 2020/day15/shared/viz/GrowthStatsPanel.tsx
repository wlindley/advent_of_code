import {
  projectGrowthSparkline,
  type MemoryGameTraceFrame,
  type SparklinePoint,
} from '../index';

const SVG_W = 640;
const SVG_H = 128;
const PAD_X = 16;
const PAD_Y = 14;

function pointX(xNorm: number): number {
  return PAD_X + xNorm * (SVG_W - 2 * PAD_X);
}

function pointY(yNorm: number): number {
  return SVG_H - PAD_Y - yNorm * (SVG_H - 2 * PAD_Y);
}

function buildPolyline(
  points: readonly SparklinePoint[],
  metric: 'distinctYNorm' | 'maxSpokenYNorm',
): string {
  return points.map((p) => `${pointX(p.xNorm).toFixed(1)},${pointY(p[metric]).toFixed(1)}`).join(' ');
}

function StatTile({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="metric-tile">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/** Trajectory sparkline and cumulative statistics for the memory game trace. */
export function GrowthStatsPanel({
  frames,
  currentIndex,
  frame,
}: {
  readonly frames: readonly MemoryGameTraceFrame[];
  readonly currentIndex: number;
  readonly frame: MemoryGameTraceFrame;
}) {
  const spark = projectGrowthSparkline(frames, currentIndex);
  const current = spark.currentPoint;
  const cursorX = current ? pointX(current.xNorm) : PAD_X;

  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>Sequence Growth</strong>
        <div className="chart-legend">
          <span className="chart-legend-item">
            <span className="legend-swatch" style={{ borderTopColor: 'var(--accent)' }} />
            <span>{`Distinct (${frame.distinctCount})`}</span>
          </span>
          <span className="chart-legend-item">
            <span className="legend-swatch" style={{ borderTopColor: 'var(--gold)' }} />
            <span>{`Peak (${frame.maxSpoken})`}</span>
          </span>
        </div>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Distinct values and peak spoken growth chart">
        <line className="chart-grid" x1={PAD_X} y1={SVG_H - PAD_Y} x2={SVG_W - PAD_X} y2={SVG_H - PAD_Y} />
        <line className="chart-grid" x1={PAD_X} y1={SVG_H / 2} x2={SVG_W - PAD_X} y2={SVG_H / 2} />
        <line className="chart-cursor" x1={cursorX} y1={PAD_Y} x2={cursorX} y2={SVG_H - PAD_Y} />
        {spark.points.length > 1 && (
          <g>
            <polyline fill="none" stroke="var(--gold)" strokeWidth={2} points={buildPolyline(spark.points, 'maxSpokenYNorm')} />
            <polyline fill="none" stroke="var(--accent)" strokeWidth={2.2} points={buildPolyline(spark.points, 'distinctYNorm')} />
          </g>
        )}
        {current && (
          <g>
            <circle cx={cursorX} cy={pointY(current.maxSpokenYNorm)} r={4} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.5} />
            <circle cx={cursorX} cy={pointY(current.distinctYNorm)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      <div className="metrics-grid">
        <StatTile label="Distinct Spoken" value={String(frame.distinctCount)} />
        <StatTile label="Zero Count" value={String(frame.zeroCount)} />
        <StatTile label="Peak Spoken" value={String(frame.maxSpoken)} />
        <StatTile label="Window Repeats" value={`${Math.round(frame.repeatRatio * 100)}%`} />
      </div>
    </div>
  );
}
