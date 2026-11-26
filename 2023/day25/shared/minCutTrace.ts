import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { findThreeEdgeCut } from './edmondsKarp';
import type { MinCutResult } from './minCut';
import type { WiringGraph } from './wiringGraph';

export const DEFAULT_MAX_TRACE_STEPS = 48;

export type MinCutPhase = 'overview' | 'probe' | 'augment' | 'residual-cut' | 'severed';

export interface NodePoint {
  readonly x: number;
  readonly y: number;
}

export interface GraphLayout {
  readonly points: readonly NodePoint[];
}

export interface MinCutTraceFrame {
  readonly step: number;
  readonly totalSteps: number;
  readonly phase: MinCutPhase;
  readonly probeIndex: number;
  readonly probeTarget: number;
  readonly probeFlow: number;
  readonly activePathCount: number;
  readonly result: MinCutResult;
  readonly layout: GraphLayout;
}

const GOLDEN_ANGLE = 2.399963229728653;

function placeRim(nodes: readonly number[], rimX: number, points: NodePoint[]): void {
  const count = nodes.length;
  for (let k = 0; k < count; k += 1) {
    const y = 0.22 + (0.56 * (k + 1)) / (count + 1);
    points[nodes[k]!] = Object.freeze({ x: rimX, y });
  }
}

function placeBulk(nodes: readonly number[], xMin: number, xMax: number, points: NodePoint[]): void {
  const count = nodes.length;
  const cx = (xMin + xMax) * 0.5;
  const halfX = (xMax - xMin) * 0.5;
  for (let k = 0; k < count; k += 1) {
    const angle = k * GOLDEN_ANGLE;
    const radius = Math.sqrt((k + 0.5) / count);
    const x = cx + Math.cos(angle) * radius * halfX;
    const y = 0.5 + Math.sin(angle) * radius * 0.42;
    points[nodes[k]!] = Object.freeze({ x, y });
  }
}

function partitionSide(
  side: readonly number[],
  isRim: Uint8Array,
): { readonly rim: number[]; readonly bulk: number[] } {
  const rim: number[] = [];
  const bulk: number[] = [];
  for (let i = 0; i < side.length; i += 1) {
    const u = side[i]!;
    if (isRim[u] !== 0) rim.push(u); else bulk.push(u);
  }
  return { rim, bulk };
}

function computeBipartiteLayout(vertexCount: number, result: MinCutResult): GraphLayout {
  const isRim = new Uint8Array(vertexCount);
  for (let i = 0; i < result.cutEdges.length; i += 1) {
    const edge = result.cutEdges[i]!;
    isRim[edge.u] = 1;
    isRim[edge.v] = 1;
  }
  const partS = partitionSide(result.sideS, isRim);
  const partT = partitionSide(result.sideT, isRim);
  const points = new Array<NodePoint>(vertexCount);
  placeRim(partS.rim, 0.39, points);
  placeBulk(partS.bulk, 0.05, 0.35, points);
  placeRim(partT.rim, 0.61, points);
  placeBulk(partT.bulk, 0.65, 0.95, points);
  return Object.freeze({ points: Object.freeze(points) });
}

function makeFrame(
  step: number, totalSteps: number, phase: MinCutPhase, probeIndex: number,
  probeTarget: number, probeFlow: number, activePathCount: number,
  result: MinCutResult, layout: GraphLayout,
): MinCutTraceFrame {
  return Object.freeze({
    step, totalSteps, phase, probeIndex, probeTarget, probeFlow, activePathCount, result, layout,
  });
}

function buildRawFrames(result: MinCutResult, layout: GraphLayout): MinCutTraceFrame[] {
  const winIdx = result.probes.length - 1;
  const totalSteps = winIdx + 7;
  const frames: MinCutTraceFrame[] = [];
  frames.push(makeFrame(1, totalSteps, 'overview', 0, result.target, 0, 0, result, layout));
  for (let i = 0; i < winIdx; i += 1) {
    const p = result.probes[i]!;
    frames.push(makeFrame(frames.length + 1, totalSteps, 'probe', i, p.target, p.flow, 0, result, layout));
  }
  frames.push(makeFrame(frames.length + 1, totalSteps, 'probe', winIdx, result.target, 0, 0, result, layout));
  for (let k = 1; k <= 3; k += 1) {
    frames.push(makeFrame(frames.length + 1, totalSteps, 'augment', winIdx, result.target, k, k, result, layout));
  }
  frames.push(makeFrame(frames.length + 1, totalSteps, 'residual-cut', winIdx, result.target, 3, 3, result, layout));
  frames.push(makeFrame(frames.length + 1, totalSteps, 'severed', winIdx, result.target, 3, 0, result, layout));
  return frames;
}

/** Builds a bounded trace of the Edmonds-Karp probes, 3 disjoint flow paths, and severed cut. */
export function buildMinCutTrace(graph: WiringGraph, options?: TraceOptions): readonly MinCutTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const result = findThreeEdgeCut(graph);
  const layout = computeBipartiteLayout(graph.vertexCount, result);
  const raw = buildRawFrames(result, layout);
  const indices = sampleTraceIndices(raw.length, maxSteps);
  const sampled: MinCutTraceFrame[] = [];
  for (let i = 0; i < indices.length; i += 1) {
    sampled.push(raw[indices[i]!]!);
  }
  return Object.freeze(sampled);
}
