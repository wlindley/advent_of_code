import { DIRS_4 } from '../../../shared/core';
import type { HeightMap } from './heightMap';
import type { StartCondition } from './startCondition';

const EMPTY_PATH: readonly number[] = Object.freeze([]);

function validateFieldArrays(
  distances: Int32Array,
  nextTowardsGoal: Int32Array,
  visitOrder: Int32Array,
): void {
  if (distances.length === 0) {
    throw new RangeError('ReverseBfsField distances cannot be empty');
  }
  if (nextTowardsGoal.length !== distances.length) {
    throw new RangeError(
      `nextTowardsGoal length ${nextTowardsGoal.length} must match distances length ${distances.length}`,
    );
  }
  if (visitOrder.length === 0 || visitOrder.length > distances.length) {
    throw new RangeError(`visitOrder length ${visitOrder.length} out of bounds for ${distances.length} cells`);
  }
  for (let i = 0; i < visitOrder.length; i += 1) {
    const idx = visitOrder[i]!;
    if (idx < 0 || idx >= distances.length || distances[idx]! < 0) {
      throw new RangeError(`Invalid visitOrder entry ${idx} at position ${i}`);
    }
  }
}

/** Immutable reverse-BFS distance and predecessor field rooted at the goal cell `E`. */
export class ReverseBfsField {
  private readonly distances: Int32Array;
  private readonly nextTowardsGoal: Int32Array;
  private readonly visitOrder: Int32Array;

  constructor(distances: Int32Array, nextTowardsGoal: Int32Array, visitOrder: Int32Array) {
    validateFieldArrays(distances, nextTowardsGoal, visitOrder);
    this.distances = new Int32Array(distances);
    this.nextTowardsGoal = new Int32Array(nextTowardsGoal);
    this.visitOrder = new Int32Array(visitOrder);
    Object.freeze(this);
  }

  get cellCount(): number {
    return this.distances.length;
  }

  get reachableCount(): number {
    return this.visitOrder.length;
  }

  get maxReachableDistance(): number {
    return this.distances[this.visitOrder[this.visitOrder.length - 1]!]!;
  }

  distanceAt(index: number): number | null {
    this.assertIndex(index);
    const d = this.distances[index]!;
    return d < 0 ? null : d;
  }

  nextStepFrom(index: number): number | null {
    this.assertIndex(index);
    const next = this.nextTowardsGoal[index]!;
    return next < 0 ? null : next;
  }

  countByDistance(): readonly number[] {
    const counts = new Array<number>(this.maxReachableDistance + 1).fill(0);
    for (let i = 0; i < this.visitOrder.length; i += 1) {
      const d = this.distances[this.visitOrder[i]!]!;
      counts[d]! += 1;
    }
    return Object.freeze(counts);
  }

  findNearestStart(map: HeightMap, condition: StartCondition): number | null {
    if (map.size !== this.cellCount) {
      throw new RangeError(`HeightMap size ${map.size} does not match field size ${this.cellCount}`);
    }
    for (let i = 0; i < this.visitOrder.length; i += 1) {
      const idx = this.visitOrder[i]!;
      if (condition.matches(map, idx)) return idx;
    }
    return null;
  }

  reconstructPath(startIndex: number): readonly number[] {
    if (this.distanceAt(startIndex) === null) return EMPTY_PATH;
    const path: number[] = [];
    let curr = startIndex;
    while (curr !== -1) {
      path.push(curr);
      curr = this.nextTowardsGoal[curr]!;
    }
    return Object.freeze(path);
  }

  private assertIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.cellCount) {
      throw new RangeError(`Field index ${index} out of bounds for size ${this.cellCount}`);
    }
  }
}

/** Computes reverse shortest-path distances from `map.goalIndex` via 4-neighbor BFS. */
export function computeReverseBfs(map: HeightMap): ReverseBfsField {
  const distances = new Int32Array(map.size).fill(-1);
  const nextTowardsGoal = new Int32Array(map.size).fill(-1);
  const queue = new Int32Array(map.size);
  distances[map.goalIndex] = 0;
  queue[0] = map.goalIndex;
  let head = 0;
  let tail = 1;
  while (head < tail) {
    const curr = queue[head++]!;
    const [r, c] = map.coordsOf(curr);
    const minNeighborHeight = map.heightAtIndex(curr) - 1;
    const nextDist = distances[curr]! + 1;
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      if (!map.inBounds(nr, nc)) continue;
      const nIdx = nr * map.cols + nc;
      if (distances[nIdx] !== -1 || map.heightAtIndex(nIdx) < minNeighborHeight) continue;
      distances[nIdx] = nextDist;
      nextTowardsGoal[nIdx] = curr;
      queue[tail++] = nIdx;
    }
  }
  return new ReverseBfsField(distances, nextTowardsGoal, queue.subarray(0, tail));
}
