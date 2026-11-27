import { useMemo } from 'react';
import { type ExprNode, LiteralExpr } from '../index';

export interface AstTreeSvgProps {
  readonly root: ExprNode;
  readonly activeNodeId: string;
  readonly nodeValues: Readonly<Record<string, bigint>>;
}

interface PositionedNode {
  readonly node: ExprNode;
  readonly x: number;
  readonly y: number;
}

interface TreeEdge {
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  readonly childId: string;
}

interface TreeLayout {
  readonly nodes: readonly PositionedNode[];
  readonly edges: readonly TreeEdge[];
  readonly width: number;
  readonly height: number;
}

const X_STEP = 78;
const Y_STEP = 68;
const PAD_X = 52;
const PAD_Y = 36;

function formatCompactBigInt(value: bigint): string {
  const text = String(value);
  if (text.length <= 10) return text;
  return `${text.slice(0, 4)}…${text.slice(-3)}`;
}

function layoutSubtree(
  node: ExprNode,
  depth: number,
  leafCounter: { value: number },
  nodes: PositionedNode[],
  edges: TreeEdge[],
): { x: number; y: number } {
  const y = PAD_Y + depth * Y_STEP;
  let x = 0;
  if (node.children.length === 0) {
    x = PAD_X + leafCounter.value * X_STEP;
    leafCounter.value += 1;
  } else {
    const childCoords = node.children.map((child) => layoutSubtree(child, depth + 1, leafCounter, nodes, edges));
    x = (childCoords[0]!.x + childCoords[childCoords.length - 1]!.x) / 2;
    for (let i = 0; i < node.children.length; i += 1) {
      const pos = childCoords[i]!;
      edges.push({ fromX: x, fromY: y, toX: pos.x, toY: pos.y, childId: node.children[i]!.id });
    }
  }
  nodes.push({ node, x, y });
  return { x, y };
}

function buildTreeLayout(root: ExprNode): TreeLayout {
  const nodes: PositionedNode[] = [];
  const edges: TreeEdge[] = [];
  layoutSubtree(root, 0, { value: 0 }, nodes, edges);
  let maxX = PAD_X;
  let maxY = PAD_Y;
  for (const item of nodes) {
    if (item.x > maxX) maxX = item.x;
    if (item.y > maxY) maxY = item.y;
  }
  return { nodes, edges, width: Math.max(340, maxX + PAD_X), height: Math.max(170, maxY + PAD_Y + 22) };
}

function EvaluatedValuePill({ value, stroke, textColor }: { readonly value: bigint; readonly stroke: string; readonly textColor: string }) {
  return (
    <g transform="translate(0, 25)">
      <rect x={-32} y={-9} width={64} height={18} rx={9} fill="var(--surface)" stroke={stroke} strokeWidth={1.2} />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={10}
        fontWeight={700}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {`= ${formatCompactBigInt(value)}`}
      </text>
    </g>
  );
}

function AstNodeGlyph({ item, isActive, evaluatedValue }: { readonly item: PositionedNode; readonly isActive: boolean; readonly evaluatedValue: bigint | undefined }) {
  const { node, x, y } = item;
  const isLiteral = node instanceof LiteralExpr;
  const stroke = isActive ? 'var(--accent)' : evaluatedValue !== undefined ? 'var(--ok)' : 'var(--border)';
  const fill = isActive || evaluatedValue !== undefined ? 'var(--surface)' : 'var(--bg)';
  const mainLabel = isLiteral ? formatCompactBigInt(node.value) : node.label;
  const fullTitle = evaluatedValue !== undefined ? `${node.format()} = ${evaluatedValue}` : node.format();

  return (
    <g transform={`translate(${x}, ${y})`}>
      <title>{fullTitle}</title>
      <rect
        x={-28} y={-16} width={56} height={32} rx={isLiteral ? 8 : 16}
        fill={fill} stroke={stroke} strokeWidth={isActive ? 2.5 : 1.5}
        strokeDasharray={node.nodeKind === 'group' ? '4 2' : undefined}
      />
      <text textAnchor="middle" dominantBaseline="central" fill={isActive ? 'var(--accent)' : 'var(--text)'} fontSize={12} fontWeight={700} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
        {mainLabel}
      </text>
      {!isLiteral && evaluatedValue !== undefined && (
        <EvaluatedValuePill value={evaluatedValue} stroke={stroke} textColor={isActive ? 'var(--accent)' : 'var(--ok)'} />
      )}
    </g>
  );
}

function AstEdgeLines({ edges, activeNodeId, nodeValues }: { readonly edges: readonly TreeEdge[]; readonly activeNodeId: string; readonly nodeValues: Readonly<Record<string, bigint>> }) {
  return (
    <>
      {edges.map((edge) => {
        const activeEdge = edge.childId === activeNodeId;
        const stroke = activeEdge ? 'var(--accent)' : nodeValues[edge.childId] !== undefined ? 'var(--ok)' : 'var(--border)';
        return (
          <line
            key={`${edge.fromX}:${edge.fromY}-${edge.childId}`}
            x1={edge.fromX} y1={edge.fromY + 16} x2={edge.toX} y2={edge.toY - 16}
            stroke={stroke} strokeWidth={activeEdge ? 2.2 : 1.5}
          />
        );
      })}
    </>
  );
}

/** Scrollable light-mode SVG expression AST visualization with leaf-midpoint node layout. */
export function AstTreeSvg({ root, activeNodeId, nodeValues }: AstTreeSvgProps) {
  const layout = useMemo(() => buildTreeLayout(root), [root]);

  return (
    <div style={{ maxHeight: 460, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', padding: '0.5rem' }}>
      <svg
        width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img" aria-label={`AST evaluation tree for ${root.format()}`}
        style={{ display: 'block', margin: '0 auto', background: 'var(--surface)', borderRadius: 6 }}
      >
        <AstEdgeLines edges={layout.edges} activeNodeId={activeNodeId} nodeValues={nodeValues} />
        {layout.nodes.map((item) => (
          <AstNodeGlyph key={item.node.id} item={item} isActive={item.node.id === activeNodeId} evaluatedValue={nodeValues[item.node.id]} />
        ))}
      </svg>
    </div>
  );
}
