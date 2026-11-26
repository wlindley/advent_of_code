import type { MonkeyTraceFrame, TraceEdgeView, TraceNodeRole, TraceNodeView } from '../trace';

const SVG_WIDTH = 680;
const NODE_W = 86;
const NODE_H = 38;
const ROW_GAP = 66;
const TOP_PAD = 36;

interface NodePoint {
  readonly x: number;
  readonly y: number;
}

function nodeColors(role: TraceNodeRole): { readonly fill: string; readonly stroke: string; readonly ink: string } {
  if (role === 'active') return { fill: 'var(--accent)', stroke: 'var(--accent)', ink: 'var(--surface)' };
  if (role === 'root') return { fill: 'var(--surface)', stroke: 'var(--gold)', ink: 'var(--text)' };
  if (role === 'unknown') return { fill: 'var(--surface)', stroke: 'var(--warn)', ink: 'var(--warn)' };
  if (role === 'resolved' || role === 'constant') {
    return { fill: 'var(--surface)', stroke: 'var(--ok)', ink: 'var(--text)' };
  }
  return { fill: 'var(--bg)', stroke: 'var(--border)', ink: 'var(--muted)' };
}

function formatCompact(text: string): string {
  return text.length > 10 ? `${text.slice(0, 9)}…` : text;
}

function computePoints(nodes: readonly TraceNodeView[]): ReadonlyMap<string, NodePoint> {
  const map = new Map<string, NodePoint>();
  for (const node of nodes) {
    const x = ((node.lane + 1) / (node.laneCount + 1)) * SVG_WIDTH;
    const y = TOP_PAD + node.depth * ROW_GAP;
    map.set(node.name, { x, y });
  }
  return map;
}

function TreeEdge({ edge, points }: { readonly edge: TraceEdgeView; readonly points: ReadonlyMap<string, NodePoint> }) {
  const from = points.get(edge.from);
  const to = points.get(edge.to);
  if (!from || !to) return null;
  return (
    <line
      x1={from.x}
      y1={from.y + NODE_H / 2}
      x2={to.x}
      y2={to.y - NODE_H / 2}
      stroke={edge.highlighted ? 'var(--accent)' : 'var(--border)'}
      strokeWidth={edge.highlighted ? 2.4 : 1.5}
      strokeDasharray={edge.side === 'right' ? undefined : '4 2'}
    />
  );
}

function TreeNode({ node, point }: { readonly node: TraceNodeView; readonly point: NodePoint }) {
  const { fill, stroke, ink } = nodeColors(node.role);
  const strokeWidth = node.role === 'pending' ? 1.5 : 2.4;
  return (
    <g>
      <title>{`${node.name} | op: ${node.opText} | value: ${node.valueText} | state: ${node.role}`}</title>
      <rect
        x={point.x - NODE_W / 2}
        y={point.y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text x={point.x} y={point.y - 3} textAnchor="middle" fontSize={11} fontWeight={700} fill={ink}>
        {`${node.name} (${node.opText})`}
      </text>
      <text x={point.x} y={point.y + 12} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={ink}>
        {formatCompact(node.valueText)}
      </text>
    </g>
  );
}

export interface MonkeyTreeSvgProps {
  readonly frame: MonkeyTraceFrame;
}

/** Layered SVG expression tree / spine diagram for Day 21 Monkey Math traces. */
export function MonkeyTreeSvg({ frame }: MonkeyTreeSvgProps) {
  const points = computePoints(frame.nodes);
  const maxDepth = frame.nodes.reduce((acc, node) => Math.max(acc, node.depth), 0);
  const svgHeight = Math.max(220, TOP_PAD * 2 + maxDepth * ROW_GAP + (frame.isSampled ? 22 : 0));

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
      width="100%"
      style={{
        display: 'block',
        background: 'var(--surface)',
        borderRadius: 10,
        border: '1px solid var(--border)',
      }}
      role="img"
      aria-label={`Monkey expression diagram at step ${frame.stepIndex + 1} of ${frame.totalSteps}`}
    >
      {frame.edges.map((edge) => (
        <TreeEdge key={`${edge.from}->${edge.to}-${edge.side}`} edge={edge} points={points} />
      ))}
      {frame.nodes.map((node) => {
        const point = points.get(node.name);
        return point ? <TreeNode key={node.name} node={node} point={point} /> : null;
      })}
      {frame.isSampled && (
        <text x={SVG_WIDTH / 2} y={svgHeight - 10} textAnchor="middle" fontSize={10.5} fill="var(--muted)">
          {`Focused window (${frame.nodes.length} / ${frame.reachableCount} reachable monkeys)`}
        </text>
      )}
    </svg>
  );
}
