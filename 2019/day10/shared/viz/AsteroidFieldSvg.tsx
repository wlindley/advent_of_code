import {
  type AsteroidMap,
  type AsteroidPoint,
  computeGridLayout,
  computeVisibilityColorBand,
  type GridLayout,
  type MonitorScanTraceFrame,
  pointCenter,
  type StationTraceFrame,
  type VaporizationTraceFrame,
} from '../index';

interface AsteroidFieldSvgProps {
  readonly map: AsteroidMap;
  readonly frame: StationTraceFrame;
}

function samePoint(a: AsteroidPoint, b: AsteroidPoint): boolean {
  return a.x === b.x && a.y === b.y;
}

function buildGridPath(layout: GridLayout): string {
  const parts: string[] = [];
  const xEnd = layout.padding + layout.width * layout.cellSize;
  const yEnd = layout.padding + layout.height * layout.cellSize;
  for (let x = 0; x <= layout.width; x += 1) {
    const px = layout.padding + x * layout.cellSize;
    parts.push(`M${px},${layout.padding}V${yEnd}`);
  }
  for (let y = 0; y <= layout.height; y += 1) {
    const py = layout.padding + y * layout.cellSize;
    parts.push(`M${layout.padding},${py}H${xEnd}`);
  }
  return parts.join('');
}

function buildScanRaysPath(frame: MonitorScanTraceFrame, layout: GridLayout): string {
  const origin = pointCenter(frame.candidate, layout);
  const parts: string[] = [];
  for (const target of frame.visibleTargets) {
    const dest = pointCenter(target, layout);
    parts.push(`M${origin.x},${origin.y}L${dest.x},${dest.y}`);
  }
  return parts.join('');
}

function ScanOverlay({ map, frame, layout }: { map: AsteroidMap; frame: MonitorScanTraceFrame; layout: GridLayout }) {
  const candidateCenter = pointCenter(frame.candidate, layout);
  const bestCenter = pointCenter(frame.bestStation, layout);
  const raysPath = buildScanRaysPath(frame, layout);

  return (
    <g>
      {raysPath ? <path d={raysPath} fill="none" stroke="var(--accent)" strokeOpacity={0.35} strokeWidth={1.3} /> : null}
      {map.asteroids.map((pt, idx) => {
        const c = pointCenter(pt, layout);
        const isBest = samePoint(pt, frame.bestStation);
        const fill = computeVisibilityColorBand(frame.counts[idx]!, frame.minDetectedCount, frame.maxDetectedCount, isBest);
        return <circle key={`${pt.x}-${pt.y}`} cx={c.x} cy={c.y} r={layout.asteroidRadius} fill={fill} />;
      })}
      <circle cx={bestCenter.x} cy={bestCenter.y} r={layout.asteroidRadius + 4} fill="none" stroke="var(--gold)" strokeWidth={2} />
      <circle cx={candidateCenter.x} cy={candidateCenter.y} r={layout.asteroidRadius + 2.5} fill="none" stroke="var(--accent)" strokeWidth={2} />
    </g>
  );
}

function buildVaporizedOrderMap(frame: VaporizationTraceFrame): Map<number, number> {
  const orders = new Map<number, number>();
  for (const ev of frame.vaporized) {
    orders.set(ev.target.y * 10000 + ev.target.x, ev.order);
  }
  return orders;
}

function VaporizedGlyph({ pt, order, targetOrder, layout }: { pt: AsteroidPoint; order: number; targetOrder: number; layout: GridLayout }) {
  const c = pointCenter(pt, layout);
  const isTarget = order === targetOrder;
  return (
    <circle
      cx={c.x}
      cy={c.y}
      r={layout.asteroidRadius}
      fill={isTarget ? 'var(--gold)' : 'none'}
      fillOpacity={isTarget ? 0.25 : 0}
      stroke={isTarget ? 'var(--gold)' : 'var(--muted)'}
      strokeOpacity={isTarget ? 1 : 0.45}
      strokeWidth={isTarget ? 2 : 1.2}
    />
  );
}

function VaporizationOverlay({ map, frame, layout }: { map: AsteroidMap; frame: VaporizationTraceFrame; layout: GridLayout }) {
  const sc = pointCenter(frame.station, layout);
  const ac = frame.activeEvent === null ? null : pointCenter(frame.activeEvent.target, layout);
  const orders = buildVaporizedOrderMap(frame);

  return (
    <g>
      {ac === null ? (
        <line x1={sc.x} y1={sc.y} x2={sc.x} y2={layout.padding} stroke="var(--err)" strokeWidth={1.6} strokeDasharray="4 3" />
      ) : (
        <line x1={sc.x} y1={sc.y} x2={ac.x} y2={ac.y} stroke="var(--err)" strokeWidth={2} />
      )}
      {map.asteroids.map((pt) => {
        const c = pointCenter(pt, layout);
        if (samePoint(pt, frame.station)) {
          return <circle key={`${pt.x}-${pt.y}`} cx={c.x} cy={c.y} r={layout.asteroidRadius + 1} fill="var(--gold)" stroke="var(--text)" strokeWidth={1.2} />;
        }
        const order = orders.get(pt.y * 10000 + pt.x);
        if (order !== undefined) {
          return <VaporizedGlyph key={`${pt.x}-${pt.y}`} pt={pt} order={order} targetOrder={frame.targetOrder} layout={layout} />;
        }
        return <circle key={`${pt.x}-${pt.y}`} cx={c.x} cy={c.y} r={layout.asteroidRadius} fill="var(--text)" />;
      })}
      <circle cx={sc.x} cy={sc.y} r={layout.asteroidRadius + 4.5} fill="none" stroke="var(--gold)" strokeWidth={1.8} />
      {ac !== null ? <circle cx={ac.x} cy={ac.y} r={layout.asteroidRadius + 3} fill="none" stroke="var(--err)" strokeWidth={2} /> : null}
    </g>
  );
}

/** Light-mode SVG radar and laser sweep renderer for `MonitorScanTraceFrame` and `VaporizationTraceFrame`. */
export function AsteroidFieldSvg({ map, frame }: AsteroidFieldSvgProps) {
  const layout = computeGridLayout(map.width, map.height);
  const gridPath = buildGridPath(layout);

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}
      style={{ maxWidth: Math.max(360, layout.svgWidth), background: 'var(--surface)' }}
      role="img"
      aria-label={`Asteroid field ${map.width} by ${map.height}`}
    >
      <rect x={0} y={0} width={layout.svgWidth} height={layout.svgHeight} fill="var(--surface)" />
      <path d={gridPath} fill="none" stroke="var(--border)" strokeOpacity={0.55} strokeWidth={0.75} />
      {frame.kind === 'monitor-scan' ? (
        <ScanOverlay map={map} frame={frame} layout={layout} />
      ) : (
        <VaporizationOverlay map={map} frame={frame} layout={layout} />
      )}
    </svg>
  );
}
