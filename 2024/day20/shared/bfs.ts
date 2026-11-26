import { DIRS_4 } from '../../../shared/core';
import { type Racetrack, UNREACHABLE } from './model';

/** Immutable pair of shortest-path distance fields from `S` and `E` on a `Racetrack`. */
export class DistanceField {
  readonly racetrack: Racetrack;
  private readonly distFromStart: Int32Array;
  private readonly distFromEnd: Int32Array;
  private readonly reachableOrder: Int32Array;

  constructor(
    racetrack: Racetrack,
    distFromStart: Int32Array,
    distFromEnd: Int32Array,
    reachableOrder: Int32Array,
  ) {
    if (distFromStart.length !== racetrack.cellCount || distFromEnd.length !== racetrack.cellCount) {
      throw new RangeError(`Distance arrays must match cellCount ${racetrack.cellCount}`);
    }
    this.racetrack = racetrack;
    this.distFromStart = distFromStart.slice();
    this.distFromEnd = distFromEnd.slice();
    this.reachableOrder = reachableOrder.slice();
    Object.freeze(this);
  }

  get baseline(): number {
    return this.distFromStart[this.racetrack.endIndex]!;
  }

  get reachableCount(): number {
    return this.reachableOrder.length;
  }

  distanceFromStart(row: number, col: number): number {
    return this.distFromStart[this.racetrack.indexOf(row, col)]!;
  }

  distanceFromEnd(row: number, col: number): number {
    return this.distFromEnd[this.racetrack.indexOf(row, col)]!;
  }

  copyDistFromStart(): Int32Array {
    return this.distFromStart.slice();
  }

  copyDistFromEnd(): Int32Array {
    return this.distFromEnd.slice();
  }

  copyReachableCells(): Int32Array {
    return this.reachableOrder.slice();
  }
}

interface BfsResult {
  readonly dist: Int32Array;
  readonly order: Int32Array;
}

function runBfsFrom(racetrack: Racetrack, wallMask: Uint8Array, sourceIndex: number): BfsResult {
  const rows = racetrack.rows;
  const cols = racetrack.cols;
  const dist = new Int32Array(racetrack.cellCount).fill(UNREACHABLE);
  const queue = new Int32Array(racetrack.cellCount);
  dist[sourceIndex] = 0;
  queue[0] = sourceIndex;
  let head = 0;
  let tail = 1;

  while (head < tail) {
    const u = queue[head++]!;
    const nextDist = dist[u]! + 1;
    const c = u % cols;
    const r = (u - c) / cols;
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const v = nr * cols + nc;
      if (wallMask[v]! !== 0 || dist[v]! !== UNREACHABLE) continue;
      dist[v] = nextDist;
      queue[tail++] = v;
    }
  }

  return { dist, order: queue.slice(0, tail) };
}

/** Computes 4-neighbor BFS distances from both `S` and `E` over non-wall cells. */
export function computeBfsDistances(racetrack: Racetrack): DistanceField {
  const wallMask = racetrack.copyWallMask();
  const fromStart = runBfsFrom(racetrack, wallMask, racetrack.startIndex);
  const fromEnd = runBfsFrom(racetrack, wallMask, racetrack.endIndex);
  return new DistanceField(racetrack, fromStart.dist, fromEnd.dist, fromStart.order);
}
