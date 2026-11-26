import { CHART_VIEWBOX, type ColumnBarGeometry, type ColumnChartGeometry } from '../index';

export interface ColumnTallyChartProps {
  readonly geometry: ColumnChartGeometry;
  readonly activeColumn: number;
}

interface BarGroupProps {
  readonly bar: ColumnBarGeometry;
  readonly showBitLabel: boolean;
  readonly showColLabel: boolean;
  readonly plotTop: number;
  readonly plotBottom: number;
}

function ColumnBarGroup({ bar, showBitLabel, showColLabel, plotTop, plotBottom }: BarGroupProps) {
  const onesFill = bar.isActive ? 'var(--ok)' : 'var(--accent)';
  const activeStroke = bar.isActive ? 'var(--text)' : 'none';
  return (
    <g>
      <rect
        x={bar.x}
        y={bar.zerosY}
        width={bar.width}
        height={bar.zerosHeight}
        fill="var(--bg)"
        stroke="var(--border)"
        strokeWidth={0.75}
      />
      <rect
        x={bar.x}
        y={bar.onesY}
        width={bar.width}
        height={bar.onesHeight}
        fill={onesFill}
        stroke={activeStroke}
        strokeWidth={bar.isActive ? 1.5 : 0}
      />
      {showBitLabel && (
        <text x={bar.centerX} y={plotTop - 6} textAnchor="middle" className="chart-axis-text">
          {bar.gammaBit}
        </text>
      )}
      {showColLabel && (
        <text x={bar.centerX} y={plotBottom + 13} textAnchor="middle" className="chart-axis-text">
          {bar.column + 1}
        </text>
      )}
    </g>
  );
}

function ChartLegend() {
  return (
    <div className="chart-legend" aria-hidden="true">
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ borderColor: 'var(--accent)' }} />
        1-bit share
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ borderColor: 'var(--ok)' }} />
        Active column (1s)
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch dashed" style={{ borderColor: 'var(--gold)' }} />
        50% tie line
      </span>
    </div>
  );
}

/** Stacked 1/0 bit-proportion SVG bar chart with 50% tie midline and sliding column window. */
export function ColumnTallyChart({ geometry, activeColumn }: ColumnTallyChartProps) {
  const { width, height } = CHART_VIEWBOX;
  const { plotLeft, plotRight, plotTop, plotBottom, midlineY, bars } = geometry;
  const showBitLabel = bars.length <= 28;
  const showAllColLabels = bars.length <= 16;

  return (
    <div className="stack">
      <ChartLegend />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="img"
        aria-label={`Bit proportion chart across ${geometry.totalColumns} diagnostic columns, active column ${activeColumn + 1}`}
      >
        <text x={plotLeft - 6} y={plotTop + 8} textAnchor="end" className="chart-axis-text">100%</text>
        <text x={plotLeft - 6} y={midlineY + 4} textAnchor="end" className="chart-axis-text">50%</text>
        <text x={plotLeft - 6} y={plotBottom} textAnchor="end" className="chart-axis-text">0%</text>
        {bars.map((bar) => (
          <ColumnBarGroup
            key={bar.column}
            bar={bar}
            showBitLabel={showBitLabel}
            showColLabel={showAllColLabels || bar.isActive}
            plotTop={plotTop}
            plotBottom={plotBottom}
          />
        ))}
        <line x1={plotLeft} y1={midlineY} x2={plotRight} y2={midlineY} className="chart-ref-line" />
        <text x={plotLeft} y={height - 6} className="chart-axis-text">
          Cols {geometry.windowStart + 1}..{geometry.windowEnd} / {geometry.totalColumns}
        </text>
        <text x={plotRight} y={height - 6} textAnchor="end" className="chart-ref-text">
          Ties favor 1 (gamma) / 0 (epsilon)
        </text>
      </svg>
    </div>
  );
}
