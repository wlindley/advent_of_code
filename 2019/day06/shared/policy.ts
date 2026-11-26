import { sampleTraceIndices } from '../../../shared/core';
import { computeDepthHistogram } from './layout';
import type { OrbitMap } from './orbitMap';

export const DEFAULT_MAX_TRACE_STEPS = 80;

export interface DepthSweepTraceFrame {
  readonly kind: 'depth-sweep';
  readonly activeDepth: number;
  readonly totalShells: number;
  readonly shellNodeCount: number;
  readonly cumulativeOrbits: number;
}

export interface TransferTraceFrame {
  readonly kind: 'transfer';
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly fromNodeId: number;
  readonly toNodeId: number;
  readonly lcaNodeId: number;
  readonly traversedNodeIds: readonly number[];
}

export type OrbitTraceFrame = DepthSweepTraceFrame | TransferTraceFrame;

export interface OrbitQueryPolicy {
  readonly id: string;
  readonly name: string;
  readonly metricLabel: string;
  solve(map: OrbitMap): number;
  trace(map: OrbitMap, maxSteps: number): readonly OrbitTraceFrame[];
}

function traceDepthSweep(map: OrbitMap, maxSteps: number): readonly DepthSweepTraceFrame[] {
  const shells = computeDepthHistogram(map);
  const cumulatives = new Int32Array(shells.length);
  let running = 0;
  for (let i = 0; i < shells.length; i += 1) {
    const shell = shells[i]!;
    running += shell.depth * shell.nodeCount;
    cumulatives[i] = running;
  }
  const indices = sampleTraceIndices(shells.length, maxSteps);
  const frames: DepthSweepTraceFrame[] = [];
  for (const idx of indices) {
    const shell = shells[idx]!;
    frames.push(
      Object.freeze({
        kind: 'depth-sweep',
        activeDepth: shell.depth,
        totalShells: shells.length,
        shellNodeCount: shell.nodeCount,
        cumulativeOrbits: cumulatives[idx]!,
      }),
    );
  }
  return Object.freeze(frames);
}

/** Policy computing and tracing total direct + indirect orbits across depth shells. */
export const TOTAL_ORBITS_POLICY: OrbitQueryPolicy = Object.freeze({
  id: 'total-orbits',
  name: 'Total Orbits',
  metricLabel: 'Direct + indirect orbits',
  solve: (map: OrbitMap) => map.totalOrbits,
  trace: traceDepthSweep,
});

function traceTransferRoute(
  map: OrbitMap,
  fromLabel: string,
  toLabel: string,
  maxSteps: number,
): readonly TransferTraceFrame[] {
  const route = map.findTransferRoute(fromLabel, toLabel);
  const totalSteps = route.pathNodeIds.length;
  const indices = sampleTraceIndices(totalSteps, maxSteps);
  const frames: TransferTraceFrame[] = [];
  for (const idx of indices) {
    frames.push(
      Object.freeze({
        kind: 'transfer',
        stepIndex: idx,
        totalSteps,
        fromNodeId: route.fromId,
        toNodeId: route.toId,
        lcaNodeId: route.lcaId,
        traversedNodeIds: Object.freeze(route.pathNodeIds.slice(0, idx + 1)),
      }),
    );
  }
  return Object.freeze(frames);
}

/** Creates an orbital transfer policy between the parent objects of `fromLabel` and `toLabel`. */
export function createTransferPolicy(fromLabel: string, toLabel: string): OrbitQueryPolicy {
  if (fromLabel.length === 0 || toLabel.length === 0) {
    throw new RangeError('Transfer endpoint labels must be non-empty');
  }
  return Object.freeze({
    id: `transfer:${fromLabel}->${toLabel}`,
    name: `Transfer (${fromLabel} to ${toLabel})`,
    metricLabel: 'Orbital transfers',
    solve: (map: OrbitMap) => map.findTransferRoute(fromLabel, toLabel).pathNodeIds.length - 1,
    trace: (map: OrbitMap, maxSteps: number) => traceTransferRoute(map, fromLabel, toLabel, maxSteps),
  });
}

export const SANTA_TRANSFER_POLICY: OrbitQueryPolicy = createTransferPolicy('YOU', 'SAN');
