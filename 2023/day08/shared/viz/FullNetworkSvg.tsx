import type { Turn } from '../network';
import type { WastelandTraceFrame } from '../trace';

export interface FullNetworkSvgProps {
  readonly frame: WastelandTraceFrame;
}

interface Point { readonly x: number; readonly y: number; }
interface EdgeStyle { readonly stroke: string; readonly width: number; readonly opacity: number; readonly marker: string; readonly priority: number; }

const CX = 260;
const CY = 165;
const RING_R = 112;
const NODE_R = 19;

function computePositions(count: number): readonly Point[] {
  return Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return { x: CX + RING_R * Math.cos(a), y: CY + RING_R * Math.sin(a) };
  });
}

function selfLoopPath(p: Point, side: Turn): string {
  const a = Math.atan2(p.y - CY, p.x - CX) + (side === 'L' ? -0.42 : 0.42);
  const [s, e] = [a - 0.34, a + 0.34];
  const [x1, y1] = [p.x + NODE_R * Math.cos(s), p.y + NODE_R * Math.sin(s)];
  const [x2, y2] = [p.x + (NODE_R + 4) * Math.cos(e), p.y + (NODE_R + 4) * Math.sin(e)];
  const [c1x, c1y] = [p.x + (NODE_R + 36) * Math.cos(a - 0.45), p.y + (NODE_R + 36) * Math.sin(a - 0.45)];
  const [c2x, c2y] = [p.x + (NODE_R + 36) * Math.cos(a + 0.45), p.y + (NODE_R + 36) * Math.sin(a + 0.45)];
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function curvedEdgePath(from: Point, to: Point, side: Turn): string {
  const [dx, dy] = [to.x - from.x, to.y - from.y];
  const dist = Math.hypot(dx, dy) || 1;
  const bend = side === 'L' ? 24 : -24;
  const [cx, cy] = [(from.x + to.x) / 2 + (-dy / dist) * bend, (from.y + to.y) / 2 + (dx / dist) * bend];
  const [ex, ey] = [to.x - cx, to.y - cy];
  const eLen = Math.hypot(ex, ey) || 1;
  const [endX, endY] = [to.x - (ex / eLen) * (NODE_R + 4), to.y - (ey / eLen) * (NODE_R + 4)];
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}

function edgeStyle(u: number, side: Turn, v: number, frame: WastelandTraceFrame): EdgeStyle {
  if (u === frame.previousNodeId && side === frame.lastTurn && v === frame.nodeId) {
    return { stroke: 'var(--gold)', width: 3, opacity: 1, marker: 'url(#wl-gold)', priority: 3 };
  }
  if (!frame.isGoal && u === frame.nodeId && side === frame.nextTurn) {
    return { stroke: 'var(--accent)', width: 2.5, opacity: 0.95, marker: 'url(#wl-accent)', priority: 2 };
  }
  if (u === frame.nodeId) {
    return { stroke: 'var(--muted)', width: 1.6, opacity: 0.7, marker: 'url(#wl-muted)', priority: 1 };
  }
  return { stroke: 'var(--border)', width: 1.2, opacity: 0.85, marker: 'url(#wl-border)', priority: 0 };
}

function renderEdges(positions: readonly Point[], frame: WastelandTraceFrame) {
  const net = frame.network;
  const items: { key: string; d: string; style: EdgeStyle }[] = [];
  for (let u = 0; u < net.nodeCount; u += 1) {
    const sides: readonly [Turn, number][] = [['L', net.leftOf(u)], ['R', net.rightOf(u)]];
    for (const [side, v] of sides) {
      const d = u === v ? selfLoopPath(positions[u]!, side) : curvedEdgePath(positions[u]!, positions[v]!, side);
      items.push({ key: `${u}-${side}`, d, style: edgeStyle(u, side, v, frame) });
    }
  }
  items.sort((a, b) => a.style.priority - b.style.priority);
  return items.map((e) => (
    <path
      key={e.key}
      d={e.d}
      fill="none"
      stroke={e.style.stroke}
      strokeWidth={e.style.width}
      strokeOpacity={e.style.opacity}
      strokeDasharray={e.key.endsWith('-R') && e.style.priority === 0 ? '4 3' : undefined}
      markerEnd={e.style.marker}
    />
  ));
}

function renderMarker(id: string, fill: string) {
  return (
    <marker key={id} id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 1 L 10 5 L 0 9 z" fill={fill} />
    </marker>
  );
}

export function FullNetworkSvg({ frame }: FullNetworkSvgProps) {
  const net = frame.network;
  const positions = computePositions(net.nodeCount);
  return (
    <section aria-label="Full wasteland network graph" style={{ padding: '0.65rem 0.8rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="meta-row" style={{ marginTop: 0, marginBottom: '0.4rem', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Network Graph ({net.nodeCount} nodes)</span>
        <span className="muted" style={{ fontSize: '0.76rem' }}>Solid = L · Dashed = R · Gold = Last step · Blue = Next step</span>
      </div>
      <svg viewBox="0 0 520 330" style={{ width: '100%', maxHeight: 340, display: 'block' }}>
        <defs>
          {renderMarker('wl-border', 'var(--border)')}
          {renderMarker('wl-muted', 'var(--muted)')}
          {renderMarker('wl-accent', 'var(--accent)')}
          {renderMarker('wl-gold', 'var(--gold)')}
        </defs>
        {renderEdges(positions, frame)}
        {positions.map((pos, id) => {
          const isCurrent = id === frame.nodeId;
          const isPrev = id === frame.previousNodeId;
          const fill = isCurrent ? (frame.isGoal ? 'var(--ok)' : 'var(--accent)') : 'var(--surface)';
          const stroke = isCurrent ? fill : isPrev ? 'var(--gold)' : 'var(--text)';
          return (
            <g key={net.labelOf(id)}>
              <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={isCurrent || isPrev ? 2.5 : 1.5} />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={isCurrent ? 'var(--surface)' : 'var(--text)'} style={{ fontFamily: 'ui-monospace, monospace' }}>
                {net.labelOf(id)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
