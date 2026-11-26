import { DisjointSet, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import { compareJunctionPairs, parseJunctions, squaredDistance3D, type JunctionPair, type Point3D } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export class SingleCircuitResult {
  constructor(readonly mstEdges: readonly JunctionPair[], readonly sideOf: Uint8Array, readonly answer: bigint) {
    Object.freeze(mstEdges);
    Object.freeze(this);
  }
  get finalEdge(): JunctionPair { return this.mstEdges[this.mstEdges.length - 1]!; }
}

export class BridgeTraceFrame {
  constructor(
    readonly edgeCount: number, readonly totalEdges: number,
    readonly lastEdge: JunctionPair | null, readonly edgeXProduct: bigint | null,
  ) { Object.freeze(this); }
  get componentCount(): number { return this.totalEdges + 1 - this.edgeCount; }
  get isFinalBridge(): boolean { return this.edgeCount === this.totalEdges; }
}

function isEarlierEdge(d1: number, a1: number, b1: number, d2: number, a2: number, b2: number): boolean {
  if (d1 !== d2) return d1 < d2;
  const u1 = Math.min(a1, b1), u2 = Math.min(a2, b2);
  return u1 !== u2 ? u1 < u2 : Math.max(a1, b1) < Math.max(a2, b2);
}

const edgeProduct = (points: readonly Point3D[], edge: JunctionPair): bigint =>
  BigInt(points[edge.u]!.x) * BigInt(points[edge.v]!.x);

/** Prim's O(N^2) MST in O(N) typed arrays with canonical (distSq, min, max) tie-breaking matches Kruskal's exact MST. */
export function connectUntilSingleCircuit(points: readonly Point3D[]): SingleCircuitResult {
  const n = points.length;
  if (n < 2) throw new RangeError(`Expected at least 2 junction boxes, got ${n}`);
  const inTree = new Uint8Array(n), bestDistSq = new Float64Array(n).fill(Infinity), parent = new Int32Array(n).fill(-1);
  inTree[0] = 1;
  for (let v = 1; v < n; v += 1) { bestDistSq[v] = squaredDistance3D(points[0]!, points[v]!); parent[v] = 0; }

  const mstEdges: JunctionPair[] = [];
  for (let step = 0; step < n - 1; step += 1) {
    let next = -1;
    for (let v = 1; v < n; v += 1) {
      if (!inTree[v] && (next === -1 || isEarlierEdge(bestDistSq[v]!, parent[v]!, v, bestDistSq[next]!, parent[next]!, next))) next = v;
    }
    inTree[next] = 1;
    const pn = parent[next]!;
    mstEdges.push(Object.freeze({ u: Math.min(pn, next), v: Math.max(pn, next), distSq: bestDistSq[next]! }));
    for (let w = 1; w < n; w += 1) {
      if (inTree[w]) continue;
      const d = squaredDistance3D(points[next]!, points[w]!);
      if (isEarlierEdge(d, next, w, bestDistSq[w]!, parent[w]!, w)) { bestDistSq[w] = d; parent[w] = next; }
    }
  }

  // Sort Prim's MST edges so mstEdges matches Kruskal's chronological merge order.
  mstEdges.sort(compareJunctionPairs);
  const dsu = new DisjointSet(n);
  for (let i = 0; i < n - 2; i += 1) dsu.union(mstEdges[i]!.u, mstEdges[i]!.v);
  const finalEdge = mstEdges[n - 2]!, sideARoot = dsu.find(finalEdge.u), sideOf = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) sideOf[i] = dsu.find(i) === sideARoot ? 0 : 1;
  return new SingleCircuitResult(mstEdges, sideOf, edgeProduct(points, finalEdge));
}

export function traceFinalBridge(points: readonly Point3D[], options?: TraceOptions): readonly BridgeTraceFrame[] {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1) throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
  const { mstEdges } = connectUntilSingleCircuit(points), totalEdges = mstEdges.length;
  const counts: number[] =
    totalEdges + 1 <= maxSteps ? Array.from({ length: totalEdges + 1 }, (_, i) => i)
      : maxSteps === 1 ? [totalEdges]
        : maxSteps === 2 ? [totalEdges - 1, totalEdges]
          : [...Array.from({ length: maxSteps - 1 }, (_, i) => Math.round((i * (totalEdges - 1)) / (maxSteps - 2))), totalEdges];
  return Object.freeze(counts.map((c) => {
    const last = c === 0 ? null : mstEdges[c - 1]!;
    return new BridgeTraceFrame(c, totalEdges, last, last === null ? null : edgeProduct(points, last));
  }));
}

export const solver: PuzzleSolver<readonly Point3D[], bigint, BridgeTraceFrame> = {
  parse: parseJunctions,
  solve: (points) => connectUntilSingleCircuit(points).answer,
  trace: (points, options) => traceFinalBridge(points, options),
};
