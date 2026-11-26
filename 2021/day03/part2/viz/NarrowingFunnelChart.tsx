import type { ReactElement } from 'react';
import {
  FUNNEL_VIEWBOX,
  type FunnelGeometry,
  type FunnelPoint,
  type LifeSupportTraceFrame,
} from '../domain';

export interface NarrowingFunnelChartProps {
  readonly geometry: FunnelGeometry;
  readonly activeFrame: LifeSupportTraceFrame;
}

function FunnelLegend() {
  return (
    <div className="chart-legend" aria-hidden="true">
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ borderColor: 'var(--accent)' }} />
        Oxygen (most common, tie -&gt; 1)
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ borderColor: 'var(--gold)' }} />
        CO2 (least common, tie -&gt; 0)
      </span>
      <span className="chart-legend-item">
        <span className="legend-swatch" style={{ borderColor: 'var(--ok)' }} />
        Locked selection
      </span>
    </div>
  );
}

function renderPointMarkers(pt: FunnelPoint): ReactElement {
  const radius = pt.isActive ? 5 : 3;
  const stroke = pt.isActive ? 'var(--text)' : 'var(--surface)';
  const strokeWidth = pt.isActive ? 1.5 : 1;
  return (
    <g key={pt.frameIndex}>
      <circle
        cx={pt.x}
        cy={pt.oxygenY}
        r={radius}
        fill={pt.oxygenLocked ? 'var(--ok)' : 'var(--accent)'}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={pt.x}
        cy={pt.co2Y}
        r={radius}
        fill={pt.co2Locked ? 'var(--ok)' : 'var(--gold)'}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

function buildMarkerNodes(points: readonly FunnelPoint[]): readonly ReactElement[] {
  const nodes: ReactElement[] = [];
  for (const pt of points) {
    nodes.push(renderPointMarkers(pt));
  }
  return nodes;
}

/** Dual-curve SVG candidate narrowing funnel for oxygen generator and CO2 scrubber lanes. */
export function NarrowingFunnelChart({ geometry, activeFrame }: NarrowingFunnelChartProps) {
  const { width, height } = FUNNEL_VIEWBOX;
  const { plotLeft, plotRight, plotTop, plotBottom } = geometry;
  const midY = (plotTop + plotBottom) / 2;
  const lastStep = geometry.points[geometry.points.length - 1]!.step;
  const colText = activeFrame.column === null ? 'Initial' : `Col ${activeFrame.column + 1}`;

  return (
    <div className="stack">
      <FunnelLegend />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="img"
        aria-label={`Candidate narrowing funnel chart at step ${activeFrame.step}`}
      >
        <line x1={plotLeft} y1={plotTop} x2={plotRight} y2={plotTop} className="chart-grid" />
        <line x1={plotLeft} y1={midY} x2={plotRight} y2={midY} className="chart-grid" />
        <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} className="chart-grid" />
        <line x1={geometry.activeX} y1={plotTop} x2={geometry.activeX} y2={plotBottom} className="chart-cursor" />
        <text x={plotLeft - 6} y={plotTop + 4} textAnchor="end" className="chart-axis-text">
          {geometry.initialRowCount}
        </text>
        <text x={plotLeft - 6} y={plotBottom + 4} textAnchor="end" className="chart-axis-text">
          0
        </text>
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2.25} points={geometry.oxygenPath} />
        <polyline fill="none" stroke="var(--gold)" strokeWidth={2.25} points={geometry.co2Path} />
        {buildMarkerNodes(geometry.points)}
        <text x={plotLeft} y={height - 8} className="chart-axis-text">
          Steps 0..{lastStep}
        </text>
        <text x={plotRight} y={height - 8} textAnchor="end" className="chart-axis-text">
          {colText} | O2: {activeFrame.oxygen.candidateCount} | CO2: {activeFrame.co2.candidateCount}
        </text>
      </svg>
    </div>
  );
}
