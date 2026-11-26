import type { LagoonTraceFrame, ProjectedPolygon, SvgPoint, SvgViewport } from '../index';

export const LAGOON_SVG_VIEWPORT: SvgViewport = Object.freeze({ width: 640, height: 400, padding: 28 });

export interface LagoonSvgProps {
  readonly frame: LagoonTraceFrame;
  readonly projected: ProjectedPolygon;
}

function formatPoints(points: readonly SvgPoint[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

function ShoelaceFanTriangle({
  origin, start, end, term,
}: {
  readonly origin: SvgPoint;
  readonly start: SvgPoint;
  readonly end: SvgPoint;
  readonly term: bigint;
}) {
  if (term === 0n) return null;
  const color = term > 0n ? 'var(--ok)' : 'var(--warn)';
  return (
    <polygon
      points={formatPoints([origin, start, end])}
      fill={color}
      fillOpacity={0.22}
      stroke={color}
      strokeWidth={1.25}
      strokeDasharray="3 3"
    />
  );
}

function DugEdges({ frame, vertices }: { readonly frame: LagoonTraceFrame; readonly vertices: readonly SvgPoint[] }) {
  const count = vertices.length;
  const activeIdx = frame.completedEdges - 1;
  return (
    <>
      {frame.polygon.edges.slice(0, frame.completedEdges).map((edge, idx) => {
        const p1 = vertices[idx]!;
        const p2 = vertices[(idx + 1) % count]!;
        const isActive = idx === activeIdx;
        return (
          <g key={idx}>
            {isActive && (
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="var(--gold)" strokeWidth={7} strokeOpacity={0.45} strokeLinecap="round"
              />
            )}
            <line
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={edge.color} strokeWidth={isActive ? 4 : 2.8} strokeLinecap="round"
            />
          </g>
        );
      })}
    </>
  );
}

/** Interactive SVG renderer showing RGB trench edges, Shoelace fan, and molten fill. */
export function LagoonSvg({ frame, projected }: LagoonSvgProps) {
  const { origin, vertices } = projected;
  const outlinePoints = formatPoints(vertices);
  const activeIdx = frame.completedEdges - 1;
  const activeStart = vertices[activeIdx]!;
  const activeEnd = vertices[(activeIdx + 1) % vertices.length]!;

  return (
    <svg
      viewBox={`0 0 ${LAGOON_SVG_VIEWPORT.width} ${LAGOON_SVG_VIEWPORT.height}`}
      role="img"
      aria-label={`Lavaduct lagoon polygon after ${frame.completedEdges} of ${frame.polygon.stepCount} dig steps`}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
      }}
    >
      <polygon
        points={outlinePoints}
        fill={frame.isComplete ? 'var(--warn)' : 'none'}
        fillOpacity={frame.isComplete ? 0.16 : 0}
        stroke="var(--border)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <ShoelaceFanTriangle origin={origin} start={activeStart} end={activeEnd} term={frame.activeEdge.shoelaceTerm} />
      <DugEdges frame={frame} vertices={vertices} />
      <circle cx={origin.x} cy={origin.y} r={4.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.8} />
      <circle cx={activeEnd.x} cy={activeEnd.y} r={5.5} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.8} />
    </svg>
  );
}
