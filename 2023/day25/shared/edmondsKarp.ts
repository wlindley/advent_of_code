import { buildMinCutResult } from './flowDecomposition';
import type { MinCutResult, ProbeRecord } from './minCut';
import type { WiringGraph } from './wiringGraph';

interface MaxFlowProbe {
  readonly flow: number;
  readonly stamp: number;
}

function verifyMinDegreeAtLeastThree(graph: WiringGraph): void {
  const n = graph.vertexCount;
  if (n < 2) throw new RangeError(`Expected at least 2 vertices, got ${n}`);
  const deg = new Int32Array(n);
  for (let e = 0; e < graph.edgeCount; e += 1) {
    const edge = graph.edges[e]!;
    deg[edge.u] = deg[edge.u]! + 1;
    deg[edge.v] = deg[edge.v]! + 1;
  }
  for (let u = 0; u < n; u += 1) {
    if (deg[u]! < 3) {
      throw new RangeError(`Component "${graph.labelOf(u)}" has degree ${deg[u]} < 3`);
    }
  }
}

function computeBfsOrder(graph: WiringGraph, source: number): Int32Array {
  const n = graph.vertexCount;
  const order = new Int32Array(n);
  const seen = new Uint8Array(n);
  let qHead = 0;
  let qTail = 1;
  order[0] = source;
  seen[source] = 1;
  while (qHead < qTail) {
    const u = order[qHead]!;
    qHead += 1;
    for (let he = graph.firstHalfEdge(u); he !== -1; he = graph.nextHalfEdge(he)) {
      const v = graph.targetOf(he);
      if (seen[v] !== 0) continue;
      seen[v] = 1;
      order[qTail] = v;
      qTail += 1;
    }
  }
  if (qTail < n) throw new RangeError('Wiring graph is disconnected');
  return order;
}

function augmentPath(
  graph: WiringGraph, cap: Uint8Array, visited: Int32Array, parentEdge: Int32Array,
  queue: Int32Array, source: number, target: number, stamp: number,
): boolean {
  let qHead = 0;
  let qTail = 1;
  queue[0] = source;
  visited[source] = stamp;
  parentEdge[source] = -1;
  while (qHead < qTail) {
    const u = queue[qHead]!;
    qHead += 1;
    for (let he = graph.firstHalfEdge(u); he !== -1; he = graph.nextHalfEdge(he)) {
      if (cap[he] === 0) continue;
      const v = graph.targetOf(he);
      if (visited[v] === stamp) continue;
      visited[v] = stamp;
      parentEdge[v] = he;
      if (v === target) return true;
      queue[qTail] = v;
      qTail += 1;
    }
  }
  return false;
}

function applyAugmentation(
  graph: WiringGraph,
  cap: Uint8Array,
  parentEdge: Int32Array,
  source: number,
  target: number,
): void {
  for (let cur = target; cur !== source; ) {
    const he = parentEdge[cur]!;
    cap[he] = cap[he]! - 1;
    cap[he ^ 1] = cap[he ^ 1]! + 1;
    cur = graph.targetOf(he ^ 1);
  }
}

function runCappedMaxFlow(
  graph: WiringGraph, cap: Uint8Array, visited: Int32Array, parentEdge: Int32Array,
  queue: Int32Array, source: number, target: number, startStamp: number,
): MaxFlowProbe {
  cap.fill(1);
  let flow = 0;
  let stamp = startStamp;
  while (flow < 4) {
    stamp += 1;
    if (!augmentPath(graph, cap, visited, parentEdge, queue, source, target, stamp)) break;
    applyAugmentation(graph, cap, parentEdge, source, target);
    flow += 1;
  }
  return { flow, stamp };
}

/**
 * Finds the unique 3-edge cut via capped unit-capacity Edmonds-Karp probes
 * scanning vertices in reverse BFS order from vertex 0.
 */
export function findThreeEdgeCut(graph: WiringGraph): MinCutResult {
  verifyMinDegreeAtLeastThree(graph);
  const order = computeBfsOrder(graph, 0);
  const n = graph.vertexCount;
  const cap = new Uint8Array(graph.edgeCount * 2);
  const visited = new Int32Array(n);
  const parentEdge = new Int32Array(n);
  const queue = new Int32Array(n);
  const probes: ProbeRecord[] = [];
  let stamp = 0;
  for (let i = order.length - 1; i >= 1; i -= 1) {
    const target = order[i]!;
    const res = runCappedMaxFlow(graph, cap, visited, parentEdge, queue, 0, target, stamp);
    stamp = res.stamp;
    probes.push(Object.freeze({ target, flow: res.flow }));
    if (res.flow < 3) throw new RangeError(`Found cut smaller than 3 (${res.flow}) before 3-edge cut`);
    if (res.flow === 3) return buildMinCutResult(graph, cap, visited, stamp, 0, target, probes);
  }
  throw new RangeError('No 3-edge cut found; graph is at least 4-edge-connected');
}
