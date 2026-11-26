import { describe, expect, it } from 'vitest';
import { SparseIntcodeMemory } from './sparseMemory';

describe('SparseIntcodeMemory', () => {
  it('rejects empty initial memory and negative addresses', () => {
    expect(() => new SparseIntcodeMemory([])).toThrow(RangeError);

    const mem = new SparseIntcodeMemory([10n, 20n]);
    expect(mem.size).toBe(2);
    expect(() => mem.read(-1n)).toThrow(RangeError);
    expect(() => mem.write(-5n, 99n)).toThrow(RangeError);
  });

  it('defensively copies base cells and reads 0n for unwritten sparse addresses', () => {
    const initial = [1n, 2n, 3n];
    const mem = new SparseIntcodeMemory(initial);
    initial[0] = 999n;

    expect(mem.read(0n)).toBe(1n);
    expect(mem.read(2n)).toBe(3n);
    expect(mem.read(3n)).toBe(0n);
    expect(mem.read(10_000_000_000n)).toBe(0n);
    expect(mem.sparseEntryCount).toBe(0);
    expect(mem.snapshotSparseEntries()).toEqual([]);
    expect(Object.isFrozen(mem.snapshotSparseEntries())).toBe(true);
  });

  it('isolates base writes from sparse storage and elides zero sparse writes', () => {
    const mem = new SparseIntcodeMemory([5n, 6n]);
    mem.write(1n, 42n);
    expect(mem.read(1n)).toBe(42n);
    expect(mem.sparseEntryCount).toBe(1 - 1);

    mem.write(200n, 77n);
    mem.write(50n, 11n);
    mem.write(1000n, -9007199254740993n);
    mem.write(50n, 0n);
    mem.write(9999n, 0n);

    expect(mem.read(50n)).toBe(0n);
    expect(mem.read(200n)).toBe(77n);
    expect(mem.read(1000n)).toBe(-9007199254740993n);
    expect(mem.sparseEntryCount).toBe(2);

    const baseSnap = mem.snapshot();
    expect(Object.isFrozen(baseSnap)).toBe(true);
    expect(baseSnap).toEqual([5n, 42n]);

    const sparseSnap = mem.snapshotSparseEntries();
    expect(Object.isFrozen(sparseSnap)).toBe(true);
    expect(sparseSnap).toEqual([
      { address: 200n, value: 77n },
      { address: 1000n, value: -9007199254740993n },
    ]);
    expect(Object.isFrozen(sparseSnap[0])).toBe(true);
  });

  it('sorts sparse entries ascending by BigInt address across arbitrary insertion orders', () => {
    const mem = new SparseIntcodeMemory([0n]);
    mem.write(500n, 1n);
    mem.write(10n, 2n);
    mem.write(300n, 3n);
    mem.write(20n, 4n);

    expect(mem.snapshotSparseEntries()).toEqual([
      { address: 10n, value: 2n },
      { address: 20n, value: 4n },
      { address: 300n, value: 3n },
      { address: 500n, value: 1n },
    ]);
  });
});
