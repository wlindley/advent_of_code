import { LanClique, type LanGraph } from './graph';
import {
  compareNodeIds,
  compareNumbers,
  differenceSorted,
  intersectSorted,
} from './sorted';

export { LanClique };

interface CliqueSearchState {
  best: readonly number[];
  readonly history: LanClique[];
}

/** Finds all canonical triangles (`u < v < w`) containing at least one node matching `prefix`. */
export function findTriangles(graph: LanGraph, prefix: string): readonly LanClique[] {
  const triangles: LanClique[] = [];
  for (let u = 0; u < graph.nodeCount; u += 1) {
    const upperU = graph.upperNeighbors(u);
    for (const v of upperU) {
      const common = intersectSorted(upperU, graph.upperNeighbors(v));
      for (const w of common) {
        const clique = graph.createClique([u, v, w]);
        if (clique.hasNodeStartingWith(prefix)) triangles.push(clique);
      }
    }
  }
  return Object.freeze(triangles);
}

function choosePivot(
  graph: LanGraph,
  candidates: readonly number[],
  excluded: readonly number[],
): number {
  let bestPivot = candidates[0]!;
  let bestDegree = -1;
  for (const nodeId of [...candidates, ...excluded]) {
    const degree = intersectSorted(candidates, graph.neighbors(nodeId)).length;
    if (degree > bestDegree) {
      bestDegree = degree;
      bestPivot = nodeId;
    }
  }
  return bestPivot;
}

function recordCandidateClique(
  current: readonly number[],
  graph: LanGraph,
  state: CliqueSearchState,
): void {
  // Pivot-ordered recursion can append higher node IDs before lower ones, so sort R first.
  const sorted = [...current].sort(compareNumbers);
  if (
    sorted.length > state.best.length ||
    (sorted.length === state.best.length && compareNodeIds(sorted, state.best) < 0)
  ) {
    state.best = sorted;
    state.history.push(graph.createClique(sorted));
  }
}

function expandClique(
  current: number[],
  candidates: readonly number[],
  excluded: readonly number[],
  graph: LanGraph,
  state: CliqueSearchState,
): void {
  if (candidates.length === 0) {
    if (excluded.length === 0) recordCandidateClique(current, graph, state);
    return;
  }
  if (current.length + candidates.length < state.best.length) return;

  const pivot = choosePivot(graph, candidates, excluded);
  const explore = differenceSorted(candidates, graph.neighbors(pivot));
  const remaining = [...candidates];
  const nextExcluded = [...excluded];

  for (const nodeId of explore) {
    const adj = graph.neighbors(nodeId);
    current.push(nodeId);
    expandClique(
      current,
      intersectSorted(remaining, adj),
      intersectSorted(nextExcluded, adj),
      graph,
      state,
    );
    current.pop();
    remaining.splice(remaining.indexOf(nodeId), 1);
    nextExcluded.push(nodeId);
    nextExcluded.sort(compareNumbers);
  }
}

/** Runs pivoted Bron–Kerbosch across ordered roots and records each strictly better clique. */
export function findMaximumCliqueHistory(graph: LanGraph): readonly LanClique[] {
  const state: CliqueSearchState = { best: [], history: [] };
  for (let u = 0; u < graph.nodeCount; u += 1) {
    const upper = graph.upperNeighbors(u);
    if (1 + upper.length <= state.best.length) continue;
    expandClique([u], upper, [], graph, state);
  }
  return Object.freeze(state.history);
}

/** Returns the maximum clique (lex-smallest password on ties) in `graph`. */
export function findMaximumClique(graph: LanGraph): LanClique {
  const history = findMaximumCliqueHistory(graph);
  return history[history.length - 1]!;
}
