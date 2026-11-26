import type { SearchNode } from '../search';

export interface PositionedTreeNode {
  readonly node: SearchNode;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

export interface TreeEdge {
  readonly fromId: number;
  readonly toId: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly node: SearchNode;
}

export interface TreeLayout {
  readonly nodes: readonly PositionedTreeNode[];
  readonly edges: readonly TreeEdge[];
  readonly levelY: readonly number[];
  readonly width: number;
  readonly height: number;
  readonly maxDepth: number;
}

const GUTTER_LEFT = 148;
const RIGHT_PAD = 76;
const TOP_PAD = 42;
const BOTTOM_PAD = 44;
const SLOT_WIDTH = 136;
const LEVEL_HEIGHT = 76;

interface LayoutCursor {
  nextLeaf: number;
  maxDepth: number;
}

interface SlotDepth {
  readonly slot: number;
  readonly depth: number;
}

function buildChildrenMap(nodes: readonly SearchNode[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const node of nodes) {
    if (node.parentId === null) continue;
    const list = map.get(node.parentId);
    if (list) list.push(node.id);
    else map.set(node.parentId, [node.id]);
  }
  return map;
}

function assignSlots(
  id: number,
  depth: number,
  childrenMap: ReadonlyMap<number, readonly number[]>,
  cursor: LayoutCursor,
  slots: Map<number, SlotDepth>,
): number {
  if (depth > cursor.maxDepth) cursor.maxDepth = depth;
  const children = childrenMap.get(id);
  if (!children) {
    const slot = cursor.nextLeaf;
    cursor.nextLeaf += 1;
    slots.set(id, { slot, depth });
    return slot;
  }
  let first = 0;
  let last = 0;
  for (let i = 0; i < children.length; i += 1) {
    const childSlot = assignSlots(children[i]!, depth + 1, childrenMap, cursor, slots);
    if (i === 0) first = childSlot;
    last = childSlot;
  }
  const slot = (first + last) / 2;
  slots.set(id, { slot, depth });
  return slot;
}

function buildPositioned(
  nodes: readonly SearchNode[],
  slots: ReadonlyMap<number, SlotDepth>,
): { positioned: PositionedTreeNode[]; edges: TreeEdge[] } {
  const byId = new Map<number, PositionedTreeNode>();
  const positioned: PositionedTreeNode[] = [];
  for (const node of nodes) {
    const { slot, depth } = slots.get(node.id)!;
    const entry = Object.freeze({
      node,
      x: GUTTER_LEFT + slot * SLOT_WIDTH,
      y: TOP_PAD + depth * LEVEL_HEIGHT,
      depth,
    });
    positioned.push(entry);
    byId.set(node.id, entry);
  }
  const edges: TreeEdge[] = [];
  for (const child of positioned) {
    if (child.node.parentId === null) continue;
    const parent = byId.get(child.node.parentId)!;
    edges.push(Object.freeze({
      fromId: parent.node.id,
      toId: child.node.id,
      x1: parent.x,
      y1: parent.y,
      x2: child.x,
      y2: child.y,
      node: child.node,
    }));
  }
  return { positioned, edges };
}

/** Computes a collision-free top-down tidy tree layout for a reverse-DFS trace. */
export function computeTreeLayout(nodes: readonly SearchNode[]): TreeLayout {
  if (nodes.length === 0) {
    return Object.freeze({ nodes: Object.freeze([]), edges: Object.freeze([]), levelY: Object.freeze([]), width: 0, height: 0, maxDepth: 0 });
  }
  const childrenMap = buildChildrenMap(nodes);
  const slots = new Map<number, SlotDepth>();
  const cursor: LayoutCursor = { nextLeaf: 0, maxDepth: 0 };
  assignSlots(nodes[0]!.id, 0, childrenMap, cursor, slots);
  const { positioned, edges } = buildPositioned(nodes, slots);
  const levelY = Array.from({ length: cursor.maxDepth + 1 }, (_, d) => TOP_PAD + d * LEVEL_HEIGHT);
  const width = GUTTER_LEFT + Math.max(1, cursor.nextLeaf - 1) * SLOT_WIDTH + RIGHT_PAD;
  const height = TOP_PAD + cursor.maxDepth * LEVEL_HEIGHT + BOTTOM_PAD;
  return Object.freeze({
    nodes: Object.freeze(positioned),
    edges: Object.freeze(edges),
    levelY: Object.freeze(levelY),
    width,
    height,
    maxDepth: cursor.maxDepth,
  });
}
