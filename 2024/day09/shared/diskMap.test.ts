import { describe, expect, it } from 'vitest';
import {
  DiskMap,
  FREE_BLOCK,
  FileExtent,
  FreeSpan,
  extentChecksum,
  parseDiskMap,
} from './diskMap';

describe('extentChecksum', () => {
  it('computes exact arithmetic-series checksums including bigints and zero length', () => {
    expect(extentChecksum(0, 0, 5)).toBe(0n);
    expect(extentChecksum(3, 4, 0)).toBe(0n);
    expect(extentChecksum(2, 3, 4)).toBe(2n * (3n + 4n + 5n + 6n));
    expect(extentChecksum(9, 100_000, 5)).toBe(9n * (500_000n + 10n));
  });

  it('rejects negative or non-integer inputs', () => {
    expect(() => extentChecksum(-1, 0, 1)).toThrow(RangeError);
    expect(() => extentChecksum(0, -1, 1)).toThrow(RangeError);
    expect(() => extentChecksum(0, 0, -1)).toThrow(RangeError);
    expect(() => extentChecksum(1.5, 0, 1)).toThrow(RangeError);
  });
});

describe('FileExtent & FreeSpan', () => {
  it('constructs frozen extents with derived end and checksum', () => {
    const f = new FileExtent(2, 5, 3);
    expect(Object.isFrozen(f)).toBe(true);
    expect(f.end).toBe(8);
    expect(f.checksum).toBe(2n * (5n + 6n + 7n));

    const zero = new FileExtent(1, 5, 0);
    expect(zero.end).toBe(5);
    expect(zero.checksum).toBe(0n);

    const span = new FreeSpan(2, 4);
    expect(Object.isFrozen(span)).toBe(true);
    expect(span.end).toBe(6);
  });

  it('validates FreeSpan length >= 1 and non-negative bounds', () => {
    expect(() => new FileExtent(-1, 0, 1)).toThrow(RangeError);
    expect(() => new FreeSpan(0, 0)).toThrow(RangeError);
    expect(() => new FreeSpan(-1, 2)).toThrow(RangeError);
  });
});

describe('DiskMap & parseDiskMap', () => {
  it('parses dense disk maps including zero-length files and spans', () => {
    const disk = parseDiskMap('  12345 \n');
    expect(Object.isFrozen(disk)).toBe(true);
    expect(disk.fileCount).toBe(3);
    expect(disk.totalFileBlocks).toBe(9);
    expect(disk.totalFreeBlocks).toBe(6);
    expect(disk.totalBlocks).toBe(15);
    expect(disk.freeSpans.map((s) => [s.start, s.length])).toEqual([
      [1, 2],
      [6, 4],
    ]);
    expect(Array.from(disk.expandToBlocks())).toEqual([
      0, FREE_BLOCK, FREE_BLOCK, 1, 1, 1, FREE_BLOCK, FREE_BLOCK, FREE_BLOCK, FREE_BLOCK, 2, 2, 2, 2, 2,
    ]);
    expect(disk.initialChecksum).toBe(1n * (3n + 4n + 5n) + 2n * (10n + 11n + 12n + 13n + 14n));
  });

  it('preserves zero-length file IDs and handles zero-length free spans', () => {
    const disk = parseDiskMap('20302');
    expect(disk.fileCount).toBe(3);
    expect(disk.freeSpans).toHaveLength(0);
    expect(disk.files.map((f) => [f.id, f.start, f.length])).toEqual([
      [0, 0, 2],
      [1, 2, 3],
      [2, 5, 2],
    ]);

    const withZeroFile = parseDiskMap('03025');
    expect(withZeroFile.files.map((f) => [f.id, f.start, f.length])).toEqual([
      [0, 0, 0],
      [1, 3, 0],
      [2, 5, 5],
    ]);
    expect(withZeroFile.freeSpans.map((s) => [s.start, s.length])).toEqual([
      [0, 3],
      [3, 2],
    ]);
    expect(withZeroFile.totalBlocks).toBe(10);
  });

  it('validates DiskMap invariants and rejects invalid inputs', () => {
    expect(() => parseDiskMap('')).toThrow();
    expect(() => parseDiskMap('  \n ')).toThrow();
    expect(() => parseDiskMap('12a4')).toThrow();
    expect(() => new DiskMap([], [])).toThrow(RangeError);
    expect(() => new DiskMap([new FileExtent(1, 0, 2)], [])).toThrow(RangeError);
    expect(
      () => new DiskMap([new FileExtent(0, 0, 2), new FileExtent(1, 3, 1)], []),
    ).toThrow(RangeError);
    expect(
      () => new DiskMap([new FileExtent(0, 0, 2)], [new FreeSpan(1, 2)]),
    ).toThrow(RangeError);
  });
});
