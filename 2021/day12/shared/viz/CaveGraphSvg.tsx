import type { ReactNode } from 'react';
import {
  findRevisitedSmallCave,
  type CaveEdgeLayout,
  type CaveGraphLayout,
  type CaveNodeLayout,
  type CaveTraceFrame,
} from '../index';

interface NodeStyle {
  readonly fill: string;
  readonly stroke: string;
  readonly textFill: string;
  readonly strokeWidth: number;
}

function buildActiveEdgeKeys(path: readonly string[]): Set<string> {
  const keys = new Set<string>();
  for (let i = 0; i + 1 < path.length; i += 1) {
    const u = path[i]!;
    const v = path[i + 1]!;
    keys.add(u < v ? `${u}-${v}` : `${v}-${u}`);
  }
  return keys;
}

function getNodeStyle(
  node: CaveNodeLayout,
  isHead: boolean,
  isVisited: boolean,
  isRevisited: boolean,
): NodeStyle {
  if (node.kind === 'start') {
    return {
      fill: isHead ? 'var(--accent)' : '#e6f0fc',
      stroke: 'var(--accent)',
      textFill: isHead ? 'var(--surface)' : 'var(--accent)',
      strokeWidth: 2.2,
    };
  }
  if (node.kind === 'end') {
    return {
      fill: isHead ? 'var(--ok)' : '#e6f4ea',
      stroke: 'var(--ok)',
      textFill: isHead ? 'var(--surface)' : 'var(--ok)',
      strokeWidth: 2.2,
    };
  }
  if (node.kind === 'big') {
    return {
      fill: isVisited ? '#dbeafe' : 'var(--surface)',
      stroke: isHead ? 'var(--accent)' : 'var(--text)',
      textFill: 'var(--text)',
      strokeWidth: isHead ? 2.6 : 1.8,
    };
  }
  return {
    fill: isRevisited ? '#fef3c7' : isVisited ? '#e8f0fe' : 'var(--surface)',
    stroke: isRevisited ? 'var(--gold)' : isHead || isVisited ? 'var(--accent)' : 'var(--border)',
    textFill: isRevisited ? 'var(--gold)' : 'var(--text)',
    strokeWidth: isRevisited || isHead ? 2.4 : 1.5,
  };
}

function renderEdge(edge: CaveEdgeLayout, activeEdges: ReadonlySet<string>): ReactNode {
  const key = `${edge.from}-${edge.to}`;
  const isActive = activeEdges.has(key);
  const d = `M ${edge.x1} ${edge.y1} Q ${edge.cx} ${edge.cy} ${edge.x2} ${edge.y2}`;
  return (
    <path
      key={key} d={d} fill="none"
      stroke={isActive ? 'var(--accent)' : 'var(--border)'}
      strokeWidth={isActive ? 3 : 1.5} strokeLinecap="round"
    />
  );
}

function renderNode(
  node: CaveNodeLayout,
  isHead: boolean,
  isVisited: boolean,
  isRevisited: boolean,
): ReactNode {
  const style = getNodeStyle(node, isHead, isVisited, isRevisited);
  const r = node.kind === 'start' || node.kind === 'end' ? 19 : 16;
  return (
    <g key={node.name}>
      {isRevisited && (
        <circle
          cx={node.x} cy={node.y} r={24}
          fill="none" stroke="var(--gold)" strokeWidth={2.5} strokeDasharray="4 2"
        />
      )}
      {node.kind === 'big' ? (
        <rect
          x={node.x - 20} y={node.y - 16} width={40} height={32} rx={8}
          fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth}
        />
      ) : (
        <circle
          cx={node.x} cy={node.y} r={r}
          fill={style.fill} stroke={style.stroke} strokeWidth={style.strokeWidth}
        />
      )}
      <text
        x={node.x} y={node.y}
        textAnchor="middle" dominantBaseline="central"
        fontSize={node.name.length > 3 ? 10 : 12} fontWeight={700}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill={style.textFill}
      >
        {node.name}
      </text>
    </g>
  );
}

/** Light-mode layered SVG visualization of cave nodes, Bezier passages, and active DFS path. */
export function CaveGraphSvg({
  layout,
  frame,
}: {
  readonly layout: CaveGraphLayout;
  readonly frame: CaveTraceFrame;
}) {
  const activeEdges = buildActiveEdgeKeys(frame.path);
  const visitedNodes = new Set(frame.path);
  const activeHead = frame.path.at(-1) ?? null;
  const revisitedSmall = findRevisitedSmallCave(frame.path);

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="chart-svg"
        role="img"
        aria-label="Cave passage graph"
      >
        {layout.edges.map((edge) => renderEdge(edge, activeEdges))}
        {layout.nodes.map((node) =>
          renderNode(node, node.name === activeHead, visitedNodes.has(node.name), node.name === revisitedSmall),
        )}
      </svg>
      <div className="meta-row" style={{ marginBottom: 0, marginTop: '0.75rem' }}>
        <span className="eyebrow" style={{ marginRight: '0.25rem' }}>Active Path</span>
        <code style={{ fontSize: '0.84rem', color: 'var(--text)' }}>{frame.path.join(' -> ')}</code>
      </div>
    </div>
  );
}
