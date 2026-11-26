import { describe, expect, it } from 'vitest';
import { CabinOccupancy } from './occupancy';
import { BoardingPass, parseBoardingManifest } from './seat';

describe('CabinOccupancy', () => {
  it('supports an empty pass list with null min/max and zero occupied seats', () => {
    const occupancy = new CabinOccupancy([]);
    expect(Object.isFrozen(occupancy)).toBe(true);
    expect(occupancy.occupiedCount).toBe(0);
    expect(occupancy.minSeatId).toBeNull();
    expect(occupancy.maxSeatId).toBeNull();
    expect(occupancy.occupiedSeatIds).toEqual([]);
    expect(occupancy.missingInteriorSeatIds).toEqual([]);
    expect(occupancy.isOccupied(0)).toBe(false);
    expect(() => occupancy.isOccupied(-1)).toThrow(RangeError);
    expect(() => occupancy.isOccupied(1024)).toThrow(RangeError);
  });

  it('tracks occupied seats, deduplicates repeated passes, and computes min/max from manifest', () => {
    const manifest = parseBoardingManifest('BFFFBBFRRR\nFFFBBBFRRR\nBBFFBBFRLL\nBFFFBBFRRR');
    const occupancy = CabinOccupancy.fromManifest(manifest);

    expect(occupancy.occupiedCount).toBe(3);
    expect(occupancy.minSeatId).toBe(119);
    expect(occupancy.maxSeatId).toBe(820);
    expect(occupancy.occupiedSeatIds).toEqual([119, 567, 820]);
    expect(Object.isFrozen(occupancy.occupiedSeatIds)).toBe(true);
    expect(occupancy.isOccupied(567)).toBe(true);
    expect(occupancy.isOccupied(568)).toBe(false);
  });

  it('detects single and multiple missing interior seats with occupied neighbors', () => {
    const passes = [10, 11, 13, 14, 16].map((id) => new BoardingPass(id));
    const occupancy = new CabinOccupancy(passes);

    expect(occupancy.missingInteriorSeatIds).toEqual([12, 15]);
    expect(Object.isFrozen(occupancy.missingInteriorSeatIds)).toBe(true);
  });

  it('does not treat boundary seats 0 or 1023 as interior gaps', () => {
    const passes = [1, 1022].map((id) => new BoardingPass(id));
    const occupancy = new CabinOccupancy(passes);
    expect(occupancy.missingInteriorSeatIds).toEqual([]);
  });
});
