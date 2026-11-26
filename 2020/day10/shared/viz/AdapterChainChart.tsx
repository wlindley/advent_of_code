import type { AdapterTraceFrame, ChainEdgeArc, ChainNodeSlot, ChainViewport, JoltDelta } from '../index';

export interface AdapterChainChartProps {
  readonly viewport: ChainViewport;
  readonly frame: AdapterTraceFrame;
}

const CHART_W = 720;
const CHART_H = 224;
const PAD_X = 22;
const TOP_Y = 34;
const STAIR_H = 148;
const BASE_Y = TOP_Y + STAIR_H;

function deltaColor(delta: JoltDelta): string {
  if (delta === 1) return 'var(--accent)';
  if (delta === 2) return 'var(--gold)';
  return 'var(--ok)';
}

function slotX(slot: number, slotW: number): number {
  return PAD_X + slot * slotW + slotW / 2;
}

function nodeY(joltage: number, minJ: number, spanJ: number): number {
  return BASE_Y - ((joltage - minJ) / Math.max(1, spanJ)) * STAIR_H;
}

function nodeColor(nodeIndex: number, kind: string, activeIndex: number): string {
  if (nodeIndex === activeIndex) return 'var(--accent)';
  if (kind === 'device') return 'var(--ok)';
  if (kind === 'outlet' || nodeIndex < activeIndex) return 'var(--text)';
  return 'var(--muted)';
}

interface CoordCtx {
  readonly viewport: ChainViewport;
  readonly slotW: number;
  readonly minJ: number;
  readonly spanJ: number;
}

function slotCoords(ctx: CoordCtx, nodeIndex: number): readonly [number, number] | null {
  const slot = ctx.viewport.slotOf(nodeIndex);
  if (slot === null) return null;
  const node = ctx.viewport.nodes[slot]!;
  return [slotX(slot, ctx.slotW), nodeY(node.joltage, ctx.minJ, ctx.spanJ)];
}

function renderDiffEdge(ctx: CoordCtx, edge: ChainEdgeArc, activeIndex: number) {
  const p1 = slotCoords(ctx, edge.fromIndex);
  const p2 = slotCoords(ctx, edge.toIndex);
  if (!p1 || !p2) return null;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const isActive = edge.toIndex === activeIndex;
  const color = deltaColor(edge.delta);
  return (
    <g key={`e-${edge.fromIndex}-${edge.toIndex}`}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={isActive ? 4 : 2.5} strokeOpacity={edge.toIndex <= activeIndex ? 1 : 0.25} strokeLinecap="round" />
      {isActive && <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 8} textAnchor="middle" fill={color} fontSize={11} fontWeight={700}>{`+${edge.delta}J`}</text>}
    </g>
  );
}

function renderWaysBar(node: ChainNodeSlot, slot: number, slotW: number, barW: number, activeIndex: number) {
  if (node.ways === null) return null;
  const h = Math.max(4, node.normalizedWaysHeight * (STAIR_H * 0.65));
  const x = PAD_X + slot * slotW + (slotW - barW) / 2;
  const fill = node.nodeIndex === activeIndex ? 'color-mix(in srgb, var(--accent) 32%, var(--surface))' : 'color-mix(in srgb, var(--gold) 24%, var(--surface))';
  return <rect key={`bar-${node.nodeIndex}`} x={x} y={BASE_Y - h} width={barW} height={h} rx={2} fill={fill} stroke="var(--border)" />;
}

function renderArrArc(ctx: CoordCtx, edge: ChainEdgeArc) {
  const p1 = slotCoords(ctx, edge.fromIndex);
  const p2 = slotCoords(ctx, edge.toIndex);
  if (!p1 || !p2) return null;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const ctrlY = Math.min(y1, y2) - 18 - edge.delta * 6;
  return <path key={`arc-${edge.fromIndex}-${edge.toIndex}`} d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${ctrlY} ${x2} ${y2}`} fill="none" stroke={deltaColor(edge.delta)} strokeWidth={2.2} />;
}

function renderArrangementLayer(ctx: CoordCtx, barW: number, activeIndex: number) {
  const { viewport, slotW, minJ, spanJ } = ctx;
  return (
    <g>
      {viewport.nodes.map((n, slot) => renderWaysBar(n, slot, slotW, barW, activeIndex))}
      {viewport.nodes.slice(1).map((n, idx) => (
        <line key={`b-${n.nodeIndex}`} x1={slotX(idx, slotW)} y1={nodeY(viewport.nodes[idx]!.joltage, minJ, spanJ)} x2={slotX(idx + 1, slotW)} y2={nodeY(n.joltage, minJ, spanJ)} stroke="var(--border)" strokeWidth={1.5} />
      ))}
      {viewport.edges.map((edge) => renderArrArc(ctx, edge))}
    </g>
  );
}

/** Light-mode SVG staircase showing jolt deltas and Part 2 log2 arrangement bars & jump arcs. */
export function AdapterChainChart({ viewport, frame }: AdapterChainChartProps) {
  const slotW = (CHART_W - 2 * PAD_X) / Math.max(1, viewport.nodeCount);
  const barW = Math.max(4, slotW * 0.56);
  const minJ = viewport.nodes[0]!.joltage;
  const maxJ = viewport.nodes[viewport.nodeCount - 1]!.joltage;
  const spanJ = Math.max(1, maxJ - minJ);
  const ctx: CoordCtx = { viewport, slotW, minJ, spanJ };

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg" role="img" aria-label="Adapter chain staircase visualization">
      <line x1={PAD_X} y1={BASE_Y} x2={CHART_W - PAD_X} y2={BASE_Y} stroke="var(--border)" strokeWidth={1} />
      {frame.phase === 'differences'
        ? <g>{viewport.edges.map((e) => renderDiffEdge(ctx, e, frame.activeIndex))}</g>
        : renderArrangementLayer(ctx, barW, frame.activeIndex)}
      {viewport.nodes.map((n, slot) => {
        const title = n.ways === null ? `#${n.nodeIndex}: ${n.joltage}J (${n.kind})` : `#${n.nodeIndex}: ${n.joltage}J (${n.kind}) - ${n.ways.toString()} ways`;
        return (
          <circle key={n.nodeIndex} cx={slotX(slot, slotW)} cy={nodeY(n.joltage, minJ, spanJ)} r={n.nodeIndex === frame.activeIndex ? 5.5 : 3.5} fill={nodeColor(n.nodeIndex, n.kind, frame.activeIndex)} stroke="var(--surface)" strokeWidth={1.5}>
            <title>{title}</title>
          </circle>
        );
      })}
      <text x={PAD_X} y={CHART_H - 12} className="chart-axis-text">{`${viewport.hasLeftOverflow ? '… ' : ''}#${viewport.startIndex} (${minJ}J)`}</text>
      <text x={CHART_W - PAD_X} y={CHART_H - 12} textAnchor="end" className="chart-axis-text">{`#${viewport.endIndex - 1} (${maxJ}J)${viewport.hasRightOverflow ? ' …' : ''}`}</text>
    </svg>
  );
}
