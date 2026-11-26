import { useId } from 'react';
import {
  computeGridLayout,
  type GridLayout,
  PIXEL_BLACK,
  PIXEL_TRANSPARENT,
  PIXEL_WHITE,
  type SpaceImageTraceFrame,
} from '../index';

interface SingleGridProps {
  readonly title: string;
  readonly frame: SpaceImageTraceFrame;
  readonly layout: GridLayout;
  readonly mode: 'layer' | 'composite';
  readonly hatchId: string;
}

function cellFill(pixel: number, hatchId: string): string {
  if (pixel === PIXEL_BLACK) return 'var(--text)';
  if (pixel === PIXEL_WHITE) return 'var(--surface)';
  if (pixel === PIXEL_TRANSPARENT) return `url(#${hatchId})`;
  return 'var(--bg)';
}

function SinglePixelGrid({ title, frame, layout, mode, hatchId }: SingleGridProps) {
  const { width, height } = frame.dimensions;
  const cells: React.JSX.Element[] = [];

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const pixel = mode === 'layer' ? frame.currentPixelAt(row, col) : frame.compositePixelAt(row, col);
      const isHighlight = mode === 'composite' && frame.isNewlyResolvedAt(row, col);
      const x = layout.padding + col * (layout.cellSize + layout.gap);
      const y = layout.padding + row * (layout.cellSize + layout.gap);
      const stroke = isHighlight ? 'var(--gold)' : 'var(--border)';

      cells.push(
        <g key={`${row}-${col}`}>
          <rect
            x={x}
            y={y}
            width={layout.cellSize}
            height={layout.cellSize}
            rx={2}
            fill={cellFill(pixel, hatchId)}
            stroke={stroke}
            strokeWidth={isHighlight ? 2 : 0.75}
          />
          {pixel > PIXEL_TRANSPARENT ? (
            <text
              x={x + layout.cellSize / 2}
              y={y + layout.cellSize / 2 + 3}
              textAnchor="middle"
              fontSize={Math.max(8, layout.cellSize * 0.55)}
              fill="var(--muted)"
            >
              {pixel}
            </text>
          ) : null}
        </g>,
      );
    }
  }

  return (
    <figure className="chart-card" style={{ flex: '1 1 280px' }}>
      <figcaption className="eyebrow">{title}</figcaption>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}
        role="img"
        aria-label={title}
      >
        <defs>
          <pattern id={hatchId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={6} height={6} fill="var(--bg)" />
            <line x1={0} y1={0} x2={0} y2={6} stroke="var(--border)" strokeWidth={2} />
          </pattern>
        </defs>
        <rect x={0} y={0} width={layout.svgWidth} height={layout.svgHeight} fill="var(--bg)" rx={4} />
        {cells}
      </svg>
    </figure>
  );
}

/** Dual pixel-grid SVG showing active layer alongside progressive composite. */
export function SpaceImageGridSvg({ frame }: { readonly frame: SpaceImageTraceFrame }) {
  const hatchId = useId();
  const layout = computeGridLayout(frame.dimensions);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
      <SinglePixelGrid
        title={`Active Layer #${frame.layerIndex + 1}`}
        frame={frame}
        layout={layout}
        mode="layer"
        hatchId={`${hatchId}-layer`}
      />
      <SinglePixelGrid
        title="Progressive Composite (Gold = Newly Resolved)"
        frame={frame}
        layout={layout}
        mode="composite"
        hatchId={`${hatchId}-comp`}
      />
    </div>
  );
}
