import type { LayoutNode, OrbitTreeLayout } from '../types';
import type { OrbitTraceFrame } from '../policy';

export interface OrbitTreeSvgProps {
  readonly layout: OrbitTreeLayout;
  readonly frame: OrbitTraceFrame;
}

function getNodeVisual(
  node: LayoutNode,
  frame: OrbitTraceFrame,
  traversed: ReadonlySet<number>,
): { readonly fill: string; readonly stroke: string; readonly r: number; readonly active: boolean } {
  if (frame.kind === 'depth-sweep') {
    if (node.depth === frame.activeDepth) {
      return { fill: 'var(--accent)', stroke: 'var(--text)', r: 7, active: true };
    }
    if (node.depth < frame.activeDepth) {
      return { fill: 'var(--ok)', stroke: 'var(--surface)', r: 5.5, active: true };
    }
    return { fill: 'var(--surface)', stroke: 'var(--border)', r: 4.5, active: false };
  }
  if (node.id === frame.fromNodeId || node.id === frame.toNodeId) {
    return { fill: 'var(--ok)', stroke: 'var(--text)', r: 7, active: true };
  }
  if (traversed.has(node.id)) {
    return { fill: 'var(--accent)', stroke: 'var(--text)', r: 6, active: true };
  }
  return { fill: 'var(--surface)', stroke: 'var(--border)', r: 4, active: false };
}

function isEdgeActive(
  parentId: number,
  childId: number,
  childDepth: number,
  frame: OrbitTraceFrame,
  traversed: ReadonlySet<number>,
): boolean {
  if (frame.kind === 'depth-sweep') return childDepth <= frame.activeDepth;
  return traversed.has(parentId) && traversed.has(childId);
}

/** Crossing-free layered SVG rendering of small orbit trees (`<= 64` nodes). */
export function OrbitTreeSvg({ layout, frame }: OrbitTreeSvgProps) {
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  const traversed = new Set(frame.kind === 'transfer' ? frame.traversedNodeIds : []);

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label="Orbit tree topology"
    >
      <title>Rooted orbit tree from COM</title>
      {layout.edges.map((edge) => {
        const parent = byId.get(edge.parentId)!;
        const child = byId.get(edge.childId)!;
        const active = isEdgeActive(edge.parentId, edge.childId, child.depth, frame, traversed);
        return (
          <line
            key={`${edge.parentId}-${edge.childId}`}
            x1={parent.x}
            y1={parent.y}
            x2={child.x}
            y2={child.y}
            stroke={active ? 'var(--accent)' : 'var(--border)'}
            strokeWidth={active ? 2.4 : 1.3}
          />
        );
      })}
      {layout.nodes.map((node) => {
        const isLca = frame.kind === 'transfer' && node.id === frame.lcaNodeId;
        const style = getNodeVisual(node, frame, traversed);
        return (
          <g key={node.id}>
            {isLca ? (
              <polygon
                points={`${node.x},${node.y - 8} ${node.x + 8},${node.y} ${node.x},${node.y + 8} ${node.x - 8},${node.y}`}
                fill="var(--gold)"
                stroke="var(--text)"
                strokeWidth={1.5}
              />
            ) : (
              <circle
                cx={node.x}
                cy={node.y}
                r={style.r}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={1.5}
              />
            )}
            <text
              x={node.x}
              y={node.y - 10}
              textAnchor="middle"
              fontSize={10}
              fontWeight={style.active || isLca || node.id === 0 ? 700 : 500}
              fill={style.active || isLca || node.id === 0 ? 'var(--text)' : 'var(--muted)'}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
