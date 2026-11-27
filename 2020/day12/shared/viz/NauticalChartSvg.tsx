import {
  formatCompassCoords,
  projectPoint,
  projectVectorDirection,
  Vec2,
  type ChartBounds,
  type NavigationTraceFrame,
  type ProjectedDirection,
  type ProjectedPoint,
} from '../index';

export interface NauticalChartSvgProps {
  readonly frames: readonly NavigationTraceFrame[];
  readonly bounds: ChartBounds;
  readonly activeIndex: number;
  readonly vectorLabel: string;
}

const CHART_SIZE = 420;
const CHART_PAD = 36;
const COMPASS_CX = 520;
const COMPASS_CY = 108;
const COMPASS_R = 54;

function buildPolylinePoints(frames: readonly NavigationTraceFrame[], bounds: ChartBounds, limit: number): string {
  const pts: string[] = [];
  for (let i = 0; i < limit; i += 1) {
    const p = projectPoint(frames[i]!.state.position, bounds, CHART_SIZE, CHART_PAD);
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(' ');
}

function CompassInset({
  vectorLabel,
  vector,
  dir,
}: {
  readonly vectorLabel: string;
  readonly vector: Vec2;
  readonly dir: ProjectedDirection;
}) {
  const hasDir = dir.dx !== 0 || dir.dy !== 0;
  const tipX = COMPASS_CX + dir.dx * (COMPASS_R - 12);
  const tipY = COMPASS_CY + dir.dy * (COMPASS_R - 12);
  return (
    <g>
      <rect x={432} y={8} width={178} height={404} rx={8} fill="var(--bg)" stroke="var(--border)" />
      <text x={COMPASS_CX} y={32} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--text)">
        {`${vectorLabel} Compass`}
      </text>
      <circle cx={COMPASS_CX} cy={COMPASS_CY} r={COMPASS_R} fill="var(--surface)" stroke="var(--border)" />
      <line x1={COMPASS_CX - COMPASS_R} y1={COMPASS_CY} x2={COMPASS_CX + COMPASS_R} y2={COMPASS_CY} stroke="var(--border)" strokeDasharray="2 3" />
      <line x1={COMPASS_CX} y1={COMPASS_CY - COMPASS_R} x2={COMPASS_CX} y2={COMPASS_CY + COMPASS_R} stroke="var(--border)" strokeDasharray="2 3" />
      <text x={COMPASS_CX} y={COMPASS_CY - COMPASS_R + 12} textAnchor="middle" fontSize={10} fill="var(--muted)">N</text>
      <text x={COMPASS_CX} y={COMPASS_CY + COMPASS_R - 4} textAnchor="middle" fontSize={10} fill="var(--muted)">S</text>
      <text x={COMPASS_CX + COMPASS_R - 8} y={COMPASS_CY + 3} textAnchor="middle" fontSize={10} fill="var(--muted)">E</text>
      <text x={COMPASS_CX - COMPASS_R + 8} y={COMPASS_CY + 3} textAnchor="middle" fontSize={10} fill="var(--muted)">W</text>
      {hasDir ? (
        <g>
          <line x1={COMPASS_CX} y1={COMPASS_CY} x2={tipX} y2={tipY} stroke="var(--ok)" strokeWidth={2.5} />
          <circle cx={tipX} cy={tipY} r={3.5} fill="var(--ok)" />
        </g>
      ) : (
        <circle cx={COMPASS_CX} cy={COMPASS_CY} r={4} fill="var(--muted)" />
      )}
      <text x={COMPASS_CX} y={184} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--text)">
        {formatCompassCoords(vector)}
      </text>
    </g>
  );
}

