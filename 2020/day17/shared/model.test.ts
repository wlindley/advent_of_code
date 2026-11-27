import { describe, expect, it } from 'vitest';
import { PocketSlice, parsePocketSlice } from './model';

describe('PocketSlice', () => {
  it('stores dimensions, defensively copies cells, freezes wrapper, and computes activeCount', () => {
    const rawCells = new Uint8Array([0, 1, 1, 0, 1, 0]);
    const slice = new PocketSlice(3, 2, rawCells);
    rawCells[0] = 1;
    rawCells[1] = 0;

    expect(Object.isFrozen(slice)).toBe(true);
    expect(slice.width).toBe(3);
    expect(slice.height).toBe(2);
    expect(slice.activeCount).toBe(3);
    expect(slice.isActive(0, 0)).toBe(false);
    expect(slice.isActive(1, 0)).toBe(true);
    expect(slice.isActive(2, 0)).toBe(true);
    expect(slice.isActive(1, 1)).toBe(true);
    expect(slice.isActive(2, 1)).toBe(false);
  });

  it('rejects invalid constructor dimensions or cell counts', () => {
    expect(() => new PocketSlice(0, 1, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new PocketSlice(1.5, 2, new Uint8Array(3))).toThrow(RangeError);
    expect(() => new PocketSlice(1, 0, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new PocketSlice(2, 1.5, new Uint8Array(3))).toThrow(RangeError);
    expect(() => new PocketSlice(2, 2, new Uint8Array(3))).toThrow(RangeError);
  });

  it('rejects out-of-bounds or non-integer coordinates in isActive', () => {
    const slice = new PocketSlice(2, 2, new Uint8Array([1, 0, 0, 1]));
    expect(() => slice.isActive(-1, 0)).toThrow(RangeError);
    expect(() => slice.isActive(2, 0)).toThrow(RangeError);
    expect(() => slice.isActive(0.5, 0)).toThrow(RangeError);
    expect(() => slice.isActive(0, -1)).toThrow(RangeError);
    expect(() => slice.isActive(0, 2)).toThrow(RangeError);
    expect(() => slice.isActive(0, 0.5)).toThrow(RangeError);
  });
});

describe('parsePocketSlice', () => {
  it('parses rectangular #/. grids with CRLF and leading/trailing empty lines', () => {
    const slice = parsePocketSlice('\r\n.#.\r\n..#\r\n###\r\n\r\n');
    expect(slice.width).toBe(3);
    expect(slice.height).toBe(3);
    expect(slice.activeCount).toBe(5);
    expect(slice.isActive(1, 0)).toBe(true);
    expect(slice.isActive(0, 0)).toBe(false);
    expect(slice.isActive(2, 2)).toBe(true);
  });

  it('rejects empty input, spaces-only rows, internal blank lines, jagged rows, and invalid characters', () => {
    expect(() => parsePocketSlice('')).toThrow(Error);
    expect(() => parsePocketSlice('\n\r\n')).toThrow(Error);
    expect(() => parsePocketSlice('   ')).toThrow(Error);
    expect(() => parsePocketSlice('#.\n\n.#')).toThrow(Error);
    expect(() => parsePocketSlice('#.\n#')).toThrow(Error);
    expect(() => parsePocketSlice('#.\n.x')).toThrow(Error);
    expect(() => parsePocketSlice(' .#\n.#.')).toThrow(Error);
  });
});
