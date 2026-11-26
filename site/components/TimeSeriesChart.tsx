import { useId, useState } from 'react';
import type { ChartSeries, TimePoint } from '../data/metricsSeries';
import { ChartDataTable } from './ChartDataTable';

export interface TimeSeriesChartProps {
  readonly title: string;
  readonly subtitle: string;
  readonly series: readonly ChartSeries[];
  readonly formatValue: (value: number) => string;
  readonly yMin?: number;
  readonly yMax?: number;
  readonly referenceLine?: { readonly value: number; readonly label: string };
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 18, right: 18, bottom: 34, left: 56 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function computeBounds(
  series: readonly ChartSeries[],
  fixedMin?: number,
  fixedMax?: number,
  refValue?: number,
): { minT: number; maxT: number; minY: number; maxY: number } {
  let minT = Infinity;
  let maxT = -Infinity;
  let minY = fixedMin ?? Infinity;
  let maxY = fixedMax ?? -Infinity;
  for (const s of series) {
    for (const p of s.points) {
      if (p.timestampMs < minT) minT = p.timestampMs;
      if (p.timestampMs > maxT) maxT = p.timestampMs;
      if (fixedMin === undefined && p.value < minY) minY = p.value;
      if (fixedMax === undefined && p.value > maxY) maxY = p.value;
    }
  }
  if (refValue !== undefined) {
    if (fixedMin === undefined && refValue < minY) minY = refValue;
    if (fixedMax === undefined && refValue > maxY) maxY = refValue;
  }
  if (!Number.isFinite(minY)) minY = 0;
  if (!Number.isFinite(maxY) || maxY === minY) maxY = minY + 1;
  return { minT, maxT, minY, maxY };
}

function mapX(timestampMs: number, minT: number, maxT: number): number {
  if (maxT <= minT) return PAD.left + PLOT_W / 2;
  return PAD.left + ((timestampMs - minT) / (maxT - minT)) * PLOT_W;
}

function mapY(value: number, minY: number, maxY: number): number {
  return PAD.top + PLOT_H - ((value - minY) / (maxY - minY)) * PLOT_H;
}

function buildLinePath(pts: readonly TimePoint[], minT: number, maxT: number, minY: number, maxY: number): string {
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${mapX(p.timestampMs, minT, maxT).toFixed(1)},${mapY(p.value, minY, maxY).toFixed(1)}`)
    .join(' ');
}

function buildAreaPath(pts: readonly TimePoint[], minT: number, maxT: number, minY: number, maxY: number): string {
  const line = buildLinePath(pts, minT, maxT, minY, maxY);
  const lastX = mapX(pts[pts.length - 1]!.timestampMs, minT, maxT).toFixed(1);
  const firstX = mapX(pts[0]!.timestampMs, minT, maxT).toFixed(1);
  return `${line} L${lastX},${(PAD.top + PLOT_H).toFixed(1)} L${firstX},${(PAD.top + PLOT_H).toFixed(1)} Z`;
}

function findNearestIndex(points: readonly TimePoint[], ratioX: number, minT: number, maxT: number): number {
  if (points.length <= 1 || maxT <= minT) return 0;
  const targetT = minT + Math.max(0, Math.min(1, ratioX)) * (maxT - minT);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const dist = Math.abs(points[i]!.timestampMs - targetT);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function TimeSeriesChart({
  title,
  subtitle,
  series,
  formatValue,
  yMin,
  yMax,
  referenceLine,
}: TimeSeriesChartProps) {
  const titleId = useId();
  const primary = series[0];
  const points = primary?.points ?? [];
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <figure className="chart-card">
        <div className="quality-header">
          <div><strong>{title}</strong><div className="muted chart-sub">{subtitle}</div></div>
        </div>
        <p className="muted chart-empty">No data points recorded for this scope yet.</p>
      </figure>
    );
  }

  const { minT, maxT, minY, maxY } = computeBounds(series, yMin, yMax, referenceLine?.value);
  const activeIdx = hoverIndex !== null && hoverIndex < points.length ? hoverIndex : points.length - 1;
  const activePoint = points[activeIdx]!;
  const ticksY = [0, 0.25, 0.5, 0.75, 1].map((t) => minY + t * (maxY - minY));
  const xTickIndices =
    points.length === 1 ? [0] : points.length === 2 ? [0, 1] : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const firstVal = formatValue(points[0]!.value);
  const latestVal = formatValue(points[points.length - 1]!.value);
  const activeX = mapX(activePoint.timestampMs, minT, maxT);

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    setHoverIndex(findNearestIndex(points, (svgX - PAD.left) / PLOT_W, minT, maxT));
  };

  return (
    <figure className="chart-card">
      <div className="quality-header">
        <div>
          <strong>{title}</strong>
          <div className="muted chart-sub">{subtitle}</div>
        </div>
        <span className="badge nowrap">{formatValue(activePoint.value)}</span>
      </div>

      <div className="chart-legend">
        {series.map((s) => {
          const val = s.points[activeIdx]?.value ?? s.points[s.points.length - 1]?.value;
          return (
            <span key={s.id} className="chart-legend-item nowrap">
              <span
                className={s.dashed ? 'legend-swatch dashed' : 'legend-swatch'}
                style={{ borderColor: s.color, backgroundColor: s.dashed ? 'transparent' : s.color }}
              />
              {s.name}: <strong>{val !== undefined ? formatValue(val) : '—'}</strong>
            </span>
          );
        })}
        <span className="muted nowrap">· {activePoint.label}</span>
      </div>

      <svg
        className="chart-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={titleId}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <title id={titleId}>{`${title}: ${points.length} points from ${firstVal} to ${latestVal}`}</title>
        {ticksY.map((val, i) => {
          const y = mapY(val, minY, maxY);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={WIDTH - PAD.right} y2={y} className="chart-grid" />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="chart-axis-text">{formatValue(val)}</text>
            </g>
          );
        })}
        {referenceLine && (
          <g>
            <line x1={PAD.left} y1={mapY(referenceLine.value, minY, maxY)} x2={WIDTH - PAD.right} y2={mapY(referenceLine.value, minY, maxY)} className="chart-ref-line" />
            <text x={WIDTH - PAD.right - 4} y={mapY(referenceLine.value, minY, maxY) - 4} textAnchor="end" className="chart-ref-text">{referenceLine.label}</text>
          </g>
        )}
        {primary && primary.points.length >= 2 && (
          <path d={buildAreaPath(primary.points, minT, maxT, minY, maxY)} fill={primary.color} fillOpacity={0.09} />
        )}
        {series.map((s) => (
          <path key={s.id} d={buildLinePath(s.points, minT, maxT, minY, maxY)} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.8 : 2.2} strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        <line x1={activeX} y1={PAD.top} x2={activeX} y2={PAD.top + PLOT_H} className="chart-cursor" />
        {series.map((s) => {
          const pt = s.points[activeIdx];
          return pt ? <circle key={s.id} cx={mapX(pt.timestampMs, minT, maxT)} cy={mapY(pt.value, minY, maxY)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} /> : null;
        })}
        {xTickIndices.map((idx, i) => {
          const pt = points[idx]!;
          const anchor = i === 0 ? 'start' : i === xTickIndices.length - 1 ? 'end' : 'middle';
          return <text key={`${idx}-${i}`} x={mapX(pt.timestampMs, minT, maxT)} y={HEIGHT - 10} textAnchor={anchor} className="chart-axis-text">{pt.label}</text>;
        })}
      </svg>

      <figcaption className="chart-caption muted">
        {activePoint.detail} · Range {firstVal} → {latestVal} ({points.length} pts)
      </figcaption>
      <ChartDataTable title={title} points={points} series={series} formatValue={formatValue} />
    </figure>
  );
}
