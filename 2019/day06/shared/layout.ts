import type { OrbitMap } from './orbitMap';
import type {
  DepthShellSummary,
  HistogramBin,
  LayoutEdge,
  LayoutNode,
  OrbitTreeLayout,
} from './types';

export const MAX_TREE_SVG_NODES = 64;
export const MAX_HISTOGRAM_BINS = 48;

/** Computes node count per orbital depth shell from 0 (`COM`) through `maxDepth`. */
export function computeDepthHistogram(map: OrbitMap): readonly DepthShellSummary[] {
  const counts = new Int32Array(map.maxDepth + 1);
  for (let id = 0; id < map.nodeCount; id += 1) {
    const depth = map.depthOfId(id);
    counts[depth] = counts[depth]! + 1;
  }
  const shells: DepthShellSummary[] = [];
  for (let depth = 0; depth < counts.length; depth += 1) {
    shells.push(Object.freeze({ depth, nodeCount: counts[depth]! }));
  }
  return Object.freeze(shells);
}

function sliceToBin(shells: readonly DepthShellSummary[], start: number, end: number): HistogramBin {
  let nodeCount = 0;
  let orbitContribution = 0;
  for (let i = start; i < end; i += 1) {
    const shell = shells[i]!;
    nodeCount += shell.nodeCount;
    orbitContribution += shell.depth * shell.nodeCount;
  }
  return Object.freeze({
    depthStart: shells[start]!.depth,
    depthEnd: shells[end - 1]!.depth,
    nodeCount,
    orbitContribution,
  });
}

/** Partitions depth shells into at most `maxBins` contiguous, non-empty histogram bins. */
export function binDepthHistogram(
  shells: readonly DepthShellSummary[],
  maxBins: number,
): readonly HistogramBin[] {
  if (!Number.isInteger(maxBins) || maxBins < 1) {
    throw new RangeError(`maxBins must be a positive integer, got ${maxBins}`);
  }
  if (shells.length === 0) return Object.freeze([]);
  if (shells.length <= maxBins) {
    return Object.freeze(shells.map((_, i) => sliceToBin(shells, i, i + 1)));
  }
  const bins: HistogramBin[] = [];
  for (let b = 0; b < maxBins; b += 1) {
    const start = Math.floor((b * shells.length) / maxBins);
    const end = Math.floor(((b + 1) * shells.length) / maxBins);
    bins.push(sliceToBin(shells, start, end));
  }
  return Object.freeze(bins);
}

function computeLeafWeights(map: OrbitMap): Float64Array {
  const weights = new Float64Array(map.nodeCount);
  for (let id = map.nodeCount - 1; id >= 0; id -= 1) {
    const children = map.childIdsOf(id);
    if (children.length === 0) {
      weights[id] = 1;
    } else {
      let sum = 0;
      for (const childId of children) sum += weights[childId]!;
      weights[id] = sum;
    }
  }
  return weights;
}

function populateLayout(
  map: OrbitMap,
  width: number,
  height: number,
  leafWeights: Float64Array,
): OrbitTreeLayout {
  const padX = Math.min(44, width * 0.1);
  const padY = Math.min(24, height * 0.08);
  const xStep = (width - 2 * padX) / map.maxDepth;
  const yStarts = new Float64Array(map.nodeCount);
  const yEnds = new Float64Array(map.nodeCount);
  yStarts[0] = padY;
  yEnds[0] = height - padY;
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  for (let id = 0; id < map.nodeCount; id += 1) {
    const yStart = yStarts[id]!;
    const yEnd = yEnds[id]!;
    const depth = map.depthOfId(id);
    nodes.push(Object.freeze({
      id, label: map.labelOf(id), depth, x: padX + depth * xStep, y: (yStart + yEnd) / 2,
    }));
    let cursor = yStart;
    for (const childId of map.childIdsOf(id)) {
      const span = ((yEnd - yStart) * leafWeights[childId]!) / leafWeights[id]!;
      yStarts[childId] = cursor;
      yEnds[childId] = cursor + span;
      cursor += span;
      edges.push(Object.freeze({ parentId: id, childId }));
    }
  }
  return Object.freeze({ width, height, nodes: Object.freeze(nodes), edges: Object.freeze(edges) });
}

/** Computes a crossing-free left-to-right layered tree layout, or `null` above `MAX_TREE_SVG_NODES`. */
export function computeOrbitTreeLayout(
  map: OrbitMap,
  width: number,
  height: number,
): OrbitTreeLayout | null {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new RangeError('Layout dimensions must be positive finite numbers');
  }
  if (map.nodeCount > MAX_TREE_SVG_NODES) return null;
  return populateLayout(map, width, height, computeLeafWeights(map));
}
