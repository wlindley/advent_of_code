import type { TrailEdge, TrailGraph } from './trailGraph';

export interface PathImprovement {
  readonly exploredStates: number;
  readonly distance: number;
  readonly vertexPath: readonly number[];
}

export interface LongestPathResult {
  readonly distance: number;
  readonly vertexPath: readonly number[];
  readonly exploredStates: number;
  readonly prunedBranches: number;
  readonly improvements: readonly PathImprovement[];
}

interface CsrGraph {
  readonly rowOffsets: Int32Array;
  readonly targets: Int32Array;
  readonly weights: Int32Array;
  readonly maxIncoming: Int32Array;
  readonly endId: number;
  readonly forcedPreEnd: number;
}

interface SearchState {
  readonly visited: Uint8Array;
  readonly path: number[];
  readonly improvements: PathImprovement[];
  bestDist: number;
  bestPath: readonly number[];
  exploredStates: number;
  prunedBranches: number;
}

function compareEdges(a: TrailEdge, b: TrailEdge): number {
  return b.weight - a.weight || a.to - b.to;
}

function packCsr(graph: TrailGraph, buckets: TrailEdge[][]): {
  readonly rowOffsets: Int32Array;
  readonly targets: Int32Array;
  readonly weights: Int32Array;
} {
  const n = graph.vertexCount;
  const rowOffsets = new Int32Array(n + 1);
  const targets = new Int32Array(graph.edgeCount);
  const weights = new Int32Array(graph.edgeCount);
  let cursor = 0;
  for (let u = 0; u < n; u += 1) {
    const out = buckets[u]!;
    out.sort(compareEdges);
    rowOffsets[u] = cursor;
    for (const edge of out) {
      targets[cursor] = edge.to;
      weights[cursor] = edge.weight;
      cursor += 1;
    }
  }
  rowOffsets[n] = cursor;
  return { rowOffsets, targets, weights };
}

function buildCsr(graph: TrailGraph): CsrGraph {
  const n = graph.vertexCount;
  const buckets: TrailEdge[][] = [];
  for (let i = 0; i < n; i += 1) buckets.push([]);
  const maxIncoming = new Int32Array(n);
  let inDegreeEnd = 0;
  let lastPreEnd = -1;
  for (const edge of graph.edges) {
    buckets[edge.from]!.push(edge);
    if (edge.weight > maxIncoming[edge.to]!) maxIncoming[edge.to] = edge.weight;
    if (edge.to === graph.endId) {
      inDegreeEnd += 1;
      lastPreEnd = edge.from;
    }
  }
  const { rowOffsets, targets, weights } = packCsr(graph, buckets);
  const forcedPreEnd = inDegreeEnd === 1 && lastPreEnd !== graph.startId ? lastPreEnd : -1;
  return { rowOffsets, targets, weights, maxIncoming, endId: graph.endId, forcedPreEnd };
}

function recordImprovement(state: SearchState, endId: number, nextDist: number): void {
  if (nextDist <= state.bestDist) return;
  state.bestDist = nextDist;
  state.bestPath = state.path.concat(endId);
  state.improvements.push(Object.freeze({
    exploredStates: state.exploredStates,
    distance: nextDist,
    vertexPath: Object.freeze(state.bestPath.slice()),
  }));
}

function searchLongest(
  csr: CsrGraph,
  state: SearchState,
  u: number,
  dist: number,
  remBound: number,
): void {
  state.exploredStates += 1;
  const startEdge = csr.rowOffsets[u]!;
  const endEdge = csr.rowOffsets[u + 1]!;
  for (let e = startEdge; e < endEdge; e += 1) {
    const to = csr.targets[e]!;
    if (state.visited[to] === 1) continue;
    if (u === csr.forcedPreEnd && to !== csr.endId) continue;
    const nextDist = dist + csr.weights[e]!;
    if (to === csr.endId) {
      recordImprovement(state, to, nextDist);
      continue;
    }
    const nextBound = remBound - csr.maxIncoming[to]!;
    if (nextDist + nextBound <= state.bestDist) {
      state.prunedBranches += 1;
      continue;
    }
    state.visited[to] = 1;
    state.path.push(to);
    searchLongest(csr, state, to, nextDist, nextBound);
    state.path.pop();
    state.visited[to] = 0;
  }
}

/** Finds the longest simple path from startId to endId using CSR branch-and-bound DFS. */
export function findLongestPath(graph: TrailGraph): LongestPathResult | null {
  const csr = buildCsr(graph);
  const visited = new Uint8Array(graph.vertexCount);
  visited[graph.startId] = 1;
  let initialBound = 0;
  for (let v = 0; v < graph.vertexCount; v += 1) {
    if (v !== graph.startId) initialBound += csr.maxIncoming[v]!;
  }
  const state: SearchState = {
    visited,
    path: [graph.startId],
    improvements: [],
    bestDist: -1,
    bestPath: [],
    exploredStates: 0,
    prunedBranches: 0,
  };
  searchLongest(csr, state, graph.startId, 0, initialBound);
  if (state.bestPath.length === 0) return null;
  return Object.freeze({
    distance: state.bestDist,
    vertexPath: Object.freeze(state.bestPath.slice()),
    exploredStates: state.exploredStates,
    prunedBranches: state.prunedBranches,
    improvements: Object.freeze(state.improvements.slice()),
  });
}
