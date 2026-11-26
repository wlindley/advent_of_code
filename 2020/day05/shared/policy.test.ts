import { describe, expect, it } from 'vitest';
import { CabinOccupancy } from './occupancy';
import {
  HIGHEST_SEAT_POLICY,
  HighestSeatPolicy,
  MISSING_INTERIOR_SEAT_POLICY,
  MissingInteriorSeatPolicy,
  SeatQueryResult,
} from './policy';
import { BoardingPass, parseBoardingManifest } from './seat';

describe('seat query policies', () => {
  it('constructs frozen SeatQueryResult with derived seatId', () => {
    const pass = new BoardingPass(820);
    const result = new SeatQueryResult('highest-seat', 'Highest Seat ID', pass, 'Max seat');
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.seat).toBe(pass);
    expect(result.seatId).toBe(820);
    expect(result.policyId).toBe('highest-seat');
    expect(result.policyLabel).toBe('Highest Seat ID');
    expect(result.detail).toBe('Max seat');
  });

  it('HighestSeatPolicy selects the maximum occupied seat and rejects empty occupancy', () => {
    const manifest = parseBoardingManifest('FBFBBFFRLR\nBFFFBBFRRR\nFFFBBBFRRR\nBBFFBBFRLL');
    const occupancy = CabinOccupancy.fromManifest(manifest);
    const result = HIGHEST_SEAT_POLICY.query(occupancy);

    expect(Object.isFrozen(HIGHEST_SEAT_POLICY)).toBe(true);
    expect(HIGHEST_SEAT_POLICY).toBeInstanceOf(HighestSeatPolicy);
    expect(result.policyId).toBe('highest-seat');
    expect(result.seatId).toBe(820);
    expect(result.seat.code).toBe('BBFFBBFRLL');
    expect(() => HIGHEST_SEAT_POLICY.query(new CabinOccupancy([]))).toThrow(RangeError);
  });

  it('MissingInteriorSeatPolicy selects the unique interior gap and rejects 0 or >=2 gaps', () => {
    const unique = new CabinOccupancy([40, 41, 43, 44].map((id) => new BoardingPass(id)));
    const result = MISSING_INTERIOR_SEAT_POLICY.query(unique);

    expect(Object.isFrozen(MISSING_INTERIOR_SEAT_POLICY)).toBe(true);
    expect(MISSING_INTERIOR_SEAT_POLICY).toBeInstanceOf(MissingInteriorSeatPolicy);
    expect(result.policyId).toBe('missing-interior-seat');
    expect(result.seatId).toBe(42);

    const noGap = new CabinOccupancy([40, 41, 42].map((id) => new BoardingPass(id)));
    const twoGaps = new CabinOccupancy([40, 42, 44].map((id) => new BoardingPass(id)));
    expect(() => MISSING_INTERIOR_SEAT_POLICY.query(noGap)).toThrow(RangeError);
    expect(() => MISSING_INTERIOR_SEAT_POLICY.query(twoGaps)).toThrow(RangeError);
  });
});
