import { MinHeap } from '../../../shared/core';
import type { VaultKeyGraph } from './keyGraph';
import type { VaultMap } from './vaultMap';

const ROBOT_MULT = 1_048_576;

/** Single optimal key-collection hop performed by one robot. */
export interface VaultHop {
  readonly robotIndex: number;
  readonly fromNode: number;
  readonly toKeyId: number;
  readonly toKeyBit: number;
  readonly distance: number;
  readonly heldMaskBefore: number;
}

/** Optimal Dijkstra result across key-mask and robot-position states. */
export interface VaultSolution {
  readonly totalSteps: number;
  readonly hops: readonly VaultHop[];
  readonly expandedStates: number;
}

interface SearchNode {
  readonly stateKey: number;
  readonly dist: number;
}

interface PrevLink {
  readonly prevKey: number;
  readonly hop: VaultHop;
}

interface SearchContext {
  readonly graph: VaultKeyGraph;
  readonly robotCount: number;
  readonly bestDist: Map<number, number>;
  readonly prevState: Map<number, PrevLink>;
  readonly heap: MinHeap<SearchNode>;
}

/** Packs up to 4 5-bit robot node IDs into a 20-bit integer. */
export function packRobotNodes(nodes: readonly number[]): number {
  let packed = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    packed |= nodes[i]! << (i * 5);
  }
  return packed;
}

/** Extracts the 5-bit node ID of `robotIndex` from `packedRobots`. */
export function getRobotNode(packedRobots: number, robotIndex: number): number {
  return (packedRobots >>> (robotIndex * 5)) & 31;
}

/** Replaces the 5-bit node ID of `robotIndex` in `packedRobots`. */
export function replaceRobotNode(packedRobots: number, robotIndex: number, newNode: number): number {
  const shift = robotIndex * 5;
  return (packedRobots & ~(31 << shift)) | (newNode << shift);
}

/** Packs 26-bit `heldMask` and 20-bit `packedRobots` into a safe 46-bit integer key. */
export function packVaultState(heldMask: number, packedRobots: number): number {
  return heldMask * ROBOT_MULT + packedRobots;
}

/** Unpacks a 46-bit state key without 32-bit bitwise truncation. */
export function unpackVaultState(stateKey: number): {
  readonly heldMask: number;
  readonly packedRobots: number;
} {
  return {
    heldMask: Math.floor(stateKey / ROBOT_MULT),
    packedRobots: stateKey % ROBOT_MULT,
  };
}

function unwindHops(prevState: Map<number, PrevLink>, goalKey: number): readonly VaultHop[] {
  const hops: VaultHop[] = [];
  let cursor = goalKey;
  while (true) {
    const link = prevState.get(cursor);
    if (!link) break;
    hops.push(link.hop);
    cursor = link.prevKey;
  }
  hops.reverse();
  return Object.freeze(hops);
}

function expandState(ctx: SearchContext, stateKey: number, dist: number, heldMask: number, packedRobots: number): void {
  for (let robotIndex = 0; robotIndex < ctx.robotCount; robotIndex += 1) {
    const fromNode = getRobotNode(packedRobots, robotIndex);
    const edges = ctx.graph.adjacency[fromNode]!;
    for (let i = 0; i < edges.length; i += 1) {
      const e = edges[i]!;
      if ((heldMask & e.toKeyBit) !== 0) continue;
      if ((e.doorsMask & heldMask) !== e.doorsMask) continue;
      if ((e.intermediateKeysMask & ~heldMask) !== 0) continue;

      const nextHeld = heldMask | e.toKeyBit;
      const nextRobots = replaceRobotNode(packedRobots, robotIndex, e.toKeyId);
      const nextKey = packVaultState(nextHeld, nextRobots);
      const nextDist = dist + e.distance;
      const prevBest = ctx.bestDist.get(nextKey);
      if (prevBest !== undefined && prevBest <= nextDist) continue;

      ctx.bestDist.set(nextKey, nextDist);
      ctx.prevState.set(nextKey, {
        prevKey: stateKey,
        hop: Object.freeze({
          robotIndex,
          fromNode,
          toKeyId: e.toKeyId,
          toKeyBit: e.toKeyBit,
          distance: e.distance,
          heldMaskBefore: heldMask,
        }),
      });
      ctx.heap.push({ stateKey: nextKey, dist: nextDist });
    }
  }
}

/** Finds the minimum-step key collection plan using Dijkstra over `(heldMask, robots)`. */
export function solveVaultOptimal(map: VaultMap, graph: VaultKeyGraph): VaultSolution {
  const allKeysMask = map.allKeysMask;
  if (allKeysMask === 0) {
    return Object.freeze({ totalSteps: 0, hops: Object.freeze([]), expandedStates: 0 });
  }
  const robotCount = map.entrances.length;
  const startNodes = Array.from({ length: robotCount }, (_, i) => map.keys.length + i);
  const startKey = packVaultState(0, packRobotNodes(startNodes));
  const ctx: SearchContext = {
    graph,
    robotCount,
    bestDist: new Map([[startKey, 0]]),
    prevState: new Map(),
    heap: new MinHeap((a, b) => a.dist - b.dist),
  };
  ctx.heap.push({ stateKey: startKey, dist: 0 });

  let expandedStates = 0;
  while (!ctx.heap.isEmpty) {
    const cur = ctx.heap.pop()!;
    if (cur.dist > ctx.bestDist.get(cur.stateKey)!) continue;
    expandedStates += 1;
    const { heldMask, packedRobots } = unpackVaultState(cur.stateKey);
    if (heldMask === allKeysMask) {
      return Object.freeze({
        totalSteps: cur.dist,
        hops: unwindHops(ctx.prevState, cur.stateKey),
        expandedStates,
      });
    }
    expandState(ctx, cur.stateKey, cur.dist, heldMask, packedRobots);
  }
  throw new Error('Vault keys are unreachable from the given entrance(s)');
}
