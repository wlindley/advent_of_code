import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { LongestPathResult } from './longestPath';
import type { TrailGraph } from './trailGraph';
import type { TrailMap } from './trailMap';

export const DEFAULT_MAX_TRACE_STEPS = 80;

export type HikePhase = 'contracted' | 'search' | 'hike' | 'unreachable';

export interface HikeTraceFrame {
  readonly step: number;
  readonly totalSteps: number;
  readonly phase: HikePhase;
  readonly vertexPath: readonly number[];
  readonly distance: number;
  readonly exploredStates: number;
  readonly hikerCell: number;
  readonly isFinal: boolean;
  readonly caption: string;
}

interface RawFrame {
  readonly phase: HikePhase;
  readonly vertexPath: readonly number[];
  readonly distance: number;
  readonly exploredStates: number;
  readonly hikerCell: number;
  readonly isFinal: boolean;
  readonly caption: string;
}

function appendHikeFrames(
  frames: RawFrame[],
  graph: TrailGraph,
  result: LongestPathResult,
): void {
  let dist = 0;
  for (let i = 1; i < result.vertexPath.length; i += 1) {
    const prev = result.vertexPath[i - 1]!;
    const curr = result.vertexPath[i]!;
    dist += graph.edgeBetween(prev, curr)!.weight;
    const isFinal = i === result.vertexPath.length - 1;
    frames.push({
      phase: 'hike',
      vertexPath: Object.freeze(result.vertexPath.slice(0, i + 1)),
      distance: dist,
      exploredStates: result.exploredStates,
      hikerCell: graph.junctions[curr]!,
      isFinal,
      caption: isFinal
        ? `Longest walk complete: ${result.distance} steps across ${result.vertexPath.length - 1} corridors.`
        : `Hiking optimal route: ${dist} / ${result.distance} steps.`,
    });
  }
}

function appendSearchFrames(
  frames: RawFrame[],
  graph: TrailGraph,
  result: LongestPathResult,
): void {
  for (const imp of result.improvements) {
    const lastV = imp.vertexPath[imp.vertexPath.length - 1]!;
    frames.push({
      phase: 'search',
      vertexPath: imp.vertexPath,
      distance: imp.distance,
      exploredStates: imp.exploredStates,
      hikerCell: graph.junctions[lastV]!,
      isFinal: false,
      caption: `New best route: ${imp.distance} steps after ${imp.exploredStates} DFS states.`,
    });
  }
}

function buildRawFrames(
  map: TrailMap,
  graph: TrailGraph,
  result: LongestPathResult | null,
): RawFrame[] {
  const frames: RawFrame[] = [{
    phase: 'contracted',
    vertexPath: Object.freeze([graph.startId]),
    distance: 0,
    exploredStates: 0,
    hikerCell: map.start,
    isFinal: false,
    caption: `Contracted ${map.rows}x${map.cols} maze into ${graph.vertexCount} junctions and ${graph.edgeCount} corridors.`,
  }];
  if (result === null) {
    frames.push({
      phase: 'unreachable',
      vertexPath: Object.freeze([graph.startId]),
      distance: 0,
      exploredStates: 0,
      hikerCell: map.start,
      isFinal: true,
      caption: 'No valid path reaches the trail exit.',
    });
    return frames;
  }
  appendSearchFrames(frames, graph, result);
  appendHikeFrames(frames, graph, result);
  return frames;
}

/** Builds a bounded visualization trace for trail contraction, search, and optimal hike. */
export function buildHikeTrace(
  map: TrailMap,
  graph: TrailGraph,
  result: LongestPathResult | null,
  options?: TraceOptions,
): readonly HikeTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const raw = buildRawFrames(map, graph, result);
  const indices = sampleTraceIndices(raw.length, maxSteps);
  const totalSteps = indices.length;
  const frames: HikeTraceFrame[] = [];
  for (let step = 0; step < totalSteps; step += 1) {
    const src = raw[indices[step]!]!;
    frames.push(Object.freeze({
      ...src,
      step,
      totalSteps,
    }));
  }
  return Object.freeze(frames);
}
