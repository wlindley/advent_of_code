import { bigintLog2 } from '../../../shared/core';
import { FUEL_CHEMICAL, ORE_CHEMICAL, type ReactionNetwork } from './models';

const NODE_WIDTH = 112;
const NODE_HEIGHT = 44;
const GAP_X = 18;
const GAP_Y = 40;
const PADDING = 20;

const COMPACT_UNITS: ReadonlyArray<readonly [bigint, string]> = [
  [1_000_000_000_000_000n, 'Q'],
  [1_000_000_000_000n, 'T'],
  [1_000_000_000n, 'B'],
  [1_000_000n, 'M'],
  [1_000n, 'K'],
];

/** Positioned node inside a layered reaction DAG layout. */
export interface DagNodeLayout {
  readonly chemical: string;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Directed dependency edge between reaction output and input nodes. */
export interface DagEdgeLayout {
  readonly from: string;
  readonly to: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** Immutable layered SVG geometry for a ReactionNetwork's active demand DAG. */
export class DagLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly DagNodeLayout[];
  readonly edges: readonly DagEdgeLayout[];
  readonly nodeByChemical: ReadonlyMap<string, DagNodeLayout>;

  constructor(
    width: number,
    height: number,
    nodes: readonly DagNodeLayout[],
    edges: readonly DagEdgeLayout[],
    nodeByChemical: ReadonlyMap<string, DagNodeLayout>,
  ) {
    this.width = width;
    this.height = height;
    this.nodes = Object.freeze([...nodes]);
    this.edges = Object.freeze([...edges]);
    this.nodeByChemical = nodeByChemical;
    Object.freeze(this);
  }

  get viewBox(): string {
    return `0 0 ${this.width} ${this.height}`;
  }
}

function groupByLongestDepth(network: ReactionNetwork): Map<number, string[]> {
  const depth = new Map<string, number>([
    [FUEL_CHEMICAL, 0],
    [ORE_CHEMICAL, 0],
  ]);
  for (const rxn of network.orderedReactions) {
    depth.set(rxn.output.chemical, 0);
  }
  for (const rxn of network.orderedReactions) {
    const parentDepth = depth.get(rxn.output.chemical)!;
    for (const input of rxn.inputs) {
      if (parentDepth + 1 > depth.get(input.chemical)!) {
        depth.set(input.chemical, parentDepth + 1);
      }
    }
  }
  const layers = new Map<number, string[]>();
  for (const [chem, d] of depth) {
    const bucket = layers.get(d);
    if (bucket) bucket.push(chem);
    else layers.set(d, [chem]);
  }
  return layers;
}

function buildDagNodes(layers: Map<number, string[]>): {
  width: number;
  height: number;
  nodes: DagNodeLayout[];
  nodeByChemical: Map<string, DagNodeLayout>;
} {
  const depthCount = layers.size;
  let maxLayerSize = 1;
  for (const bucket of layers.values()) {
    bucket.sort();
    if (bucket.length > maxLayerSize) maxLayerSize = bucket.length;
  }
  const width = PADDING * 2 + maxLayerSize * NODE_WIDTH + (maxLayerSize - 1) * GAP_X;
  const height = PADDING * 2 + depthCount * NODE_HEIGHT + (depthCount - 1) * GAP_Y;
  const nodes: DagNodeLayout[] = [];
  const nodeByChemical = new Map<string, DagNodeLayout>();
  for (let d = 0; d < depthCount; d++) {
    const chems = layers.get(d)!;
    const rowWidth = chems.length * NODE_WIDTH + (chems.length - 1) * GAP_X;
    const startX = (width - rowWidth) / 2;
    const y = PADDING + d * (NODE_HEIGHT + GAP_Y);
    for (let i = 0; i < chems.length; i++) {
      const chem = chems[i]!;
      const node = Object.freeze({
        chemical: chem,
        depth: d,
        x: startX + i * (NODE_WIDTH + GAP_X),
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
      nodes.push(node);
      nodeByChemical.set(chem, node);
    }
  }
  return { width, height, nodes, nodeByChemical };
}

/** Computes a deterministic top-down layered layout for a ReactionNetwork. */
export function computeDagLayout(network: ReactionNetwork): DagLayout {
  const layers = groupByLongestDepth(network);
  const { width, height, nodes, nodeByChemical } = buildDagNodes(layers);
  const edges: DagEdgeLayout[] = [];
  for (const rxn of network.orderedReactions) {
    const from = nodeByChemical.get(rxn.output.chemical)!;
    for (const input of rxn.inputs) {
      const to = nodeByChemical.get(input.chemical)!;
      edges.push(
        Object.freeze({
          from: from.chemical,
          to: to.chemical,
          x1: from.x + from.width / 2,
          y1: from.y + from.height,
          x2: to.x + to.width / 2,
          y2: to.y,
        }),
      );
    }
  }
  return new DagLayout(width, height, nodes, edges, nodeByChemical);
}

/** Maps a BigInt value onto `[0, 1]` on a log2 scale relative to `maxValue`. */
export function computeLogScalePosition(value: bigint, maxValue: bigint): number {
  if (value <= 0n || maxValue <= 0n) return 0;
  if (value >= maxValue) return 1;
  return bigintLog2(value + 1n) / bigintLog2(maxValue + 1n);
}

/** Computes exact BigInt-safe budget fill ratio in `[0, 1]`. */
export function computeBudgetFillRatio(oreRequired: bigint, oreBudget: bigint): number {
  if (oreRequired <= 0n || oreBudget <= 0n) return 0;
  if (oreRequired >= oreBudget) return 1;
  return Number((oreRequired * 10_000n) / oreBudget) / 10_000;
}

/** Formats an arbitrary-precision BigInt with compact K/M/B/T/Q suffixes. */
export function formatCompactBigInt(value: bigint): string {
  if (value < 0n) return `-${formatCompactBigInt(-value)}`;
  for (const [unit, suffix] of COMPACT_UNITS) {
    if (value >= unit) {
      const whole = value / unit;
      const tenths = ((value % unit) * 10n) / unit;
      return tenths === 0n ? `${whole}${suffix}` : `${whole}.${tenths}${suffix}`;
    }
  }
  return String(value);
}
