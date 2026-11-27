import {
  formatMoonLabel,
  projectIsometric,
  projectPlane,
  type NBodyTraceFrame,
  type OrbitBounds,
  type OrbitViewMode,
  type Point2D,
} from '../index';

export interface OrbitCanvasSvgProps {
  readonly frame: NBodyTraceFrame;
  readonly bounds: OrbitBounds;
  readonly viewMode: OrbitViewMode;
}

const MOON_COLORS: readonly string[] = ['#0969da', '#9a6700', '#1a7f37', '#8250df'];

function moonColor(index: number): string {
  return MOON_COLORS[index % MOON_COLORS.length]!;
}

function formatPointsAttr(points: readonly Point2D[]): string {
  return points.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
}

function renderProjectedBodies(
  frame: NBodyTraceFrame,
  project: (index: number, pt: NBodyTraceFrame['moons'][number]['position']) => Point2D,
) {
  return frame.moons.map((moon, idx) => {
    const trailPts = frame.trails[idx]!.map((pos) => project(idx, pos));
    const head = project(idx, moon.position);
    const color = moonColor(idx);
    const label = formatMoonLabel(idx);
    return (
      <g key={label}>
        {trailPts.length > 1 ? (
          <polyline
            points={formatPointsAttr(trailPts)}
            fill="none"
            stroke={color}
            strokeWidth={1.75}
            strokeOpacity={0.55}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        <circle cx={head.x} cy={head.y} r={5.5} fill={color} stroke="var(--surface)" strokeWidth={1.5} />
        <text
          x={head.x + 8}
          y={head.y + 3}
          fontSize={11}
          fontWeight={600}
          fill="var(--text)"
        >
          {label}
        </text>
      </g>
    );
  });
}

function renderPlanePanel(
  frame: NBodyTraceFrame,
  bounds: OrbitBounds,
  plane: 'xy' | 'xz',
  title: string,
) {
  const width = 280;
  const height = 240;
  return (
    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
      <div className="eyebrow" style={{ marginBottom: '0.35rem' }}>{title}</div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title} moon orbit projection`}
        className="chart-svg"
      >
        <line x1={width / 2} y1={12} x2={width / 2} y2={height - 12} className="chart-grid" />
        <line x1={12} y1={height / 2} x2={width - 12} y2={height / 2} className="chart-grid" />
        {renderProjectedBodies(frame, (_i, pos) => projectPlane(pos, bounds, plane, width, height))}
      </svg>
    </div>
  );
}

/** SVG orbital canvas rendering either a 3D isometric projection or dual XY/XZ planes. */
export function OrbitCanvasSvg({ frame, bounds, viewMode }: OrbitCanvasSvgProps) {
  const isoWidth = 560;
  const isoHeight = 310;

  return (
    <div
      style={{
        padding: '0.75rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
      }}
    >
      {viewMode === 'iso' ? (
        <svg
          viewBox={`0 0 ${isoWidth} ${isoHeight}`}
          role="img"
          aria-label="3D isometric moon orbit projection"
          className="chart-svg"
          style={{ maxHeight: '340px' }}
        >
          <line x1={isoWidth / 2} y1={14} x2={isoWidth / 2} y2={isoHeight - 14} className="chart-grid" />
          <line x1={20} y1={isoHeight / 2} x2={isoWidth - 20} y2={isoHeight / 2} className="chart-grid" />
          {renderProjectedBodies(frame, (_i, pos) => projectIsometric(pos, bounds, isoWidth, isoHeight))}
        </svg>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {renderPlanePanel(frame, bounds, 'xy', 'XY Plane')}
          {renderPlanePanel(frame, bounds, 'xz', 'XZ Plane')}
        </div>
      )}
    </div>
  );
}
