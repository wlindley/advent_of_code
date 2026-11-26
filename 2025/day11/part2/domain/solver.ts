import type { DirectedGraph, PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseReactorGraph } from '../../shared';
import { WaypointCounts, waypointMaskFor } from './waypointState';

export const PART2_SOURCE = 'svr';
export const PART2_TARGET = 'out';
export const PART2_DAC = 'dac';
export const PART2_FFT = 'fft';
export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface WaypointQuery { readonly source: string; readonly target: string; readonly dac: string; readonly fft: string; }
export const DEFAULT_WAYPOINT_QUERY: WaypointQuery = Object.freeze({
  source: PART2_SOURCE, target: PART2_TARGET, dac: PART2_DAC, fft: PART2_FFT,
});

export interface ReactorWaypointNodeLayout { readonly id: string; readonly layer: number; readonly slot: number; }
export interface ReactorWaypointTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly totalGraphNodes: number;
  readonly relevantNodes: readonly ReactorWaypointNodeLayout[];
  readonly edges: readonly (readonly [string, string])[];
  readonly activeNode: string | null;
  readonly activeEdges: readonly (readonly [string, string])[];
  readonly states: ReadonlyMap<string, WaypointCounts>;
  readonly isComplete: boolean;
}

function initWaypointStates(order: readonly string[], source: string, dac: string, fft: string): Map<string, WaypointCounts> {
  const states = new Map<string, WaypointCounts>(order.map((node) => [node, WaypointCounts.ZERO]));
  states.set(source, WaypointCounts.unit(waypointMaskFor(source, dac, fft)));
  return states;
}

function relaxOutgoing(
  sub: DirectedGraph<string>,
  u: string,
  states: Map<string, WaypointCounts>,
  dac: string,
  fft: string,
): readonly (readonly [string, string])[] {
  const uState = states.get(u)!;
  return Object.freeze(sub.outNeighbors(u).map((v) => {
    states.set(v, states.get(v)!.accumulate(uState, waypointMaskFor(v, dac, fft)));
    return Object.freeze([u, v] as const);
  }));
}

function computeLayeredLayout(sub: DirectedGraph<string>, order: readonly string[]): readonly ReactorWaypointNodeLayout[] {
  const depths = new Map<string, number>(order.map((n) => [n, 0]));
  let maxLayer = 0;
  for (const u of order) {
    const nextDepth = depths.get(u)! + 1;
    for (const v of sub.outNeighbors(u)) {
      if (nextDepth > depths.get(v)!) { depths.set(v, nextDepth); if (nextDepth > maxLayer) maxLayer = nextDepth; }
    }
  }
  const counts = new Array<number>(maxLayer + 1).fill(0);
  return Object.freeze(order.map((id) => {
    const layer = depths.get(id)!;
    return Object.freeze({ id, layer, slot: counts[layer]!++ });
  }));
}

function sampleIndices(total: number, maxSteps: number): number[] {
  if (total <= maxSteps) return Array.from({ length: total }, (_, i) => i);
  if (maxSteps === 1) return [total - 1];
  return Array.from({ length: maxSteps }, (_, k) => Math.round((k * (total - 1)) / (maxSteps - 1)));
}

/** Counts distinct directed walks from source to target visiting both dac and fft. */
export function solveReactorWaypoints(graph: DirectedGraph<string>, query: WaypointQuery = DEFAULT_WAYPOINT_QUERY): bigint {
  // Prune to s-t relevant subgraph first so off-path cycles or unreachable components do not fail.
  const sub = graph.relevantSubgraph(query.source, query.target);
  if (sub.nodeCount === 0) return 0n;
  const order = sub.topologicalOrder();
  const states = initWaypointStates(order, query.source, query.dac, query.fft);
  for (const u of order) relaxOutgoing(sub, u, states, query.dac, query.fft);
  return states.get(query.target)!.both;
}

/** Emits bounded topological DP sweep frames for interactive 4-state waypoint playback. */
export function traceReactorWaypoints(graph: DirectedGraph<string>, options?: TraceOptions): readonly ReactorWaypointTraceFrame[] {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isInteger(maxSteps) || maxSteps < 1) {
    throw new RangeError(`maxSteps must be an integer >= 1, got ${maxSteps}`);
  }
  const sub = graph.relevantSubgraph(PART2_SOURCE, PART2_TARGET);
  if (sub.nodeCount === 0) {
    return Object.freeze([Object.freeze({
      stepIndex: 0, totalSteps: 1, totalGraphNodes: graph.nodeCount, relevantNodes: Object.freeze([]),
      edges: Object.freeze([]), activeNode: null, activeEdges: Object.freeze([]), states: new Map(), isComplete: true,
    })]);
  }
  const order = sub.topologicalOrder();
  const relevantNodes = computeLayeredLayout(sub, order);
  const edges = Object.freeze(order.flatMap((u) => sub.outNeighbors(u).map((v) => Object.freeze([u, v] as const))));
  const sampled = sampleIndices(order.length, maxSteps);
  const states = initWaypointStates(order, PART2_SOURCE, PART2_DAC, PART2_FFT);
  const frames: ReactorWaypointTraceFrame[] = [];
  for (let i = 0, cursor = 0; i < order.length; i++) {
    const u = order[i]!;
    const activeEdges = relaxOutgoing(sub, u, states, PART2_DAC, PART2_FFT);
    if (i === sampled[cursor]) {
      frames.push(Object.freeze({
        stepIndex: cursor, totalSteps: sampled.length, totalGraphNodes: graph.nodeCount,
        relevantNodes, edges, activeNode: u, activeEdges,
        // Snapshot states only on sampled frames to keep trace memory O(maxSteps * |V|).
        states: new Map(states), isComplete: i === order.length - 1,
      }));
      cursor++;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<DirectedGraph<string>, bigint, ReactorWaypointTraceFrame> = {
  parse: parseReactorGraph,
  solve: solveReactorWaypoints,
  trace: traceReactorWaypoints,
};