function ChartLegend({ position, manhattan }: { readonly position: Vec2; readonly manhattan: bigint }) {
  const items: readonly { readonly color: string; readonly label: string }[] = [
    { color: 'var(--border)', label: 'Full course ghost' },
    { color: 'var(--accent)', label: 'Active ship wake' },
    { color: 'var(--gold)', label: 'Manhattan L-legs' },
    { color: 'var(--ok)', label: 'Vector direction' },
  ];
  return (
    <g>
      <text x={444} y={216} fontSize={11} fill="var(--muted)">Ship Position</text>
      <text x={444} y={233} fontSize={12} fontWeight={600} fill="var(--text)">{formatCompassCoords(position)}</text>
      <text x={444} y={260} fontSize={11} fill="var(--muted)">Manhattan Distance</text>
      <text x={444} y={278} fontSize={13} fontWeight={700} fill="var(--accent)">{manhattan.toString()}</text>
      {items.map((item, idx) => (
        <g key={item.label} transform={`translate(444, ${308 + idx * 22})`}>
          <line x1={0} y1={5} x2={18} y2={5} stroke={item.color} strokeWidth={2.5} />
          <text x={24} y={9} fontSize={11} fill="var(--text)">{item.label}</text>
        </g>
      ))}
    </g>
  );
}

function ShipMarker({ pt, dir }: { readonly pt: ProjectedPoint; readonly dir: ProjectedDirection }) {
  const hasDir = dir.dx !== 0 || dir.dy !== 0;
  const angleDeg = (Math.atan2(dir.dy, dir.dx) * 180) / Math.PI;
  return (
    <g>
      {hasDir ? <line x1={pt.x} y1={pt.y} x2={pt.x + dir.dx * 26} y2={pt.y + dir.dy * 26} stroke="var(--ok)" strokeWidth={2} /> : null}
      <g transform={`translate(${pt.x}, ${pt.y}) rotate(${angleDeg})`}>
        <polygon points="10,0 -7,-6 -4,0 -7,6" fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.25} />
      </g>
    </g>
  );
}

/** Light-mode SVG nautical course chart with Manhattan L-legs and compass inset. */
export function NauticalChartSvg({ frames, bounds, activeIndex, vectorLabel }: NauticalChartSvgProps) {
  const frame = frames[activeIndex]!;
  const origin = projectPoint(Vec2.ORIGIN, bounds, CHART_SIZE, CHART_PAD);
  const shipPt = projectPoint(frame.state.position, bounds, CHART_SIZE, CHART_PAD);
  const elbowPt = projectPoint(new Vec2(frame.state.position.east, 0n), bounds, CHART_SIZE, CHART_PAD);
  const dir = projectVectorDirection(frame.state.vector);
  const ghostPoints = buildPolylinePoints(frames, bounds, frames.length);
  const wakePoints = buildPolylinePoints(frames, bounds, activeIndex + 1);
  const legPoints = `${origin.x},${origin.y} ${elbowPt.x},${elbowPt.y} ${shipPt.x},${shipPt.y}`;

  return (
    <svg className="chart-svg" viewBox="0 0 620 420" role="img" aria-label={`Nautical chart at step ${frame.stepIndex} of ${frame.totalSteps}`}>
      <rect x={8} y={8} width={CHART_SIZE - 16} height={CHART_SIZE - 16} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <line x1={CHART_PAD} y1={origin.y} x2={CHART_SIZE - CHART_PAD} y2={origin.y} stroke="var(--border)" strokeDasharray="3 3" />
      <line x1={origin.x} y1={CHART_PAD} x2={origin.x} y2={CHART_SIZE - CHART_PAD} stroke="var(--border)" strokeDasharray="3 3" />
      <polyline points={ghostPoints} fill="none" stroke="var(--border)" strokeWidth={1.5} strokeDasharray="4 4" />
      <polyline points={legPoints} fill="none" stroke="var(--gold)" strokeWidth={1.75} strokeDasharray="5 3" />
      <polyline points={wakePoints} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      <circle cx={origin.x} cy={origin.y} r={4} fill="var(--text)" />
      <ShipMarker pt={shipPt} dir={dir} />
      <CompassInset vectorLabel={vectorLabel} vector={frame.state.vector} dir={dir} />
      <ChartLegend position={frame.state.position} manhattan={frame.state.manhattanDistance} />
    </svg>
  );
}
