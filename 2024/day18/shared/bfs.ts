import { DIRS_4 } from '../../../shared/core';
import { type ByteCoord, type MemorySpace, UNVISITED, assertNonNegativeInt } from './model';

/** Clamps a requested fallen-byte count to `[0, memory.byteCount]` after validating it. */
export function clampFallenCount(memory: MemorySpace, fallenCount: number): number {
  assertNonNegativeInt(fallenCount, 'fallenCount');
  return Math.min(fallenCount, memory.byteCount);
}

/** Immutable shortest-path and BFS wave distance result for a memory grid state. */
export class ShortestPathResult {
  readonly memory: MemorySpace;
  readonly fallenCount: number;
  readonly path: readonly ByteCoord[];
  private readonly distances: Int32Array;

  constructor(memory: MemorySpace, fallenCount: number, distances: Int32Array, path: readonly ByteCoord[]) {
    this.memory = memory;
    this.fallenCount = fallenCount;
    this.distances = distances;
    this.path = Object.freeze(path.slice());
    Object.freeze(this);
  }

  get reachable(): boolean { return this.path.length > 0; }
  get distance(): number | null { return this.path.length > 0 ? this.path.length - 1 : null; }

  get visitedCount(): number {
    let count = 0;
    for (let i = 0; i < this.distances.length; i += 1) {
      if (this.distances[i]! !== UNVISITED) count += 1;
    }
    return count;
  }

  get maxDistance(): number {
    let max = -1;
    for (let i = 0; i < this.distances.length; i += 1) {
      const dist = this.distances[i]!;
      if (dist > max) max = dist;
    }
    return max;
  }

  distanceAt(x: number, y: number): number {
    return this.distances[this.memory.cellIndex(x, y)]!;
  }

  copyDistances(): Int32Array {
    return this.distances.slice();
  }
}

function reconstructPath(
  memory: MemorySpace,
  parent: Int32Array,
  distances: Int32Array,
  goalIdx: number,
): readonly ByteCoord[] {
  if (distances[goalIdx]! === UNVISITED) return [];
  const indices: number[] = [];
  for (let curr = goalIdx; curr !== UNVISITED; curr = parent[curr]!) {
    indices.push(curr);
  }
  indices.reverse();
  return indices.map((idx) => memory.coordOf(idx));
}

function runBfs(
  size: number,
  applied: number,
  goalIdx: number,
  firstFall: Int32Array,
  distances: Int32Array,
  parent: Int32Array,
): void {
  const queue = new Int32Array(size * size);
  let head = 0;
  let tail = 0;
  distances[0] = 0;
  queue[tail++] = 0;

  while (head < tail) {
    const curr = queue[head++]!;
    if (curr === goalIdx) break;
    const nextDist = distances[curr]! + 1;
    const x = curr % size;
    const y = (curr - x) / size;

    for (const [dy, dx] of DIRS_4) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
      const next = ny * size + nx;
      if (firstFall[next]! < applied || distances[next]! !== UNVISITED) continue;
      distances[next] = nextDist;
      parent[next] = curr;
      queue[tail++] = next;
    }
  }
}

/** Runs flat 4-neighbor BFS from `(0, 0)` to `(S - 1, S - 1)` after `fallenCount` bytes fall. */
export function findShortestPath(memory: MemorySpace, fallenCount: number): ShortestPathResult {
  const applied = clampFallenCount(memory, fallenCount);
  const cellCount = memory.cellCount;
  const goalIdx = cellCount - 1;
  const firstFall = memory.copyFirstFallIndices();
  const distances = new Int32Array(cellCount).fill(UNVISITED);
  if (firstFall[0]! < applied || firstFall[goalIdx]! < applied) {
    return new ShortestPathResult(memory, applied, distances, []);
  }
  const parent = new Int32Array(cellCount).fill(UNVISITED);
  runBfs(memory.gridSize, applied, goalIdx, firstFall, distances, parent);
  return new ShortestPathResult(memory, applied, distances, reconstructPath(memory, parent, distances, goalIdx));
}
