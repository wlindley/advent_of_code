import type { CircuitBlueprint } from './blueprint';
import { BROADCASTER_NAME, type ModuleKind } from './types';

export interface LayoutNode {
  readonly name: string;
  readonly kind: ModuleKind;
  readonly layer: number;
  readonly x: number;
  readonly y: number;
}

export interface LayoutEdge {
  readonly from: string;
  readonly to: string;
  readonly isBackEdge: boolean;
  readonly isSelfLoop: boolean;
}

export interface CircuitLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly LayoutNode[];
  readonly nodeByName: ReadonlyMap<string, LayoutNode>;
  readonly edges: readonly LayoutEdge[];
}

const LAYER_X_STEP = 156;
const NODE_Y_STEP = 76;
const PAD_X = 82;
const PAD_Y = 58;

function assignLayers(blueprint: CircuitBlueprint): { layers: Map<string, number>; maxLayer: number } {
  const layers = new Map<string, number>([[BROADCASTER_NAME, 0]]);
  const queue = [BROADCASTER_NAME];
  let maxBfsLayer = 0;

  for (let head = 0; head < queue.length; head += 1) {
    const name = queue[head]!;
    const nextLayer = layers.get(name)! + 1;
    for (const dest of blueprint.outputsOf(name)) {
      if (!layers.has(dest)) {
        layers.set(dest, nextLayer);
        if (nextLayer > maxBfsLayer) maxBfsLayer = nextLayer;
        queue.push(dest);
      }
    }
  }

  let maxLayer = maxBfsLayer;
  for (const name of blueprint.nodeOrder) {
    if (!layers.has(name)) {
      maxLayer = maxBfsLayer + 1;
      layers.set(name, maxLayer);
    }
  }
  return { layers, maxLayer };
}

function buildNodes(
  blueprint: CircuitBlueprint,
  buckets: readonly (readonly string[])[],
  height: number,
): { nodes: readonly LayoutNode[]; nodeByName: ReadonlyMap<string, LayoutNode> } {
  const nodes: LayoutNode[] = [];
  const nodeByName = new Map<string, LayoutNode>();

  for (let layer = 0; layer < buckets.length; layer += 1) {
    const col = buckets[layer]!;
    const topY = (height - (col.length - 1) * NODE_Y_STEP) / 2;
    for (let row = 0; row < col.length; row += 1) {
      const name = col[row]!;
      const node: LayoutNode = Object.freeze({
        name,
        kind: blueprint.specOf(name).kind,
        layer,
        x: PAD_X + layer * LAYER_X_STEP,
        y: topY + row * NODE_Y_STEP,
      });
      nodes.push(node);
      nodeByName.set(name, node);
    }
  }
  return { nodes: Object.freeze(nodes), nodeByName };
}

function buildEdges(
  blueprint: CircuitBlueprint,
  nodeByName: ReadonlyMap<string, LayoutNode>,
): readonly LayoutEdge[] {
  const edges: LayoutEdge[] = [];
  for (const spec of blueprint.moduleSpecs) {
    const fromNode = nodeByName.get(spec.name)!;
    for (const dest of spec.destinations) {
      const toNode = nodeByName.get(dest)!;
      const isSelfLoop = spec.name === dest;
      const isBackEdge = !isSelfLoop && toNode.layer <= fromNode.layer;
      edges.push(Object.freeze({ from: spec.name, to: dest, isBackEdge, isSelfLoop }));
    }
  }
  return Object.freeze(edges);
}

/** Computes a layered left-to-right BFS graph layout for SVG circuit visualization. */
export function computeCircuitLayout(blueprint: CircuitBlueprint): CircuitLayout {
  const { layers, maxLayer } = assignLayers(blueprint);
  const buckets = Array.from({ length: maxLayer + 1 }, (): string[] => []);
  for (const name of blueprint.nodeOrder) {
    buckets[layers.get(name)!]!.push(name);
  }
  const maxRows = Math.max(...buckets.map((col) => col.length));
  const width = PAD_X * 2 + maxLayer * LAYER_X_STEP;
  const height = PAD_Y * 2 + (maxRows - 1) * NODE_Y_STEP;
  const { nodes, nodeByName } = buildNodes(blueprint, buckets, height);
  const edges = buildEdges(blueprint, nodeByName);
  return Object.freeze({ width, height, nodes, nodeByName, edges });
}
