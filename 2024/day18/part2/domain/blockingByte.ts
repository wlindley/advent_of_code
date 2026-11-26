import { DIRS_4, DisjointSet } from '../../../../shared/core';
import { type ByteCoord, type MemorySpace, NEVER_CORRUPTED, assertNonNegativeInt } from '../../shared';

/** Immutable result describing the first byte that disconnects `(0, 0)` from `(S - 1, S - 1)`. */
export class BlockingByteResult {
  readonly byte: ByteCoord;
  readonly byteIndex: number;

  constructor(byte: ByteCoord, byteIndex: number) {
    assertNonNegativeInt(byteIndex, 'byteIndex');
    this.byte = Object.freeze({ x: byte.x, y: byte.y });
    this.byteIndex = byteIndex;
    Object.freeze(this);
  }

  get fallenCount(): number {
    return this.byteIndex + 1;
  }

  get coordinate(): string {
    return `${this.byte.x},${this.byte.y}`;
  }
}

function openCell(dsu: DisjointSet, open: Uint8Array, size: number, idx: number): void {
  open[idx] = 1;
  const x = idx % size;
  const y = (idx - x) / size;
  for (const [dy, dx] of DIRS_4) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
    const nIdx = ny * size + nx;
    if (open[nIdx] === 1) dsu.union(idx, nIdx);
  }
}

function isEndpointsConnected(dsu: DisjointSet, open: Uint8Array, goalIdx: number): boolean {
  return open[0] === 1 && open[goalIdx] === 1 && dsu.connected(0, goalIdx);
}

/** Finds the earliest falling byte that disconnects `(0, 0)` from exit via reverse-time DSU. */
export function findBlockingByte(memory: MemorySpace): BlockingByteResult | null {
  const size = memory.gridSize;
  const goalIdx = memory.cellCount - 1;
  const firstFall = memory.copyFirstFallIndices();
  const dsu = new DisjointSet(memory.cellCount);
  const open = new Uint8Array(memory.cellCount);

  for (let idx = 0; idx < memory.cellCount; idx += 1) {
    if (firstFall[idx] === NEVER_CORRUPTED) openCell(dsu, open, size, idx);
  }

  let k = memory.byteCount;
  // At k === 0 every cell in a non-empty grid (S >= 1) is open and connected, guaranteeing termination.
  while (!isEndpointsConnected(dsu, open, goalIdx)) {
    k -= 1;
    const b = memory.bytes[k]!;
    const idx = b.y * size + b.x;
    if (firstFall[idx] === k) openCell(dsu, open, size, idx);
  }

  if (k === memory.byteCount) return null;
  return new BlockingByteResult(memory.bytes[k]!, k);
}

/** Returns the blocking byte or throws if the exit remains reachable after all bytes fall. */
export function requireBlockingByte(memory: MemorySpace): BlockingByteResult {
  const result = findBlockingByte(memory);
  if (!result) {
    throw new Error('Exit remains reachable after all bytes fall');
  }
  return result;
}
