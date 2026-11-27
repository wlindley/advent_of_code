import type { CavernMap } from './cavern';

const UNVISITED = -1;
const BUCKET_COUNT = 10;

interface SearchState {
  readonly map: CavernMap;
  readonly dist: Int32Array;
  readonly parent: Int32Array;
  readonly buckets: number[][];
  pending: number;
}

function createBuckets(): number[][] {
  return Array.from({ length: BUCKET_COUNT }, () => []);
}

function relaxNeighbor(
  state: SearchState,
  u: number,
  currentDist: number,
  nextIdx: number,
): void {
  // Edge weights depend solely on target vertex risk (1..9), and Dial's pops in
  // non-decreasing distance order; the first discovery of nextIdx is strictly optimal.
  if (state.dist[nextIdx] !== UNVISITED) return;
  const nextDist = currentDist + state.map.riskLevels[nextIdx]!;
  state.dist[nextIdx] = nextDist;
  state.parent[nextIdx] = u;
  state.buckets[nextDist % BUCKET_COUNT]!.push(nextIdx);
  state.pending += 1;
}

function relaxNeighbors(state: SearchState, u: number, currentDist: number): void {
  const { rows, cols } = state.map;
  const row = Math.floor(u / cols);
  const col = u % cols;
  if (row > 0) relaxNeighbor(state, u, currentDist, u - cols);
  if (row + 1 < rows) relaxNeighbor(state, u, currentDist, u + cols);
  if (col > 0) relaxNeighbor(state, u, currentDist, u - 1);
  if (col + 1 < cols) relaxNeighbor(state, u, currentDist, u + 1);
}

function reconstructPath(parent: Int32Array, goalIndex: number): readonly number[] {
  const reversed: number[] = [];
  let cur = goalIndex;
  while (cur !== UNVISITED) {
    reversed.push(cur);
    cur = parent[cur]!;
  }
  reversed.reverse();
  return Object.freeze(reversed);
}

/** Immutable shortest-path and full distance-field result over a `CavernMap`. */
export class CavernPathResult {
  readonly map: CavernMap;
  readonly maxDistance: number;
  readonly pathIndices: readonly number[];
  private readonly dists: Int32Array;

  constructor(
    map: CavernMap,
    maxDistance: number,
    pathIndices: readonly number[],
    dists: Int32Array,
  ) {
    this.map = map;
    this.maxDistance = maxDistance;
    this.pathIndices = pathIndices;
    this.dists = dists;
    Object.freeze(this);
  }

  get distances(): ArrayLike<number> {
    return this.dists;
  }

  get totalRisk(): number {
    return this.dists[this.map.goalIndex]!;
  }

  get pathLength(): number {
    return this.pathIndices.length;
  }

  get stepCount(): number {
    return this.pathIndices.length - 1;
  }

  distanceAt(row: number, col: number): number {
    return this.dists[this.map.indexOf(row, col)]!;
  }
}

/** Computes all-cell minimum risk distances and optimal path via 10-bucket Dial's Dijkstra. */
export function findLowestRiskPath(map: CavernMap): CavernPathResult {
  const count = map.cellCount;
  const dist = new Int32Array(count).fill(UNVISITED);
  const parent = new Int32Array(count).fill(UNVISITED);
  const buckets = createBuckets();
  dist[map.startIndex] = 0;
  buckets[0]!.push(map.startIndex);
  const state: SearchState = { map, dist, parent, buckets, pending: 1 };
  let currentDist = 0;

  while (state.pending > 0) {
    while (buckets[currentDist % BUCKET_COUNT]!.length === 0) {
      currentDist += 1;
    }
    const u = buckets[currentDist % BUCKET_COUNT]!.pop()!;
    state.pending -= 1;
    relaxNeighbors(state, u, currentDist);
  }

  const path = reconstructPath(parent, map.goalIndex);
  return new CavernPathResult(map, currentDist, path, dist);
}
