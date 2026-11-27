import { describe, expect, it } from 'vitest';
import { parseSeatingLayout, SeatingLayout } from './layout';

describe('SeatingLayout', () => {
  it('parses floor, empty, and occupied seats with prototype-safe lookups', () => {
    const layout = parseSeatingLayout('L.#\n.#L\r\n');
    expect(layout).toBeInstanceOf(SeatingLayout);
    expect(layout.rows).toBe(2);
    expect(layout.cols).toBe(3);
    expect(layout.totalCells).toBe(6);
    expect(layout.seatCount).toBe(4);
    expect(layout.floorCount).toBe(2);
    expect(layout.initialOccupiedCount).toBe(2);
    expect(layout.seatIndexAt(0, 0)).toBe(0);
    expect(layout.seatIndexAt(0, 1)).toBeNull();
    expect(layout.seatIndexAt(0, 2)).toBe(1);
    expect(layout.seatIndexAt(1, 0)).toBeNull();
    expect(layout.seatIndexAt(1, 1)).toBe(2);
    expect(layout.seatIndexAt(1, 2)).toBe(3);
    expect(layout.coordOf(0)).toEqual({ row: 0, col: 0 });
    expect(layout.coordOf(3)).toEqual({ row: 1, col: 2 });
  });

  it('returns null from seatIndexAt for out-of-bounds and non-integer coordinates', () => {
    const layout = parseSeatingLayout('L#\n.L');
    expect(layout.seatIndexAt(-1, 0)).toBeNull();
    expect(layout.seatIndexAt(0, -1)).toBeNull();
    expect(layout.seatIndexAt(2, 0)).toBeNull();
    expect(layout.seatIndexAt(0, 2)).toBeNull();
    expect(layout.seatIndexAt(0.5, 0)).toBeNull();
    expect(layout.seatIndexAt(0, Number.NaN)).toBeNull();
  });

  it('returns an independent defensive copy from copyInitialOccupancy', () => {
    const layout = parseSeatingLayout('L#');
    const copy = layout.copyInitialOccupancy();
    expect(Array.from(copy)).toEqual([0, 1]);
    copy[0] = 1;
    copy[1] = 0;
    expect(Array.from(layout.copyInitialOccupancy())).toEqual([0, 1]);
    expect(layout.initialOccupiedCount).toBe(1);
  });

  it('handles all-floor layouts with zero seats', () => {
    const layout = parseSeatingLayout('..\n..');
    expect(layout.seatCount).toBe(0);
    expect(layout.floorCount).toBe(4);
    expect(layout.initialOccupiedCount).toBe(0);
    expect(Array.from(layout.copyInitialOccupancy())).toEqual([]);
  });

  it('validates coordOf bounds and rejects invalid input grids', () => {
    const layout = parseSeatingLayout('L.');
    expect(() => layout.coordOf(-1)).toThrow(RangeError);
    expect(() => layout.coordOf(1)).toThrow(RangeError);
    expect(() => layout.coordOf(0.5)).toThrow(RangeError);

    expect(() => parseSeatingLayout('')).toThrow();
    expect(() => parseSeatingLayout('L.\nL')).toThrow();
    expect(() => parseSeatingLayout('LX')).toThrow('Invalid cell character');
    expect(() => parseSeatingLayout('toString')).toThrow('Invalid cell character');
  });
});
