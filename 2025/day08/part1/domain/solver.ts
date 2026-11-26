import { DisjointSet, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import { parseJunctions, type JunctionPair, type Point3D } from '../../shared';
import { selectClosestPairs } from './pairSelection';

export const PART1_PAIR_COUNT = 1000;
export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface ConnectionStep { readonly pair: JunctionPair; readonly merged: boolean; }
export interface CircuitConnectionResult {
  readonly steps: readonly ConnectionStep[];
  readonly componentSizesDesc: readonly number[];
  readonly answer: number;
}
export interface CircuitTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly lastPair: JunctionPair | null;
  readonly lastMerged: boolean;
  readonly mergedCount: number;
  readonly redundantCount: number;
  readonly componentCount: number;
  readonly topThreeSizes: readonly number[];
  readonly product: number;
  readonly pointTiers: Uint8Array;
}

const topProduct = (sizes: readonly number[]): number =>
  sizes.slice(0, 3).reduce((acc, s) => acc * s, 1);

export function connectClosestCircuits(points: readonly Point3D[], pairCount: number): CircuitConnectionResult {
  const pairs = selectClosestPairs(points, pairCount);
  const ds = new DisjointSet(points.length);
  const steps = pairs.map((pair) => ({ pair, merged: ds.union(pair.u, pair.v) }));
  const componentSizesDesc = ds.componentSizes().sort((a, b) => b - a);
  return { steps, componentSizesDesc, answer: topProduct(componentSizesDesc) };
}

function snapshotFrame(
  ds: DisjointSet, stepIndex: number, totalSteps: number, lastPair: JunctionPair | null,
  lastMerged: boolean, mergedCount: number, redundantCount: number,
): CircuitTraceFrame {
  const n = ds.size;
  const allSizes: number[] = [];
  const multiRoots: Array<{ root: number; size: number }> = [];
  for (let i = 0; i < n; i += 1) {
    if (ds.find(i) !== i) continue;
    const size = ds.sizeOf(i);
    allSizes.push(size);
    if (size >= 2) multiRoots.push({ root: i, size });
  }
  allSizes.sort((a, b) => b - a);
  multiRoots.sort((a, b) => b.size - a.size || a.root - b.root);
  const rootTier = new Uint8Array(n);
  for (let rank = 0; rank < multiRoots.length; rank += 1) {
    rootTier[multiRoots[rank]!.root] = rank < 3 ? 4 - rank : 1;
  }
  const pointTiers = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) pointTiers[i] = rootTier[ds.find(i)]!;

  const topThreeSizes = allSizes.slice(0, 3);
  return {
    stepIndex, totalSteps, lastPair, lastMerged, mergedCount, redundantCount,
    componentCount: ds.componentCount, topThreeSizes, product: topProduct(topThreeSizes), pointTiers,
  };
}

export function traceCircuitConnections(
  points: readonly Point3D[], pairCount: number, options?: TraceOptions,
): readonly CircuitTraceFrame[] {
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1) {
    throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
  }
  const pairs = selectClosestPairs(points, pairCount);
  const totalSteps = pairs.length;
  const checkpoints = totalSteps + 1 <= maxSteps
    ? Array.from({ length: totalSteps + 1 }, (_, i) => i)
    : maxSteps === 1
      ? [totalSteps]
      : Array.from({ length: maxSteps }, (_, i) => Math.round((i * totalSteps) / (maxSteps - 1)));

  const ds = new DisjointSet(points.length);
  const frames: CircuitTraceFrame[] = [];
  let nextCp = 0, mergedCount = 0, redundantCount = 0;
  if (checkpoints[nextCp] === 0) {
    frames.push(snapshotFrame(ds, 0, totalSteps, null, false, 0, 0));
    nextCp += 1;
  }
  for (let k = 0; k < totalSteps; k += 1) {
    const pair = pairs[k]!;
    const merged = ds.union(pair.u, pair.v);
    if (merged) mergedCount += 1; else redundantCount += 1;
    if (checkpoints[nextCp] === k + 1) {
      frames.push(snapshotFrame(ds, k + 1, totalSteps, pair, merged, mergedCount, redundantCount));
      nextCp += 1;
    }
  }
  return frames;
}

export const solver: PuzzleSolver<readonly Point3D[], number, CircuitTraceFrame> = {
  parse: parseJunctions,
  solve: (points) => connectClosestCircuits(points, PART1_PAIR_COUNT).answer,
  trace: (points, options) => traceCircuitConnections(points, PART1_PAIR_COUNT, options),
};
