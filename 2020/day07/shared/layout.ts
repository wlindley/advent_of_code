import { BagLayer } from './policy';
import { BagTraceFrame } from './trace';

export const DEFAULT_VISIBLE_NODES_PER_LAYER = 12;
export const MAX_VISIBLE_NODES_PER_LAYER = 24;
export const MAX_SKIP_ARC_LIFT = 56;
export const SKIP_ARC_STEP = 20;

const PADDING_X = 28;
const PADDING_Y = 68;
const NODE_W = 148;
const NODE_H = 42;
const COL_GAP = 72;
const COL_STRIDE = NODE_W + COL_GAP;
const ROW_GAP = 14;
const ROW_STRIDE = NODE_H + ROW_GAP;

export interface PositionedBagNode {
  readonly color: string;
  readonly weight: bigint;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isOrigin: boolean;
  readonly isActive: boolean;
}

export interface PositionedBagColumn {
  readonly depth: number;
  readonly x: number;
  readonly hiddenCount: number;
  readonly totalCount: number;
  readonly pillY: number;
  readonly isActive: boolean;
}

export interface RoutedBagEdge {
  readonly fromColor: string;
  readonly toColor: string;
  readonly quantity: bigint;
  readonly pathD: string;
  readonly isSkip: boolean;
  readonly isActive: boolean;
}

export interface BagGraphLayout {
  readonly width: number;
  readonly height: number;
  readonly columns: readonly PositionedBagColumn[];
  readonly nodes: readonly PositionedBagNode[];
  readonly edges: readonly RoutedBagEdge[];
}

function positionLayerNodes(
  layer: BagLayer,
  maxVisiblePerLayer: number,
  revealedDepth: number,
  nodeByColor: Map<string, PositionedBagNode>,
): { readonly column: PositionedBagColumn; readonly nodes: readonly PositionedBagNode[]; readonly rowSlots: number } {
  const x = PADDING_X + layer.depth * COL_STRIDE;
  const visible = layer.nodes.slice(0, maxVisiblePerLayer);
  const hiddenCount = layer.nodeCount - visible.length;
  const isActive = layer.depth === revealedDepth;
  const nodes = visible.map((node, row) => {
    const positioned: PositionedBagNode = Object.freeze({
      color: node.color,
      weight: node.weight,
      depth: layer.depth,
      x,
      y: PADDING_Y + row * ROW_STRIDE,
      width: NODE_W,
      height: NODE_H,
      isOrigin: layer.depth === 0,
      isActive,
    });
    nodeByColor.set(node.color, positioned);
    return positioned;
  });
  const column: PositionedBagColumn = Object.freeze({
    depth: layer.depth,
    x,
    hiddenCount,
    totalCount: layer.nodeCount,
    pillY: PADDING_Y + visible.length * ROW_STRIDE,
    isActive,
  });
  return { column, nodes, rowSlots: visible.length + (hiddenCount > 0 ? 1 : 0) };
}

function routeVisibleEdges(
  frame: BagTraceFrame,
  nodeByColor: ReadonlyMap<string, PositionedBagNode>,
): readonly RoutedBagEdge[] {
  const edges: RoutedBagEdge[] = [];
  for (const layer of frame.layers) {
    const isActive = layer.depth === frame.revealedDepth;
    for (const edge of layer.edges) {
      const from = nodeByColor.get(edge.fromColor);
      const to = nodeByColor.get(edge.toColor);
      if (!from || !to) continue;
      const x1 = from.x + from.width;
      const y1 = from.y + from.height / 2;
      const x2 = to.x;
      const y2 = to.y + to.height / 2;
      const dx = (x2 - x1) * 0.45;
      const lift = Math.min(MAX_SKIP_ARC_LIFT, (to.depth - from.depth - 1) * SKIP_ARC_STEP);
      const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1 - lift}, ${x2 - dx} ${y2 - lift}, ${x2} ${y2}`;
      edges.push(Object.freeze({ fromColor: edge.fromColor, toColor: edge.toColor, quantity: edge.quantity, pathD, isSkip: lift > 0, isActive }));
    }
  }
  return Object.freeze(edges);
}

/** Computes a bounded, left-to-right layered SVG layout for a BagTraceFrame. */
export function layoutBagTraceFrame(frame: BagTraceFrame, maxVisiblePerLayer: number): BagGraphLayout {
  if (!Number.isInteger(maxVisiblePerLayer) || maxVisiblePerLayer < 1 || maxVisiblePerLayer > MAX_VISIBLE_NODES_PER_LAYER) {
    throw new RangeError(`maxVisiblePerLayer must be an integer in [1, ${MAX_VISIBLE_NODES_PER_LAYER}], got ${maxVisiblePerLayer}`);
  }
  const nodeByColor = new Map<string, PositionedBagNode>();
  const columns: PositionedBagColumn[] = [];
  const nodes: PositionedBagNode[] = [];
  let maxRowSlots = 1;
  for (const layer of frame.layers) {
    const placed = positionLayerNodes(layer, maxVisiblePerLayer, frame.revealedDepth, nodeByColor);
    columns.push(placed.column);
    nodes.push(...placed.nodes);
    maxRowSlots = Math.max(maxRowSlots, placed.rowSlots);
  }
  const totalColumns = Math.max(1, frame.totalLayers);
  const width = Math.max(420, PADDING_X * 2 + totalColumns * NODE_W + (totalColumns - 1) * COL_GAP);
  const height = Math.max(180, PADDING_Y + maxRowSlots * ROW_STRIDE + 24);
  return Object.freeze({ width, height, columns: Object.freeze(columns), nodes: Object.freeze(nodes), edges: routeVisibleEdges(frame, nodeByColor) });
}
