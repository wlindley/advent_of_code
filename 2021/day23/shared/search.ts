import { MinHeap } from '../../../shared/core';
import type { BurrowMove, BurrowState } from './burrow';
import { goalKeyForDepth } from './constants';
import { estimateRemainingEnergy } from './heuristic';
import { generateSuccessors } from './moves';

export interface SearchResult {
  readonly totalEnergy: number;
  readonly moves: readonly BurrowMove[];
  readonly statesExpanded: number;
}

interface SearchNode {
  readonly key: string;
  readonly g: number;
  readonly f: number;
}

interface ParentEdge {
  readonly prevKey: string;
  readonly move: BurrowMove;
}

function reconstructMoves(
  goalKey: string,
  startKey: string,
  parent: Map<string, ParentEdge>,
): readonly BurrowMove[] {
  const moves: BurrowMove[] = [];
  let cursor = goalKey;
  while (cursor !== startKey) {
    const edge = parent.get(cursor)!;
    moves.push(edge.move);
    cursor = edge.prevKey;
  }
  moves.reverse();
  return Object.freeze(moves);
}

function expandNeighbors(
  node: SearchNode,
  depth: number,
  heap: MinHeap<SearchNode>,
  bestG: Map<string, number>,
  parent: Map<string, ParentEdge>,
): void {
  const transitions = generateSuccessors(node.key, depth);
  for (const transition of transitions) {
    const nextG = node.g + transition.move.energy;
    const prevG = bestG.get(transition.nextKey);
    if (prevG !== undefined && nextG >= prevG) continue;
    bestG.set(transition.nextKey, nextG);
    parent.set(transition.nextKey, { prevKey: node.key, move: transition.move });
    heap.push({
      key: transition.nextKey,
      g: nextG,
      f: nextG + estimateRemainingEnergy(transition.nextKey, depth),
    });
  }
}

/** Finds the minimum-energy sequence of amphipod moves via A* search. */
export function findOptimalOrganization(start: BurrowState): SearchResult {
  const depth = start.roomDepth;
  const goalKey = goalKeyForDepth(depth);
  const heap = new MinHeap<SearchNode>((a, b) => a.f - b.f || a.g - b.g);
  const bestG = new Map<string, number>([[start.key, 0]]);
  const parent = new Map<string, ParentEdge>();
  let statesExpanded = 0;

  heap.push({ key: start.key, g: 0, f: estimateRemainingEnergy(start.key, depth) });
  while (!heap.isEmpty) {
    const node = heap.pop()!;
    statesExpanded += 1;
    if (node.key === goalKey) {
      return Object.freeze({
        totalEnergy: node.g,
        moves: reconstructMoves(goalKey, start.key, parent),
        statesExpanded,
      });
    }
    expandNeighbors(node, depth, heap, bestG, parent);
  }
  throw new Error('Burrow configuration is unsolvable');
}
