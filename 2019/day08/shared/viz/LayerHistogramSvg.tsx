import { useMemo } from 'react';
import { computeHistogramBars, type LayerDigitCounts } from '../index';

interface LayerHistogramSvgProps {
  readonly allLayerCounts: readonly LayerDigitCounts[];
  readonly activeLayerIndex: number;
  readonly bestLayerIndex: number;
}

/** Stacked 0/1/2 layer composition histogram highlighting active and min-zero layers. */
export function LayerHistogramSvg({
  allLayerCounts,
  activeLayerIndex,
  bestLayerIndex,
}: LayerHistogramSvgProps) {
  const layout = useMemo(
    () => computeHistogramBars(allLayerCounts, activeLayerIndex, bestLayerIndex),
    [allLayerCounts, activeLayerIndex, bestLayerIndex],
  );

  return (
    <figure className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className="eyebrow">Layer Digit Composition (0 / 1 / 2)</span>
        <div className="chart-legend">
          <span className="chart-legend-item">
            <span className="legend-swatch" style={{ background: 'var(--text)', height: 8, border: 'none' }} />0 (Black)
          </span>
          <span className="chart-legend-item">
            <span className="legend-swatch" style={{ background: 'var(--surface)', height: 8, border: '1px solid var(--border)' }} />1 (White)
          </span>
          <span className="chart-legend-item">
            <span className="legend-swatch" style={{ background: 'var(--muted)', opacity: 0.35, height: 8, border: 'none' }} />2 (Transparent)
          </span>
          <span className="chart-legend-item" style={{ color: 'var(--gold)', fontWeight: 600 }}>Best Min-0</span>
          <span className="chart-legend-item" style={{ color: 'var(--accent)', fontWeight: 600 }}>Active</span>
        </div>
      </div>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}
        role="img"
        aria-label="Stacked layer digit histogram"
      >
        <text x={layout.plotLeft - 6} y={layout.plotTop + 8} textAnchor="end" className="chart-axis-text">100%</text>
        <text x={layout.plotLeft - 6} y={layout.plotTop + layout.plotHeight} textAnchor="end" className="chart-axis-text">0%</text>
        {layout.bars.map((bar) => (
          <g key={bar.layerIndex}>
            <rect x={bar.x} y={bar.zeroY} width={bar.width} height={bar.zeroHeight} fill="var(--text)" />
            <rect x={bar.x} y={bar.oneY} width={bar.width} height={bar.oneHeight} fill="var(--surface)" stroke="var(--border)" strokeWidth={0.5} />
            <rect x={bar.x} y={bar.twoY} width={bar.width} height={bar.twoHeight} fill="var(--muted)" fillOpacity={0.3} />
            {bar.isBest ? (
              <rect
                x={bar.x - 1}
                y={layout.plotTop - 2}
                width={bar.width + 2}
                height={layout.plotHeight + 4}
                fill="none"
                stroke="var(--gold)"
                strokeWidth={2}
              />
            ) : null}
            {bar.isActive ? (
              <rect
                x={bar.x - 2}
                y={layout.plotTop - 4}
                width={bar.width + 4}
                height={layout.plotHeight + 8}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
              />
            ) : null}
          </g>
        ))}
        <text x={layout.plotLeft} y={layout.svgHeight - 6} className="chart-axis-text">Layer 1</text>
        <text x={layout.plotLeft + layout.plotWidth} y={layout.svgHeight - 6} textAnchor="end" className="chart-axis-text">
          Layer {layout.bars.length}
        </text>
      </svg>
    </figure>
  );
}
