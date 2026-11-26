import { MinCutResult, type CutEdgeTuple, type DisjointPathTuple, type ProbeRecord } from './minCut';
import type { WiringEdge, WiringGraph } from './wiringGraph';

function findOneFlowPath(
  graph: WiringGraph, cap: Uint8Array, used: Uint8Array, source: number, target: number,
  queue: Int32Array, parentEdge: Int32Array, seen: Int32Array, stamp: number,
): readonly number[] {
  let qHead = 0;
  let qTail = 1;
  queue[0] = source;
  seen[source] = stamp;
  parentEdge[source] = -1;
  while (qHead < qTail) {
    const u = queue[qHead]!;
    qHead += 1;
    for (let he = graph.firstHalfEdge(u); he !== -1; he = graph.nextHalfEdge(he)) {
      if (cap[he] !== 0 || used[he] !== 0) continue;
      const v = graph.targetOf(he);
      if (seen[v] === stamp) continue;
      seen[v] = stamp;
      parentEdge[v] = he;
      queue[qTail] = v;
      qTail += 1;
    }
  }
  const nodes: number[] = [target];
  for (let cur = target; cur !== source; ) {
    const he = parentEdge[cur]!;
    used[he] = 1;
    cur = graph.targetOf(he ^ 1);
    nodes.push(cur);
  }
  nodes.reverse();
  return Object.freeze(nodes);
}

/** Extracts 3 edge-disjoint source-to-target paths from saturated unit-flow half-edges. */
export function extractThreeDisjointPaths(
  graph: WiringGraph,
  cap: Uint8Array,
  source: number,
  target: number,
): DisjointPathTuple {
  const n = graph.vertexCount;
  const used = new Uint8Array(graph.edgeCount * 2);
  const queue = new Int32Array(n);
  const parentEdge = new Int32Array(n);
  const seen = new Int32Array(n);
  const p0 = findOneFlowPath(graph, cap, used, source, target, queue, parentEdge, seen, 1);
  const p1 = findOneFlowPath(graph, cap, used, source, target, queue, parentEdge, seen, 2);
  const p2 = findOneFlowPath(graph, cap, used, source, target, queue, parentEdge, seen, 3);
  return Object.freeze([p0, p1, p2]) as DisjointPathTuple;
}

/** Partitions residual S/T components, collects 3 crossing cut edges, and builds MinCutResult. */
export function buildMinCutResult(
  graph: WiringGraph, cap: Uint8Array, visited: Int32Array, stamp: number,
  source: number, target: number, probes: readonly ProbeRecord[],
): MinCutResult {
  const inS = new Uint8Array(graph.vertexCount);
  const sideS: number[] = [];
  const sideT: number[] = [];
  for (let u = 0; u < graph.vertexCount; u += 1) {
    if (visited[u] === stamp) { inS[u] = 1; sideS.push(u); } else { sideT.push(u); }
  }
  const cutEdges: WiringEdge[] = [];
  for (let e = 0; e < graph.edgeCount; e += 1) {
    const edge = graph.edges[e]!;
    if (inS[edge.u] !== inS[edge.v]) cutEdges.push(edge);
  }
  const paths = extractThreeDisjointPaths(graph, cap, source, target);
  return new MinCutResult(source, target, sideS, sideT, cutEdges as unknown as CutEdgeTuple, paths, probes);
}
