import { StateMinHeap } from './minHeap';
import {
  DIR_EAST, type Direction, oppositeDir, type PathStep, ReindeerMaze,
  STEP_COST, TURN_COST, turnCcw, turnCw,
} from './types';

function assertIndex(idx: number, limit: number, label: string): void {
  if (!Number.isInteger(idx) || idx < 0 || idx >= limit) {
    throw new RangeError(`${label} out of range [0, ${limit - 1}]: ${idx}`);
  }
}

function findOptimalEndState(dist: Float64Array, endCell: number, best: number): number {
  const base = endCell << 2;
  for (let dir = 0; dir < 3; dir += 1) if (dist[base + dir]! === best) return base + dir;
  return base + 3;
}

function findTightPredecessor(maze: ReindeerMaze, dist: Float64Array, state: number): number {
  const cell = state >> 2;
  const dir = (state & 3) as Direction;
  const d = dist[state]!;
  const prevCell = maze.neighborCell(cell, oppositeDir(dir));
  if (prevCell !== -1 && dist[(prevCell << 2) | dir]! + STEP_COST === d) return (prevCell << 2) | dir;
  const cwPrev = (cell << 2) | turnCcw(dir);
  return dist[cwPrev]! + TURN_COST === d ? cwPrev : (cell << 2) | turnCw(dir);
}

/** Immutable shortest-path & optimal-seat analysis over a `ReindeerMaze`. */
export class MazeAnalysis {
  readonly maze: ReindeerMaze;
  private readonly dist: Float64Array;
  private readonly optimalMask: Uint8Array;
  private readonly settledOrder: Int32Array;

  constructor(maze: ReindeerMaze, dist: Float64Array, optimalMask: Uint8Array, settledOrder: Int32Array) {
    this.maze = maze;
    this.dist = dist;
    this.optimalMask = optimalMask;
    this.settledOrder = settledOrder;
    Object.freeze(this);
  }

  get bestScore(): number { return this.minCellDistAt(this.maze.endCell); }
  get isReachable(): boolean { return Number.isFinite(this.bestScore); }
  get settledCount(): number { return this.settledOrder.length; }

  get optimalTileCount(): number {
    let count = 0;
    for (let i = 0; i < this.optimalMask.length; i += 1) if (this.optimalMask[i]! !== 0) count += 1;
    return count;
  }

  settledCellAt(i: number): number {
    assertIndex(i, this.settledOrder.length, 'settled index');
    return this.settledOrder[i]!;
  }

  minCellDistAt(cell: number): number {
    assertIndex(cell, this.maze.cellCount, 'cell');
    const b = cell << 2;
    return Math.min(this.dist[b]!, this.dist[b + 1]!, this.dist[b + 2]!, this.dist[b + 3]!);
  }

  minCellDist(r: number, c: number): number { return this.minCellDistAt(this.maze.cellIndex(r, c)); }
  stateDist(r: number, c: number, dir: Direction): number { return this.dist[(this.maze.cellIndex(r, c) << 2) | dir]!; }
  isOptimalTile(r: number, c: number): boolean { return this.optimalMask[this.maze.cellIndex(r, c)]! !== 0; }

  isOptimalCell(cell: number): boolean {
    assertIndex(cell, this.maze.cellCount, 'cell');
    return this.optimalMask[cell]! !== 0;
  }

  extractCanonicalPath(): readonly PathStep[] {
    if (!this.isReachable) return Object.freeze([]);
    const startState = (this.maze.startCell << 2) | DIR_EAST;
    const steps: PathStep[] = [];
    let state = findOptimalEndState(this.dist, this.maze.endCell, this.bestScore);
    while (true) {
      const cell = state >> 2;
      steps.push(Object.freeze({
        row: this.maze.rowOf(cell), col: this.maze.colOf(cell), dir: (state & 3) as Direction, cost: this.dist[state]!,
      }));
      if (state === startState) break;
      state = findTightPredecessor(this.maze, this.dist, state);
    }
    steps.reverse();
    return Object.freeze(steps);
  }
}

function relaxState(heap: StateMinHeap, dist: Float64Array, nextState: number, nextCost: number): void {
  if (nextCost < dist[nextState]!) { dist[nextState] = nextCost; heap.push(nextState, nextCost); }
}

function enqueueIfTight(
  dist: Float64Array, visited: Uint8Array, queue: Int32Array, tail: number, prev: number, targetCost: number,
): number {
  if (visited[prev]! === 0 && dist[prev]! === targetCost) { visited[prev] = 1; queue[tail] = prev; return tail + 1; }
  return tail;
}

function markOptimalCells(maze: ReindeerMaze, dist: Float64Array, bestScore: number): Uint8Array {
  const optimalMask = new Uint8Array(maze.cellCount);
  if (!Number.isFinite(bestScore)) return optimalMask;
  const visited = new Uint8Array(dist.length);
  const queue = new Int32Array(dist.length);
  let head = 0;
  let tail = 0;
  for (let d = 0; d < 4; d += 1) {
    const s = (maze.endCell << 2) | d;
    if (dist[s]! === bestScore) { visited[s] = 1; queue[tail++] = s; }
  }
  while (head < tail) {
    const state = queue[head++]!;
    const cell = state >> 2;
    optimalMask[cell] = 1;
    const dir = (state & 3) as Direction;
    const d = dist[state]!;
    const prevCell = maze.neighborCell(cell, oppositeDir(dir));
    if (prevCell !== -1) tail = enqueueIfTight(dist, visited, queue, tail, (prevCell << 2) | dir, d - STEP_COST);
    tail = enqueueIfTight(dist, visited, queue, tail, (cell << 2) | turnCcw(dir), d - TURN_COST);
    tail = enqueueIfTight(dist, visited, queue, tail, (cell << 2) | turnCw(dir), d - TURN_COST);
  }
  return optimalMask;
}

/** Runs forward Dijkstra from `(S, East)` and backward tight-edge BFS from `E`. */
export function analyzeReindeerMaze(maze: ReindeerMaze): MazeAnalysis {
  const dist = new Float64Array(maze.cellCount * 4).fill(Infinity);
  const cellSeen = new Uint8Array(maze.cellCount);
  const settledOrder = new Int32Array(maze.cellCount);
  let settledLen = 0;
  const heap = new StateMinHeap();
  const startState = (maze.startCell << 2) | DIR_EAST;
  dist[startState] = 0;
  heap.push(startState, 0);
  let bestScore = Infinity;

  while (heap.size > 0) {
    const cost = heap.topCost;
    if (cost > bestScore) break;
    const state = heap.pop();
    if (cost > dist[state]!) continue;
    const cell = state >> 2;
    if (cellSeen[cell]! === 0) { cellSeen[cell] = 1; settledOrder[settledLen++] = cell; }
    if (cell === maze.endCell && cost < bestScore) bestScore = cost;
    const dir = (state & 3) as Direction;
    const nextCell = maze.neighborCell(cell, dir);
    if (nextCell !== -1) relaxState(heap, dist, (nextCell << 2) | dir, cost + STEP_COST);
    relaxState(heap, dist, (cell << 2) | turnCw(dir), cost + TURN_COST);
    relaxState(heap, dist, (cell << 2) | turnCcw(dir), cost + TURN_COST);
  }
  return new MazeAnalysis(maze, dist, markOptimalCells(maze, dist, bestScore), settledOrder.slice(0, settledLen));
}
