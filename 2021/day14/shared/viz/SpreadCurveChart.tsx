import {
  buildGrowthCurve,
  formatCompactBigInt,
  formatGroupedBigInt,
  type FrequencyScaleMode,
  type GrowthCurvePoint,
  type PolymerTraceFrame,
} from '../index';

export interface SpreadCurveChartProps {
  readonly frames: readonly PolymerTraceFrame[];
  readonly currentStep: number;
  readonly scaleMode: FrequencyScaleMode;
}

const SVG_WIDTH = 640;
const SVG_HEIGHT = 180;
const PAD_LEFT = 36;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;

function xForIndex(index: number, count: number): number {
  const span = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
  return count <= 1 ? PAD_LEFT : PAD_LEFT + (index / (count - 1)) * span;
}

function yForRatio(ratio: number): number {
  const span = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;
  return PAD_TOP + (1 - ratio) * span;
}

function buildPolyline(
  points: readonly GrowthCurvePoint[],
  pick: (point: GrowthCurvePoint) => number,
): string {
  return points
    .map((point, index) => `${xForIndex(index, points.length).toFixed(1)},${yForRatio(pick(point)).toFixed(1)}`)
    .join(' ');
}

/** SVG trajectory chart of polymer length and element spread across steps. */
export function SpreadCurveChart({ frames, currentStep, scaleMode }: SpreadCurveChartProps) {
  const points = buildGrowthCurve(frames, scaleMode);
  const activeIndex = Math.max(0, points.findIndex((p) => p.step === currentStep));
  const activePoint = points[activeIndex];
  const cursorX = xForIndex(activeIndex, points.length);

  return (
    <div className="chart-card">
      <div className="quality-header">
        <strong>Growth &amp; Spread Trajectory</strong>
        <div className="chart-legend">
          <span className="chart-legend-item">
            <span className="legend-swatch" style={{ borderTopColor: 'var(--accent)' }} />
            Length
          </span>
          <span className="chart-legend-item">
            <span className="legend-swatch" style={{ borderTopColor: 'var(--ok)' }} />
            Spread (max − min)
          </span>
        </div>
      </div>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label="Polymer length and element spread growth curve"
      >
        {[0, 0.5, 1].map((tick) => {
          const y = yForRatio(tick);
          return (
            <g key={tick}>
              <line className="chart-grid" x1={PAD_LEFT} y1={y} x2={SVG_WIDTH - PAD_RIGHT} y2={y} />
              <text className="chart-axis-text" x={4} y={y + 4}>
                {Math.round(tick * 100)}%
              </text>
            </g>
          );
        })}
        <line
          className="chart-cursor"
          x1={cursorX}
          y1={PAD_TOP}
          x2={cursorX}
          y2={SVG_HEIGHT - PAD_BOTTOM}
        />
        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.2}
          points={buildPolyline(points, (p) => p.lengthRatio)}
        />
        <polyline
          fill="none"
          stroke="var(--ok)"
          strokeWidth={2.2}
          points={buildPolyline(points, (p) => p.spreadRatio)}
        />
        {activePoint !== undefined && (
          <g>
            <circle cx={cursorX} cy={yForRatio(activePoint.lengthRatio)} r={4} fill="var(--accent)" />
            <circle cx={cursorX} cy={yForRatio(activePoint.spreadRatio)} r={4} fill="var(--ok)" />
          </g>
        )}
        <text className="chart-axis-text" x={PAD_LEFT} y={SVG_HEIGHT - 6}>
          Step {points[0]?.step ?? 0}
        </text>
        <text
          className="chart-axis-text"
          x={SVG_WIDTH - PAD_RIGHT}
          y={SVG_HEIGHT - 6}
          textAnchor="end"
        >
          Step {points[points.length - 1]?.step ?? 0}
        </text>
      </svg>
      {activePoint !== undefined && (
        <span className="chart-caption muted">
          Step {activePoint.step}: length {formatGroupedBigInt(activePoint.totalLength)} · spread{' '}
          {formatCompactBigInt(activePoint.spread)} ({scaleMode === 'log' ? 'Log₂' : 'Linear'})
        </span>
      )}
    </div>
  );
}
