import { describe, expect, it } from 'vitest';
import { DisjointSet } from './disjointSet';

describe('DisjointSet', () => {
  it('supports an empty universe of size 0', () => {
    const ds = new DisjointSet(0);
    expect(ds.size).toBe(0);
    expect(ds.componentCount).toBe(0);
    expect(ds.componentSizes()).toEqual([]);
    expect(() => ds.find(0)).toThrow(RangeError);
  });

  it('rejects invalid constructor counts', () => {
    for (const bad of [-1, 1.5, Number.NaN, Infinity, 0x80000000]) {
      expect(() => new DisjointSet(bad)).toThrow(RangeError);
    }
  });

  it('rejects out-of-range or non-integer indices on find, union, connected, sizeOf', () => {
    const ds = new DisjointSet(3);
    for (const bad of [-1, 3, 1.2, Number.NaN]) {
      expect(() => ds.find(bad)).toThrow(RangeError);
      expect(() => ds.sizeOf(bad)).toThrow(RangeError);
      expect(() => ds.connected(0, bad)).toThrow(RangeError);
      expect(() => ds.union(bad, 1)).toThrow(RangeError);
    }
  });

  it('merges components symmetrically by size and handles redundant/self unions', () => {
    const ds = new DisjointSet(6);
    expect(ds.size).toBe(6);
    expect(ds.componentCount).toBe(6);

    // Equal-size union: 0 + 1 -> size 2; 2 + 3 -> size 2; 4 + 5 -> size 2
    expect(ds.union(0, 1)).toBe(true);
    expect(ds.union(2, 3)).toBe(true);
    expect(ds.sizeOf(0)).toBe(2);
    expect(ds.connected(0, 1)).toBe(true);
    expect(ds.connected(0, 2)).toBe(false);

    // Redundant & self unions return false without changing componentCount
    expect(ds.union(0, 0)).toBe(false);
    expect(ds.union(0, 1)).toBe(false);
    expect(ds.componentCount).toBe(4);

    // Union smaller (4, size 1) into larger (0, size 2) -> size 3 (nodes[rootA] < nodes[rootB])
    expect(ds.union(0, 4)).toBe(true);
    expect(ds.sizeOf(4)).toBe(3);

    // Union smaller (2, size 2) into larger (0, size 3) with smaller passed first (nodes[rootA] > nodes[rootB])
    expect(ds.union(2, 1)).toBe(true);
    expect(ds.sizeOf(3)).toBe(5);
    expect(ds.componentCount).toBe(2);
    expect(ds.componentSizes().sort((a, b) => b - a)).toEqual([5, 1]);
  });

  it('compresses multi-hop paths iteratively on find', () => {
    const ds = new DisjointSet(4);
    ds.union(0, 1); // root 0 (size 2), 1 -> 0
    ds.union(2, 3); // root 2 (size 2), 3 -> 2
    ds.union(0, 2); // root 0 (size 4), 2 -> 0, so 3 -> 2 -> 0
    expect(ds.find(3)).toBe(ds.find(0));
    expect(ds.find(3)).toBe(ds.find(1));
    expect(ds.componentCount).toBe(1);
    expect(ds.componentSizes()).toEqual([4]);
  });
});
