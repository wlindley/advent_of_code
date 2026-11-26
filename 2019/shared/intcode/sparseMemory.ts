import type { MemoryAccess } from './memory';

/** Non-zero cell stored beyond the initial Intcode program tape. */
export interface SparseMemoryEntry {
  readonly address: bigint;
  readonly value: bigint;
}

/** Mutable Intcode memory supporting sparse BigInt high-address reads and writes. */
export interface SparseMemoryAccess extends MemoryAccess {
  readonly sparseEntryCount: number;
  snapshotSparseEntries(): readonly SparseMemoryEntry[];
}

function assertNonNegativeAddress(address: bigint): void {
  if (address < 0n) {
    throw new RangeError(`Memory address cannot be negative: ${address}`);
  }
}

function compareEntriesByAddress(a: SparseMemoryEntry, b: SparseMemoryEntry): number {
  return a.address < b.address ? -1 : 1;
}

/** Hybrid dense-base + sparse-Map Intcode memory with BigInt addressing and zero-elision. */
export class SparseIntcodeMemory implements SparseMemoryAccess {
  private readonly baseCells: bigint[];
  private readonly baseLengthBigInt: bigint;
  private readonly sparse = new Map<bigint, bigint>();

  constructor(initialCells: readonly bigint[]) {
    if (initialCells.length < 1) {
      throw new RangeError('Intcode memory must contain at least one cell');
    }
    this.baseCells = [...initialCells];
    this.baseLengthBigInt = BigInt(initialCells.length);
  }

  get size(): number {
    return this.baseCells.length;
  }

  get sparseEntryCount(): number {
    return this.sparse.size;
  }

  read(address: bigint): bigint {
    assertNonNegativeAddress(address);
    if (address < this.baseLengthBigInt) {
      return this.baseCells[Number(address)]!;
    }
    const value = this.sparse.get(address);
    return value === undefined ? 0n : value;
  }

  write(address: bigint, value: bigint): void {
    assertNonNegativeAddress(address);
    if (address < this.baseLengthBigInt) {
      this.baseCells[Number(address)] = value;
      return;
    }
    if (value === 0n) {
      this.sparse.delete(address);
      return;
    }
    this.sparse.set(address, value);
  }

  snapshot(): readonly bigint[] {
    return Object.freeze([...this.baseCells]);
  }

  snapshotSparseEntries(): readonly SparseMemoryEntry[] {
    const entries: SparseMemoryEntry[] = [];
    for (const [address, value] of this.sparse.entries()) {
      entries.push(Object.freeze({ address, value }));
    }
    entries.sort(compareEntriesByAddress);
    return Object.freeze(entries);
  }
}
