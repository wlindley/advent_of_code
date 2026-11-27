import { DIRS_4 } from '../../../shared/core';
import type { DonutMaze, GridPoint } from './maze';

export interface PortalEdge {
  readonly to: number;
  readonly steps: number;
}

export interface PortalGraph {
  readonly adj: readonly (readonly PortalEdge[])[];
}

function indexCellPortals(maze: DonutMaze): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const portal of maze.portals) {
    const cell = portal.row * maze.cols + portal.col;
    const list = map.get(cell);
    if (list) list.push(portal.id);
    else map.set(cell, [portal.id]);
  }
  return map;
}

function bfsFromPortal(
  maze: DonutMaze,
  sourceId: number,
  cellPortals: Map<number, number[]>,
  seen: Int32Array,
  dist: Int32Array,
): readonly PortalEdge[] {
  const cols = maze.cols;
  const start = maze.portals[sourceId]!;
  const startCell = start.row * cols + start.col;
  const stamp = sourceId + 1;
  const queue = [startCell];
  seen[startCell] = stamp;
  dist[startCell] = 0;
  const edges: PortalEdge[] = [];
  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head]!;
    const d = dist[cell]!;
    const hits = cellPortals.get(cell);
    if (hits) {
      for (const targetId of hits) {
        if (targetId !== sourceId) edges.push(Object.freeze({ to: targetId, steps: d }));
      }
    }
    const r = Math.floor(cell / cols);
    const c = cell % cols;
    for (const [dr, dc] of DIRS_4) {
      const [nr, nc] = [r + dr, c + dc];
      const nCell = nr * cols + nc;
      if (!maze.isOpen(nr, nc) || seen[nCell] === stamp) continue;
      seen[nCell] = stamp;
      dist[nCell] = d + 1;
      queue.push(nCell);
    }
  }
  return Object.freeze(edges);
}

/** Builds an all-pairs shortest-corridor portal graph (walking through intermediate portal tiles). */
export function buildPortalGraph(maze: DonutMaze): PortalGraph {
  const cellPortals = indexCellPortals(maze);
  const size = maze.rows * maze.cols;
  const seen = new Int32Array(size);
  const dist = new Int32Array(size);
  const adj = maze.portals.map((_, id) => bfsFromPortal(maze, id, cellPortals, seen, dist));
  return Object.freeze({ adj: Object.freeze(adj) });
}

function unwindCorridor(parent: Int32Array, goalCell: number, cols: number): readonly GridPoint[] {
  const path: GridPoint[] = [];
  for (let cur = goalCell; cur !== -1; cur = parent[cur]!) {
    path.push(Object.freeze({ row: Math.floor(cur / cols), col: cur % cols }));
  }
  path.reverse();
  return Object.freeze(path);
}

/** Reconstructs a shortest corridor tile path from `from` to `to` (inclusive). */
export function reconstructCorridorPath(maze: DonutMaze, from: GridPoint, to: GridPoint): readonly GridPoint[] {
  if (!maze.isOpen(from.row, from.col) || !maze.isOpen(to.row, to.col)) {
    throw new Error('Corridor endpoints must be open tiles');
  }
  if (from.row === to.row && from.col === to.col) {
    return Object.freeze([Object.freeze({ row: from.row, col: from.col })]);
  }
  const cols = maze.cols;
  const startCell = from.row * cols + from.col;
  const goalCell = to.row * cols + to.col;
  const parent = new Int32Array(maze.rows * cols).fill(-1);
  const seen = new Uint8Array(maze.rows * cols);
  const queue = [startCell];
  seen[startCell] = 1;
  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head]!;
    if (cell === goalCell) return unwindCorridor(parent, goalCell, cols);
    const [r, c] = [Math.floor(cell / cols), cell % cols];
    for (const [dr, dc] of DIRS_4) {
      const [nr, nc] = [r + dr, c + dc];
      const nCell = nr * cols + nc;
      if (!maze.isOpen(nr, nc) || seen[nCell] === 1) continue;
      seen[nCell] = 1;
      parent[nCell] = cell;
      queue.push(nCell);
    }
  }
  throw new Error(`No corridor path from (${from.row}, ${from.col}) to (${to.row}, ${to.col})`);
}
