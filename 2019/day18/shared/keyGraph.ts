import { DIRS_4 } from '../../../shared/core';
import type { GridPoint, VaultMap } from './vaultMap';

/** Directed key-to-key or entrance-to-key traversal edge with door and key prerequisites. */
export interface KeyEdge {
  readonly toKeyId: number;
  readonly toKeyBit: number;
  readonly distance: number;
  readonly doorsMask: number;
  readonly intermediateKeysMask: number;
}

/** Precomputed Pareto-minimal key dependency graph for all vault nodes. */
export interface VaultKeyGraph {
  readonly adjacency: readonly (readonly KeyEdge[])[];
}

interface BfsState {
  readonly visitedDoors: number[][];
  readonly qCell: number[];
  readonly qDist: number[];
  readonly qDoors: number[];
  readonly qKeys: number[];
  readonly edges: KeyEdge[];
}

function isDoorsDominated(seenDoors: readonly number[], nextDoors: number): boolean {
  for (let i = 0; i < seenDoors.length; i += 1) {
    const prev = seenDoors[i]!;
    if ((prev & nextDoors) === prev) return true;
  }
  return false;
}

function enqueueIfNonDominated(
  map: VaultMap,
  bfs: BfsState,
  nextCell: number,
  dist: number,
  doorsMask: number,
  keysMask: number,
): void {
  if (map.isWallCell(nextCell)) return;
  const nextDoors = doorsMask | map.doorBitAtCell(nextCell);
  const seen = bfs.visitedDoors[nextCell]!;
  if (isDoorsDominated(seen, nextDoors)) return;
  seen.push(nextDoors);

  let nextKeys = keysMask;
  const keyId = map.keyIdAtCell(nextCell);
  if (keyId >= 0) {
    const keyBit = map.keyBitById(keyId);
    bfs.edges.push(
      Object.freeze({
        toKeyId: keyId,
        toKeyBit: keyBit,
        distance: dist + 1,
        doorsMask: nextDoors,
        intermediateKeysMask: keysMask,
      }),
    );
    nextKeys |= keyBit;
  }
  bfs.qCell.push(nextCell);
  bfs.qDist.push(dist + 1);
  bfs.qDoors.push(nextDoors);
  bfs.qKeys.push(nextKeys);
}

function collectNodeEdges(map: VaultMap, fromNode: number): readonly KeyEdge[] {
  const startCell = map.nodeCell(fromNode);
  const visitedDoors: number[][] = Array.from({ length: map.rows * map.cols }, () => []);
  visitedDoors[startCell]!.push(0);
  const bfs: BfsState = {
    visitedDoors,
    qCell: [startCell],
    qDist: [0],
    qDoors: [0],
    qKeys: [0],
    edges: [],
  };

  for (let head = 0; head < bfs.qCell.length; head += 1) {
    const cell = bfs.qCell[head]!;
    const row = Math.floor(cell / map.cols);
    const col = cell % map.cols;
    for (const [dr, dc] of DIRS_4) {
      const nr = row + dr;
      const nc = col + dc;
      if (!map.grid.inBounds(nr, nc)) continue;
      enqueueIfNonDominated(map, bfs, nr * map.cols + nc, bfs.qDist[head]!, bfs.qDoors[head]!, bfs.qKeys[head]!);
    }
  }
  return Object.freeze(bfs.edges);
}

/** Builds Pareto-minimal adjacency lists for all key and entrance nodes in `map`. */
export function buildVaultKeyGraph(map: VaultMap): VaultKeyGraph {
  const adjacency: (readonly KeyEdge[])[] = [];
  for (let nodeId = 0; nodeId < map.nodeCount; nodeId += 1) {
    adjacency.push(collectNodeEdges(map, nodeId));
  }
  return Object.freeze({ adjacency: Object.freeze(adjacency) });
}

function unwindPath(map: VaultMap, parent: Int32Array, toCell: number): readonly GridPoint[] {
  const path: GridPoint[] = [];
  let curr = toCell;
  while (curr !== -1) {
    path.push(Object.freeze(map.pointOf(curr)));
    curr = parent[curr]!;
  }
  path.reverse();
  return Object.freeze(path);
}

function canStepIntoCell(
  map: VaultMap,
  cell: number,
  toCell: number,
  heldKeysMask: number,
): boolean {
  if (map.isWallCell(cell)) return false;
  const doorBit = map.doorBitAtCell(cell);
  if (doorBit !== 0 && (doorBit & heldKeysMask) === 0) return false;
  const keyId = map.keyIdAtCell(cell);
  if (keyId >= 0 && cell !== toCell && (map.keyBitById(keyId) & heldKeysMask) === 0) return false;
  return true;
}

/** Reconstructs a shortest unlocked cell path avoiding uncollected intermediate keys. */
export function reconstructSegmentPath(
  map: VaultMap,
  from: GridPoint,
  to: GridPoint,
  heldKeysMask: number,
): readonly GridPoint[] {
  const total = map.rows * map.cols;
  const startCell = map.cellOf(from.row, from.col);
  const toCell = map.cellOf(to.row, to.col);
  const visited = new Uint8Array(total);
  const parent = new Int32Array(total).fill(-1);
  const queue = [startCell];
  visited[startCell] = 1;

  for (let head = 0; head < queue.length; head += 1) {
    const curr = queue[head]!;
    if (curr === toCell) return unwindPath(map, parent, toCell);
    const row = Math.floor(curr / map.cols);
    const col = curr % map.cols;
    for (const [dr, dc] of DIRS_4) {
      const nr = row + dr;
      const nc = col + dc;
      if (!map.grid.inBounds(nr, nc)) continue;
      const next = nr * map.cols + nc;
      if (visited[next] === 1 || !canStepIntoCell(map, next, toCell, heldKeysMask)) continue;
      visited[next] = 1;
      parent[next] = curr;
      queue.push(next);
    }
  }
  throw new Error(`No unlocked path from (${from.row}, ${from.col}) to (${to.row}, ${to.col})`);
}
