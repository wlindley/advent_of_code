import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  WastelandNetwork,
  WastelandTraceFrame,
  parseWastelandNetwork,
  traceNetworkWalk,
} from '../../shared';

export const START_LABEL = 'AAA';
export const TARGET_LABEL = 'ZZZ';

function resolveEndpoints(network: WastelandNetwork): readonly [number, number] {
  return [network.requireId(START_LABEL), network.requireId(TARGET_LABEL)];
}

/** Counts steps required to walk from `AAA` to `ZZZ` following the cyclic L/R tape. */
export function solveHauntedWastelandPart1(network: WastelandNetwork): number {
  const [startId, targetId] = resolveEndpoints(network);
  return network.findFirstTarget(startId, (id) => id === targetId);
}

/** Builds a bounded trace of the Part 1 `AAA` -> `ZZZ` walk. */
export function traceHauntedWastelandPart1(
  network: WastelandNetwork,
  options?: TraceOptions,
): readonly WastelandTraceFrame[] {
  const [startId, targetId] = resolveEndpoints(network);
  return traceNetworkWalk(network, startId, (id) => id === targetId, options);
}

export const solver: PuzzleSolver<WastelandNetwork, number, WastelandTraceFrame> = Object.freeze({
  parse: parseWastelandNetwork,
  solve: solveHauntedWastelandPart1,
  trace: traceHauntedWastelandPart1,
});
