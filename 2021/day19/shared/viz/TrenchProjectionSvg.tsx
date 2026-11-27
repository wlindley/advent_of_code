import type {
  BeaconTraceFrame,
  ProjectedBeacon,
  ProjectedLink,
  ProjectedScanner,
} from '../index';

export interface TrenchProjectionSvgProps {
  readonly frame: BeaconTraceFrame;
}

const SVG_WIDTH = 760;
const SVG_HEIGHT = 400;
const PAD_X = 48;
const PAD_Y = 34;

function toSvgX(nx: number): number {
  return PAD_X + nx * (SVG_WIDTH - PAD_X * 2);
}

function toSvgY(ny: number): number {
  return PAD_Y + ny * (SVG_HEIGHT - PAD_Y * 2);
}

function LinkLayer({ links }: { readonly links: readonly ProjectedLink[] }) {
  return (
    <g>
      {links.map((link) => (
        <line
          key={`${link.parentId}-${link.childId}`}
          x1={toSvgX(link.x1)}
          y1={toSvgY(link.y1)}
          x2={toSvgX(link.x2)}
          y2={toSvgY(link.y2)}
          stroke={link.isActive ? 'var(--accent)' : 'var(--border)'}
          strokeWidth={link.isActive ? 2.25 : 1.25}
          strokeDasharray={link.isActive ? undefined : '4 3'}
        >
          <title>{`S${link.parentId} -> S${link.childId} (${link.overlapCount} shared beacons)`}</title>
        </line>
      ))}
    </g>
  );
}

function BeaconLayer({ beacons }: { readonly beacons: readonly ProjectedBeacon[] }) {
  const ordered = [...beacons].sort((a, b) => a.depth - b.depth);
  return (
    <g>
      {ordered.map((beacon) => (
        <circle
          key={beacon.key}
          cx={toSvgX(beacon.nx)}
          cy={toSvgY(beacon.ny)}
          r={beacon.isNew ? 3.5 : 2.3}
          fill={beacon.isNew ? 'var(--gold)' : 'var(--muted)'}
          fillOpacity={beacon.isNew ? 0.92 : 0.35 + beacon.depth * 0.45}
        >
          <title>{`Beacon ${beacon.world.format()}${beacon.isNew ? ' (new)' : ''}`}</title>
        </circle>
      ))}
    </g>
  );
}

function pickScannerFill(scanner: ProjectedScanner): string {
  if (scanner.isActive) return 'var(--accent)';
  if (scanner.isAnchor) return 'var(--ok)';
  return 'var(--text)';
}

function ScannerLayer({ scanners }: { readonly scanners: readonly ProjectedScanner[] }) {
  return (
    <g>
      {scanners.map((scanner) => {
        const cx = toSvgX(scanner.nx);
        const cy = toSvgY(scanner.ny);
        const fill = pickScannerFill(scanner);
        return (
          <g key={scanner.id}>
            <rect
              x={cx - 5}
              y={cy - 5}
              width={10}
              height={10}
              rx={2}
              fill={fill}
              stroke="var(--surface)"
              strokeWidth={1.5}
            >
              <title>{`S${scanner.id} @ ${scanner.position.format()} ${scanner.rotationLabel}`}</title>
            </rect>
            <text
              x={cx + 8}
              y={cy + 4}
              className="chart-axis-text"
              style={{ fill, fontWeight: scanner.isActive ? 700 : 600 }}
            >
              S{scanner.id}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Orthographic 3D projection (yaw 35°, pitch 22°) of aligned scanners, links, and beacons. */
export function TrenchProjectionSvg({ frame }: TrenchProjectionSvgProps) {
  const { projection } = frame;
  return (
    <figure className="chart-card">
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <strong>3D Trench Map Projection (Yaw 35° · Pitch 22°)</strong>
        <span className="chart-sub muted">
          Step {frame.rawIndex + 1} / {frame.totalRawSteps} · {frame.beacons.length} beacons
        </span>
      </div>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="chart-svg"
        role="img"
        aria-label="3D projection of aligned scanners and beacons"
      >
        <LinkLayer links={projection.links} />
        <BeaconLayer beacons={projection.beacons} />
        <ScannerLayer scanners={projection.scanners} />
      </svg>
      <figcaption className="chart-caption muted">
        Depth-cued orthographic projection using fixed global bounds; hover any beacon, link, or scanner for world coordinates.
      </figcaption>
    </figure>
  );
}
