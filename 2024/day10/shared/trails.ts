import {
  DIRS_4,
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import { MAX_HEIGHT, TopographicMap } from './map';

export const DEFAULT_MAX_TRACE_STEPS = 80;
// Manhattan radius-9 diamond in a 4-connected grid contains 1 + 4 * (9 * 10 / 2) = 181 cells.
export const MAX_REACHABLE_CELLS = 181;

export type PeakContributionMode = 'score' | 'rating';

export interface PeakContributionMetric {
  readonly mode: PeakContributionMode;
  peakValue(pathCount: number): number;
}

export interface PeakReach {
  readonly index: number;
  readonly pathCount: number;
  readonly contribution: number;
}

export interface TrailheadTraceFrame {
  readonly trailheadOrder: number;
  readonly totalTrailheads: number;
  readonly trailheadIndex: number;
  readonly reachableIndices: readonly number[];
  readonly peaks: readonly PeakReach[];
  readonly trailheadContribution: number;
  readonly cumulativeTotal: number;
}

interface SearchBuffers {
  readonly visitedStamp: Int32Array;
  readonly ways: Int32Array;
  readonly queue: Int32Array;
}

interface TrailheadExploration {
  readonly reachableIndices: readonly number[];
  readonly peaks: readonly PeakReach[];
  readonly contribution: number;
}

function createSearchBuffers(cellCount: number): SearchBuffers {
  return {
    visitedStamp: new Int32Array(cellCount),
    ways: new Int32Array(cellCount),
    queue: new Int32Array(Math.min(cellCount, MAX_REACHABLE_CELLS)),
  };
}

function enqueueNextHeightNeighbors(
  map: TopographicMap,
  buffers: SearchBuffers,
  stamp: number,
  cellIndex: number,
  nextHeight: number,
  tail: number,
): number {
  const [row, col] = map.coordsOf(cellIndex);
  const sourceWays = buffers.ways[cellIndex]!;
  let nextTail = tail;
  for (const [dr, dc] of DIRS_4) {
    const nr = row + dr;
    const nc = col + dc;
    if (!map.inBounds(nr, nc) || map.heightAt(nr, nc) !== nextHeight) continue;
    const neighbor = map.indexOf(nr, nc);
    if (buffers.visitedStamp[neighbor] !== stamp) {
      buffers.visitedStamp[neighbor] = stamp;
      buffers.ways[neighbor] = sourceWays;
      buffers.queue[nextTail++] = neighbor;
    } else {
      buffers.ways[neighbor] = buffers.ways[neighbor]! + sourceWays;
    }
  }
  return nextTail;
}

function exploreTrailhead(
  map: TopographicMap,
  buffers: SearchBuffers,
  stamp: number,
  trailheadIndex: number,
  metric: PeakContributionMetric,
): TrailheadExploration {
  buffers.visitedStamp[trailheadIndex] = stamp;
  buffers.ways[trailheadIndex] = 1;
  buffers.queue[0] = trailheadIndex;

  let head = 0;
  let tail = 1;
  let contribution = 0;
  const peaks: PeakReach[] = [];

  while (head < tail) {
    const current = buffers.queue[head++]!;
    const height = map.heightAtIndex(current);
    if (height === MAX_HEIGHT) {
      const pathCount = buffers.ways[current]!;
      const value = metric.peakValue(pathCount);
      contribution += value;
      peaks.push(Object.freeze({ index: current, pathCount, contribution: value }));
      continue;
    }
    tail = enqueueNextHeightNeighbors(map, buffers, stamp, current, height + 1, tail);
  }

  return {
    reachableIndices: Object.freeze(Array.from(buffers.queue.subarray(0, tail))),
    peaks: Object.freeze(peaks),
    contribution,
  };
}

/** Evaluates the sum of `metric` contributions across all height-0 trailheads in `map`. */
export function evaluateTotalMetric(
  map: TopographicMap,
  metric: PeakContributionMetric,
): number {
  const trailheads = map.trailheadIndices();
  if (trailheads.length === 0) return 0;

  const buffers = createSearchBuffers(map.size);
  let total = 0;
  for (let order = 0; order < trailheads.length; order += 1) {
    total += exploreTrailhead(map, buffers, order + 1, trailheads[order]!, metric).contribution;
  }
  return total;
}

/** Captures uniformly sampled trailhead exploration frames bounded by `options.maxSteps`. */
export function traceTrailheads(
  map: TopographicMap,
  metric: PeakContributionMetric,
  options?: TraceOptions,
): readonly TrailheadTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const trailheads = map.trailheadIndices();
  const sampledIndices = sampleTraceIndices(trailheads.length, limit);
  if (trailheads.length === 0) return Object.freeze([]);

  const buffers = createSearchBuffers(map.size);
  const frames: TrailheadTraceFrame[] = [];
  let sampleCursor = 0;
  let cumulativeTotal = 0;

  for (let order = 0; order < trailheads.length; order += 1) {
    const trailheadIndex = trailheads[order]!;
    const result = exploreTrailhead(map, buffers, order + 1, trailheadIndex, metric);
    cumulativeTotal += result.contribution;
    if (sampledIndices[sampleCursor] === order) {
      frames.push(
        Object.freeze({
          trailheadOrder: order,
          totalTrailheads: trailheads.length,
          trailheadIndex,
          reachableIndices: result.reachableIndices,
          peaks: result.peaks,
          trailheadContribution: result.contribution,
          cumulativeTotal,
        }),
      );
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
