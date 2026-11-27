import type {
  Cuboid,
  FaceQuad,
  ProjectedCuboid,
  ReactorTraceFrame,
  SceneBounds,
  Viewport,
} from '../index';
import { projectCuboid, projectCuboids } from '../index';

export interface ReactorIsoSvgProps {
  readonly frame: ReactorTraceFrame;
  readonly bounds: SceneBounds;
  readonly regionBox: Cuboid | null;
}

const VIEWPORT: Viewport = { width: 640, height: 420, padding: 28 };
export const MAX_RENDERED_CUBOIDS = 400;

function pointsAttr(face: FaceQuad): string {
  return face.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
}

function formatCuboidTitle(c: Cuboid): string {
  return `x=${c.x.start}..${c.x.end}, y=${c.y.start}..${c.y.end}, z=${c.z.start}..${c.z.end} (${c.volume} cubes)`;
}

function SolidCuboidFaces({ item }: { readonly item: ProjectedCuboid }) {
  const faces: readonly (readonly [FaceQuad, number])[] = [
    [item.topFace, 24],
    [item.leftFace, 44],
    [item.rightFace, 62],
  ];
  return (
    <g>
      <title>{formatCuboidTitle(item.cuboid)}</title>
      {faces.map(([face, pct], idx) => (
        <polygon
          key={idx}
          points={pointsAttr(face)}
          fill={`color-mix(in srgb, var(--accent) ${pct}%, var(--surface))`}
          stroke="var(--accent)"
          strokeWidth={0.75}
          strokeOpacity={0.7}
        />
      ))}
    </g>
  );
}

interface WireframeProps {
  readonly cuboid: Cuboid;
  readonly bounds: SceneBounds;
  readonly stroke: string;
  readonly fill: string;
  readonly strokeWidth: number;
  readonly dashed: boolean;
  readonly label: string;
}

function WireframeOverlay({ cuboid, bounds, stroke, fill, strokeWidth, dashed, label }: WireframeProps) {
  const projected = projectCuboid(cuboid, bounds, VIEWPORT);
  const dash = dashed ? '5 3' : undefined;
  return (
    <g pointerEvents="none">
      <title>{label}</title>
      {[projected.topFace, projected.leftFace, projected.rightFace].map((face, idx) => (
        <polygon
          key={idx}
          points={pointsAttr(face)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      ))}
    </g>
  );
}

/** 3D isometric SVG rendering depth-sorted active reactor cuboids and step overlay. */
export function ReactorIsoSvg({ frame, bounds, regionBox }: ReactorIsoSvgProps) {
  const projection = projectCuboids(frame.activeCuboids, bounds, VIEWPORT, MAX_RENDERED_CUBOIDS);
  const activeStep = frame.clippedCuboid;
  const isOn = frame.step.action === 'on';
  const stepColor = isOn ? 'var(--ok)' : 'var(--err)';
  const stepFill = isOn
    ? 'color-mix(in srgb, var(--ok) 14%, transparent)'
    : 'color-mix(in srgb, var(--err) 14%, transparent)';

  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <svg
        viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
        className="chart-svg"
        role="img"
        aria-label={`Isometric reactor cuboids at step ${frame.stepIndex + 1} of ${frame.totalSteps}, ${frame.onCount} cubes on`}
      >
        {regionBox !== null && (
          <WireframeOverlay
            cuboid={regionBox}
            bounds={bounds}
            stroke="var(--border)"
            fill="none"
            strokeWidth={1.1}
            dashed
            label="Initialization bounds [-50..50]^3"
          />
        )}
        <g>{projection.cuboids.map((item, idx) => <SolidCuboidFaces key={idx} item={item} />)}</g>
        {activeStep !== null && (
          <WireframeOverlay
            cuboid={activeStep}
            bounds={bounds}
            stroke={stepColor}
            fill={stepFill}
            strokeWidth={1.85}
            dashed={!isOn}
            label={`Active ${frame.step.action}: ${formatCuboidTitle(activeStep)}`}
          />
        )}
      </svg>
      <div className="chart-legend muted">
        <span className="chart-legend-item">
          <span className="legend-swatch" style={{ borderTopColor: 'var(--accent)', borderTopWidth: '3px' }} />
          Active ON prisms ({projection.cuboids.length}
          {projection.truncatedCount > 0 ? ` shown, +${projection.truncatedCount} smaller omitted` : ''})
        </span>
        <span className="chart-legend-item">
          <span className="legend-swatch" style={{ borderTopColor: 'var(--ok)' }} />
          Step ON box
        </span>
        <span className="chart-legend-item">
          <span className="legend-swatch dashed" style={{ borderTopColor: 'var(--err)' }} />
          Step OFF cut
        </span>
      </div>
    </div>
  );
}
