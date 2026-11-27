import { MinHeap } from '../../../shared/core';
import { buildPortalGraph, type PortalGraph } from './graph';
import type { DonutMaze } from './maze';
import type { DonutPolicy } from './policy';

export interface PortalHop {
  readonly fromPortalId: number;
  readonly toPortalId: number;
  readonly walkSteps: number;
  readonly warpedVia: string | null;
  readonly depthAfter: number;
}

export interface DonutSolution {
  readonly totalSteps: number;
  readonly hops: readonly PortalHop[];
  readonly maxDepthReached: number;
}

interface HeapNode {
  readonly cost: number;
  readonly key: number;
}

const INF = 0x3fffffff;

function compareHeapNodes(a: HeapNode, b: HeapNode): number {
  return a.cost - b.cost;
}

function relaxState(
  fromKey: number,
  nextCost: number,
  nextKey: number,
  viaPortalId: number,
  dist: Int32Array,
  prevState: Int32Array,
  prevVia: Int32Array,
  heap: MinHeap<HeapNode>,
): void {
  if (nextCost >= dist[nextKey]!) return;
  dist[nextKey] = nextCost;
  prevState[nextKey] = fromKey;
  prevVia[nextKey] = viaPortalId;
  heap.push({ cost: nextCost, key: nextKey });
}

function expandState(
  maze: DonutMaze,
  graph: PortalGraph,
  policy: DonutPolicy,
  stateKey: number,
  cost: number,
  maxDepth: number,
  dist: Int32Array,
  prevState: Int32Array,
  prevVia: Int32Array,
  heap: MinHeap<HeapNode>,
): void {
  const portalCount = maze.portals.length;
  const depth = Math.floor(stateKey / portalCount);
  const portalId = stateKey % portalCount;
  for (const edge of graph.adj[portalId]!) {
    if (edge.to === maze.startId) continue;
    if (edge.to === maze.goalId) {
      if (policy.isGoalDepth(depth)) {
        const goalKey = depth * portalCount + maze.goalId;
        relaxState(stateKey, cost + edge.steps, goalKey, -1, dist, prevState, prevVia, heap);
      }
      continue;
    }
    const viaPortal = maze.portals[edge.to]!;
    const nextDepth = policy.nextDepth(depth, viaPortal.side, maxDepth);
    if (nextDepth === null) continue;
    const nextKey = nextDepth * portalCount + viaPortal.pairId;
    relaxState(stateKey, cost + edge.steps + 1, nextKey, edge.to, dist, prevState, prevVia, heap);
  }
}

function buildSolution(
  maze: DonutMaze,
  startKey: number,
  goalKey: number,
  dist: Int32Array,
  prevState: Int32Array,
  prevVia: Int32Array,
): DonutSolution {
  const portalCount = maze.portals.length;
  const hops: PortalHop[] = [];
  let maxDepthReached = 0;
  for (let cur = goalKey; cur !== startKey; ) {
    const prev = prevState[cur]!;
    const via = prevVia[cur]!;
    const depthAfter = Math.floor(cur / portalCount);
    const delta = dist[cur]! - dist[prev]!;
    const warpedVia = via >= 0 ? maze.portals[via]!.label : null;
    const walkSteps = via >= 0 ? delta - 1 : delta;
    if (depthAfter > maxDepthReached) maxDepthReached = depthAfter;
    hops.push(
      Object.freeze({
        fromPortalId: prev % portalCount,
        toPortalId: cur % portalCount,
        walkSteps,
        warpedVia,
        depthAfter,
      }),
    );
    cur = prev;
  }
  hops.reverse();
  return Object.freeze({
    totalSteps: dist[goalKey]!,
    hops: Object.freeze(hops),
    maxDepthReached,
  });
}

/** Finds the shortest path from AA to ZZ under the supplied DonutPolicy via Dijkstra. */
export function solveDonutMaze(maze: DonutMaze, policy: DonutPolicy): DonutSolution {
  const graph = buildPortalGraph(maze);
  const portalCount = maze.portals.length;
  const maxDepth = policy.maxDepthFor(portalCount);
  const stateCount = (maxDepth + 1) * portalCount;
  const dist = new Int32Array(stateCount).fill(INF);
  const prevState = new Int32Array(stateCount).fill(-1);
  const prevVia = new Int32Array(stateCount).fill(-1);
  const startKey = maze.startId;
  const goalKey = maze.goalId;
  const heap = new MinHeap<HeapNode>(compareHeapNodes);
  dist[startKey] = 0;
  heap.push({ cost: 0, key: startKey });
  while (!heap.isEmpty) {
    const node = heap.pop()!;
    if (node.cost > dist[node.key]!) continue;
    if (node.key === goalKey) return buildSolution(maze, startKey, goalKey, dist, prevState, prevVia);
    expandState(maze, graph, policy, node.key, node.cost, maxDepth, dist, prevState, prevVia, heap);
  }
  throw new Error('No path found from AA to ZZ');
}
