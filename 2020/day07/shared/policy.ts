import { BagRuleGraph } from './graph';
import { validateBagColor } from './rule';

export type BagQueryPolicyId = 'ancestor-colors' | 'nested-bag-count';

/** Immutable layer node carrying a bag color and its contribution weight. */
export class BagLayerNode {
  readonly color: string;
  readonly weight: bigint;

  constructor(color: string, weight: bigint) {
    this.color = validateBagColor(color);
    if (weight < 1n) {
      throw new RangeError(`BagLayerNode weight must be >= 1n, got ${weight}`);
    }
    this.weight = weight;
    Object.freeze(this);
  }
}

/** Immutable directed containment edge displayed between two layers. */
export class BagLayerEdge {
  readonly fromColor: string;
  readonly toColor: string;
  readonly quantity: bigint;

  constructor(fromColor: string, toColor: string, quantity: bigint) {
    this.fromColor = validateBagColor(fromColor);
    this.toColor = validateBagColor(toColor);
    if (quantity < 1n) {
      throw new RangeError(`BagLayerEdge quantity must be >= 1n, got ${quantity}`);
    }
    this.quantity = quantity;
    Object.freeze(this);
  }
}

function compareLayerNodes(a: BagLayerNode, b: BagLayerNode): number {
  if (a.weight !== b.weight) return a.weight > b.weight ? -1 : 1;
  return a.color.localeCompare(b.color);
}

/** Immutable BFS/longest-path layer with derived weight and node counts. */
export class BagLayer {
  readonly depth: number;
  readonly nodes: readonly BagLayerNode[];
  readonly edges: readonly BagLayerEdge[];

  constructor(depth: number, nodes: readonly BagLayerNode[], edges: readonly BagLayerEdge[]) {
    if (!Number.isInteger(depth) || depth < 0) {
      throw new RangeError(`BagLayer depth must be a non-negative integer, got ${depth}`);
    }
    this.depth = depth;
    this.nodes = Object.freeze([...nodes].sort(compareLayerNodes));
    this.edges = Object.freeze([...edges]);
    Object.freeze(this);
  }

  get totalWeight(): bigint {
    let total = 0n;
    for (const node of this.nodes) total += node.weight;
    return total;
  }

  get nodeCount(): number {
    return this.nodes.length;
  }
}

export interface BagQueryPolicy {
  readonly id: BagQueryPolicyId;
  readonly label: string;
  readonly description: string;
  readonly edgeVerb: string;
  readonly metricLabel: string;
  buildLayers(graph: BagRuleGraph, targetColor: string): readonly BagLayer[];
  evaluate(graph: BagRuleGraph, targetColor: string): bigint;
}

/** Template Method base class summing non-origin layer weights. */
export abstract class LayeredBagQueryPolicy implements BagQueryPolicy {
  abstract readonly id: BagQueryPolicyId;
  abstract readonly label: string;
  abstract readonly description: string;
  abstract readonly edgeVerb: string;
  abstract readonly metricLabel: string;

  abstract buildLayers(graph: BagRuleGraph, targetColor: string): readonly BagLayer[];

  evaluate(graph: BagRuleGraph, targetColor: string): bigint {
    const layers = this.buildLayers(graph, targetColor);
    let total = 0n;
    for (let i = 1; i < layers.length; i += 1) {
      total += layers[i]!.totalWeight;
    }
    return total;
  }
}

function buildAncestorLayers(
  rev: ReadonlyMap<string, readonly string[]>,
  targetColor: string,
): readonly BagLayer[] {
  const depth = new Map<string, number>([[targetColor, 0]]);
  const layersNodes: BagLayerNode[][] = [[new BagLayerNode(targetColor, 1n)]];
  const layersEdges: BagLayerEdge[][] = [[]];
  const queue: string[] = [targetColor];
  for (let head = 0; head < queue.length; head += 1) {
    const u = queue[head]!;
    const d = depth.get(u)!;
    for (const parent of rev.get(u)!) {
      if (!depth.has(parent)) {
        const nextDepth = d + 1;
        depth.set(parent, nextDepth);
        queue.push(parent);
        if (nextDepth === layersNodes.length) {
          layersNodes.push([]);
          layersEdges.push([]);
        }
        layersNodes[nextDepth]!.push(new BagLayerNode(parent, 1n));
      }
      if (depth.get(parent)! === d + 1) {
        layersEdges[d + 1]!.push(new BagLayerEdge(u, parent, 1n));
      }
    }
  }
  return Object.freeze(layersNodes.map((nodes, d) => new BagLayer(d, nodes, layersEdges[d]!)));
}

/** Part 1 policy: reverse-BFS counting all distinct outer ancestor bag colors. */
export class AncestorColorsPolicy extends LayeredBagQueryPolicy {
  readonly id = 'ancestor-colors' as const;
  readonly label = 'Ancestor Colors';
  readonly description = 'Reverse-BFS across containment edges from the target bag outward.';
  readonly edgeVerb = 'fits inside';
  readonly metricLabel = 'Outer bag colors';

  buildLayers(graph: BagRuleGraph, targetColor: string): readonly BagLayer[] {
    validateBagColor(targetColor);
    const rev = graph.reverseAdjacency();
    if (!rev.has(targetColor)) return Object.freeze([]);
    return buildAncestorLayers(rev, targetColor);
  }
}

function buildNestedLayers(graph: BagRuleGraph, targetColor: string): readonly BagLayer[] {
  const order = graph.reachableDirectedGraph(targetColor).topologicalOrder();
  const copies = new Map<string, bigint>(order.map((color) => [color, 0n]));
  const rank = new Map<string, number>(order.map((color) => [color, 0]));
  copies.set(targetColor, 1n);
  for (const u of order) {
    const uCopies = copies.get(u)!;
    const nextRank = rank.get(u)! + 1;
    for (const item of graph.ruleFor(u).contents) {
      copies.set(item.color, copies.get(item.color)! + uCopies * item.quantity);
      if (nextRank > rank.get(item.color)!) rank.set(item.color, nextRank);
    }
  }
  const depthCount = Math.max(...rank.values()) + 1;
  const layersNodes = Array.from({ length: depthCount }, () => [] as BagLayerNode[]);
  const layersEdges = Array.from({ length: depthCount }, () => [] as BagLayerEdge[]);
  for (const color of order) {
    layersNodes[rank.get(color)!]!.push(new BagLayerNode(color, copies.get(color)!));
    for (const item of graph.ruleFor(color).contents) {
      layersEdges[rank.get(item.color)!]!.push(new BagLayerEdge(color, item.color, item.quantity));
    }
  }
  return Object.freeze(layersNodes.map((nodes, d) => new BagLayer(d, nodes, layersEdges[d]!)));
}

/** Part 2 policy: topological longest-path layering and forward BigInt multiplicity DP. */
export class NestedBagCountPolicy extends LayeredBagQueryPolicy {
  readonly id = 'nested-bag-count' as const;
  readonly label = 'Nested Bag Count';
  readonly description = 'Topological DP summing total nested bags required inside the target bag.';
  readonly edgeVerb = 'contains';
  readonly metricLabel = 'Nested bags required';

  buildLayers(graph: BagRuleGraph, targetColor: string): readonly BagLayer[] {
    validateBagColor(targetColor);
    if (!graph.reverseAdjacency().has(targetColor)) return Object.freeze([]);
    return buildNestedLayers(graph, targetColor);
  }
}

export const ANCESTOR_COLORS_POLICY = new AncestorColorsPolicy();
export const NESTED_BAG_COUNT_POLICY = new NestedBagCountPolicy();
