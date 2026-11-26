import { DIRS_4 } from '../../../shared/core';
import type { GardenMap } from './gardenMap';

export const UNREACHABLE_DISTANCE = -1;
export const MAX_INFINITE_BFS_CELLS = 4_000_000;

function assertPositiveSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
}

function assertNonNegativeSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

function tileRadius(steps: number, start: number, span: number): number {
  const margin = Math.min(start, span - 1 - start);
  return steps <= margin ? 0 : Math.ceil((steps - margin) / span);
}

/** Immutable finite-grid shortest-distance map produced by bounded BFS from S. */
export class FiniteDistanceMap {
  readonly width: number;
  readonly height: number;
  readonly maxSteps: number;
  private readonly distances: Int32Array;

  constructor(width: number, height: number, maxSteps: number, distances: Int32Array) {
    assertPositiveSafeInt(width, 'width');
    assertPositiveSafeInt(height, 'height');
    assertNonNegativeSafeInt(maxSteps, 'maxSteps');
    if (distances.length !== width * height) {
      throw new RangeError(`distances length ${distances.length} must equal ${width * height}`);
    }
    this.width = width;
    this.height = height;
    this.maxSteps = maxSteps;
    this.distances = new Int32Array(distances);
    Object.freeze(this);
  }

  distanceAt(row: number, col: number): number {
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= this.height || col < 0 || col >= this.width) {
      throw new RangeError(`Cell (${row}, ${col}) is out of bounds`);
    }
    return this.distances[row * this.width + col]!;
  }

  countReachableAt(step: number): number {
    assertNonNegativeSafeInt(step, 'step');
    if (step > this.maxSteps) {
      throw new RangeError(`step ${step} exceeds maxSteps ${this.maxSteps}`);
    }
    if (step === 0) return 1;
    let hasNeighbor = false;
    let reachable = 0;
    const targetParity = step & 1;
    for (let i = 0; i < this.distances.length; i += 1) {
      const d = this.distances[i]!;
      if (d === 1) hasNeighbor = true;
      if (d >= 0 && d <= step && (d & 1) === targetParity) reachable += 1;
    }
    return hasNeighbor ? reachable : 0;
  }

  distanceHistogram(): readonly number[] {
    const counts = new Array<number>(this.maxSteps + 1).fill(0);
    for (let i = 0; i < this.distances.length; i += 1) {
      const d = this.distances[i]!;
      if (d >= 0 && d <= this.maxSteps) counts[d]! += 1;
    }
    return Object.freeze(counts);
  }
}

/** Computes finite-grid BFS distances from S up to `maxSteps`. */
export function computeFiniteDistances(map: GardenMap, maxSteps: number): FiniteDistanceMap {
  assertNonNegativeSafeInt(maxSteps, 'maxSteps');
  const distances = new Int32Array(map.size).fill(UNREACHABLE_DISTANCE);
  const queue = new Int32Array(map.size);
  const startIdx = map.startRow * map.width + map.startCol;
  distances[startIdx] = 0;
  queue[0] = startIdx;
  let head = 0;
  let tail = 1;
  while (head < tail) {
    const curr = queue[head++]!;
    const dist = distances[curr]!;
    if (dist === maxSteps) continue;
    const row = (curr / map.width) | 0;
    const col = curr - row * map.width;
    for (const [dr, dc] of DIRS_4) {
      const nr = row + dr;
      const nc = col + dc;
      if (!map.inBounds(nr, nc) || map.isRock(nr, nc)) continue;
      const nextIdx = nr * map.width + nc;
      if (distances[nextIdx] !== UNREACHABLE_DISTANCE) continue;
      distances[nextIdx] = dist + 1;
      queue[tail++] = nextIdx;
    }
  }
  return new FiniteDistanceMap(map.width, map.height, maxSteps, distances);
}

/** Counts garden plots reachable in exactly `steps` on the bounded finite grid. */
export function countFiniteReachable(map: GardenMap, steps: number): number {
  return computeFiniteDistances(map, steps).countReachableAt(steps);
}

/** Counts garden plots reachable in exactly `steps` on the infinite tiled grid. */
export function countInfiniteReachable(map: GardenMap, steps: number): number {
  assertNonNegativeSafeInt(steps, 'steps');
  if (steps === 0) return 1;
  const rx = tileRadius(steps, map.startCol, map.width);
  const ry = tileRadius(steps, map.startRow, map.height);
  const totalW = (2 * rx + 1) * map.width;
  const totalCells = (2 * ry + 1) * map.height * totalW;
  if (totalCells > MAX_INFINITE_BFS_CELLS) {
    throw new RangeError(`Infinite BFS grid (${totalCells} cells) exceeds ${MAX_INFINITE_BFS_CELLS}`);
  }
  const startIdx = (ry * map.height + map.startRow) * totalW + (rx * map.width + map.startCol);
  return runBoundedInfiniteBfs(map, steps, totalW, totalCells, startIdx);
}

function runBoundedInfiniteBfs(
  map: GardenMap,
  steps: number,
  totalW: number,
  totalCells: number,
  startIdx: number,
): number {
  const visited = new Uint8Array(totalCells);
  const queue = new Int32Array(totalCells);
  visited[startIdx] = 1;
  queue[0] = startIdx;
  const targetParity = steps & 1;
  let head = 0;
  let tail = 1;
  let reachable = targetParity === 0 ? 1 : 0;
  for (let dist = 0; dist < steps && head < tail; dist += 1) {
    const levelEnd = tail;
    const countParity = ((dist + 1) & 1) === targetParity;
    while (head < levelEnd) {
      const curr = queue[head++]!;
      const row = (curr / totalW) | 0;
      const col = curr - row * totalW;
      for (const [dr, dc] of DIRS_4) {
        const nr = row + dr;
        const nc = col + dc;
        // Why: tileRadius guarantees every neighbor expanded at dist < steps strictly satisfies 0 <= nr < totalH && 0 <= nc < totalW.
        const nIdx = nr * totalW + nc;
        if (visited[nIdx] !== 0 || map.isRock(nr % map.height, nc % map.width)) continue;
        visited[nIdx] = 1;
        queue[tail++] = nIdx;
        if (countParity) reachable += 1;
      }
    }
  }
  return tail <= 1 ? 0 : reachable;
}
