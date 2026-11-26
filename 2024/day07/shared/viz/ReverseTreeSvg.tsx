import { useMemo } from 'react';
import type { EquationTrace, SearchNode } from '../search';
import { computeTreeLayout, type PositionedTreeNode, type TreeEdge } from './treeLayout';

function formatCompact(value: bigint): string {
  const s = value.toString();
  return s.length > 14 ? `${s.slice(0, 6)}..${s.slice(-5)}` : s;
}

function nodeColors(status: SearchNode['status']): { stroke: string; fill: string; text: string } {
  if (status === 'winning') return { stroke: 'var(--ok)', fill: 'var(--surface)', text: 'var(--ok)' };
  if (status === 'pruned') return { stroke: 'var(--err)', fill: 'var(--surface)', text: 'var(--err)' };
  return { stroke: 'var(--muted)', fill: 'var(--bg)', text: 'var(--muted)' };
}

function LevelGutter({ trace, levelY, width }: {
  readonly trace: EquationTrace;
  readonly levelY: readonly number[];
  readonly width: number;
}) {
  const ops = trace.equation.operands;
  return (
    <g>
      {levelY.map((y, depth) => {
        const idx = ops.length - 1 - depth;
        const label = depth === 0 ? 'Target' : idx === 0 ? `Base = ${formatCompact(ops[0]!)}` : `÷/- ${formatCompact(ops[idx + 1]!)}`;
        return (
          <g key={depth}>
            <line x1={8} y1={y} x2={width - 12} y2={y} stroke="var(--border)" strokeDasharray="2 4" opacity={0.65} />
            <text x={12} y={y + 4} fontSize={11} fontWeight={600} fill="var(--muted)" fontFamily="ui-monospace, monospace">
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function TreeEdgeShape({ edge }: { readonly edge: TreeEdge }) {
  const { stroke } = nodeColors(edge.node.status);
  const isPruned = edge.node.kind === 'pruned';
  const midX = (edge.x1 + edge.x2) / 2;
  const midY = (edge.y1 + edge.y2) / 2;
  const symbol = edge.node.operator?.symbol ?? '';
  return (
    <g>
      <line
        x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
        stroke={stroke} strokeWidth={edge.node.status === 'winning' ? 2.6 : 1.5}
        strokeDasharray={isPruned ? '4 4' : undefined}
      />
      <rect x={midX - 10} y={midY - 9} width={20} height={18} rx={4} fill="var(--surface)" stroke={stroke} strokeWidth={1} />
      <text x={midX} y={midY + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={stroke} fontFamily="ui-monospace, monospace">
        {symbol}
      </text>
    </g>
  );
}

function TreeNodeShape({ item }: { readonly item: PositionedTreeNode }) {
  const { node, x, y } = item;
  const colors = nodeColors(node.status);
  if (node.kind === 'pruned') {
    return (
      <g>
        <title>{node.pruneReason}</title>
        <rect x={x - 54} y={y - 14} width={108} height={28} rx={6} fill={colors.fill} stroke={colors.stroke} strokeDasharray="3 3" strokeWidth={1.4} />
        <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill={colors.text} fontFamily="ui-monospace, monospace">
          {node.pruneReason.length > 16 ? `${node.pruneReason.slice(0, 15)}…` : node.pruneReason}
        </text>
      </g>
    );
  }
  const label = formatCompact(node.remaining);
  return (
    <g>
      <title>{`Remaining: ${node.remaining.toString()}`}</title>
      <rect x={x - 48} y={y - 15} width={96} height={30} rx={15} fill={colors.fill} stroke={colors.stroke} strokeWidth={node.status === 'winning' ? 2.4 : 1.4} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={colors.text} fontFamily="ui-monospace, monospace">
        {label}
      </text>
    </g>
  );
}

export function ReverseTreeSvg({ trace }: { readonly trace: EquationTrace }) {
  const layout = useMemo(() => computeTreeLayout(trace.nodes), [trace.nodes]);
  const totalExplored = trace.visitedCount + trace.prunedCount;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.5rem', overflowX: 'auto' }}>
      {trace.truncated && (
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.78rem', color: 'var(--warn)', fontWeight: 600 }}>
          Showing {trace.nodes.length} of {totalExplored} search nodes (tree display capped for responsiveness).
        </p>
      )}
      <svg
        width={Math.max(360, layout.width)}
        height={Math.max(110, layout.height)}
        role="img"
        aria-label={`Reverse pruning tree for target ${trace.equation.target}`}
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      >
        <LevelGutter trace={trace} levelY={layout.levelY} width={Math.max(360, layout.width)} />
        {layout.edges.map((edge) => <TreeEdgeShape key={`${edge.fromId}-${edge.toId}`} edge={edge} />)}
        {layout.nodes.map((item) => <TreeNodeShape key={item.node.id} item={item} />)}
      </svg>
    </div>
  );
}
