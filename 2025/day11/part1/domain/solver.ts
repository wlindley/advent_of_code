import type { DirectedGraph, PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseReactorGraph } from '../../shared';

export const PART1_SOURCE = 'you';
export const PART1_TARGET = 'out';
export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface ReactorNodeLayout { readonly id: string; readonly layer: number; readonly slot: number; }
export interface ReactorTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly totalGraphNodes: number;
  readonly relevantNodes: readonly ReactorNodeLayout[];
  readonly edges: readonly (readonly [string, string])[];
  readonly activeNode: string | null;
  readonly activeEdges: readonly (readonly [string, string])[];
  readonly ways: ReadonlyMap<string, bigint>;
  readonly isComplete: boolean;
}

function sampleIndices(total: number, maxSteps: number): number[] {
  if (total <= maxSteps) return Array.from({ length: total }, (_, i) => i);
  if (maxSteps === 1) return [total - 1];
  return Array.from({ length: maxSteps }, (_, k) => Math.round((k * (total - 1)) / (maxSteps - 1)));
}

/** Counts distinct paths from `you` to `out` in the reactor graph. */
export function solveReactor(graph: DirectedGraph<string>): bigint {
  return graph.countPaths(PART1_SOURCE, PART1_TARGET);
}

/** Emits bounded topological DP sweep frames for interactive path-count playback. */
export function traceReactor(graph: DirectedGraph<string>, options?: TraceOptions): readonly ReactorTraceFrame[] {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isInteger(maxSteps) || maxSteps < 1) {
    throw new RangeError(`maxSteps must be an integer >= 1, got ${maxSteps}`);
  }
  const sub = graph.relevantSubgraph(PART1_SOURCE, PART1_TARGET);
  if (sub.nodeCount === 0) {
    return Object.freeze([Object.freeze({
      stepIndex: 0, totalSteps: 1, totalGraphNodes: graph.nodeCount, relevantNodes: Object.freeze([]),
      edges: Object.freeze([]), activeNode: null, activeEdges: Object.freeze([]), ways: new Map(), isComplete: true,
    })]);
  }
  const order = sub.topologicalOrder();
  const depths = new Map<string, number>(order.map((n) => [n, 0]));
  let maxLayer = 0;
  for (const u of order) {
    const nextDepth = depths.get(u)! + 1;
    for (const v of sub.outNeighbors(u)) {
      if (nextDepth > depths.get(v)!) { depths.set(v, nextDepth); if (nextDepth > maxLayer) maxLayer = nextDepth; }
    }
  }
  const counts = new Array<number>(maxLayer + 1).fill(0);
  const relevantNodes = Object.freeze(order.map((id) => {
    const layer = depths.get(id)!;
    return Object.freeze({ id, layer, slot: counts[layer]!++ });
  }));
  const edges = Object.freeze(order.flatMap((u) => sub.outNeighbors(u).map((v) => Object.freeze([u, v] as const))));
  const sampled = sampleIndices(order.length, maxSteps);
  const ways = new Map<string, bigint>(order.map((n) => [n, 0n])).set(PART1_SOURCE, 1n);
  const frames: ReactorTraceFrame[] = [];
  for (let i = 0, cursor = 0; i < order.length; i++) {
    const u = order[i]!;
    const w = ways.get(u)!;
    const activeEdges = sub.outNeighbors(u).map((v) => {
      ways.set(v, ways.get(v)! + w);
      return Object.freeze([u, v] as const);
    });
    if (i === sampled[cursor]) {
      frames.push(Object.freeze({
        stepIndex: cursor, totalSteps: sampled.length, totalGraphNodes: graph.nodeCount,
        relevantNodes, edges, activeNode: u, activeEdges: Object.freeze(activeEdges),
        ways: new Map(ways), isComplete: i === order.length - 1,
      }));
      cursor++;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<DirectedGraph<string>, bigint, ReactorTraceFrame> = {
  parse: parseReactorGraph,
  solve: solveReactor,
  trace: traceReactor,
};
