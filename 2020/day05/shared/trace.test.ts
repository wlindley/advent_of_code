import { describe, expect, it } from 'vitest';
import { BspStep } from './bsp';
import { HIGHEST_SEAT_POLICY, MISSING_INTERIOR_SEAT_POLICY, SeatQueryResult } from './policy';
import { BoardingPass, parseBoardingManifest } from './seat';
import { BoardingTraceFrame, DEFAULT_MAX_TRACE_STEPS, traceBoardingManifest } from './trace';

describe('boarding trace generation', () => {
  it('emits scan frames followed by all 11 BSP frames when budget exceeds 11', () => {
    const manifest = parseBoardingManifest('FBFBBFFRLR\nBFFFBBFRRR\nFFFBBBFRRR\nBBFFBBFRLL');
    const frames = traceBoardingManifest(manifest, HIGHEST_SEAT_POLICY);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(60);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(15);

    const scanFrames = frames.slice(0, 4);
    expect(scanFrames.every((f) => f.phase === 'scan' && f.bspStep === null)).toBe(true);
    expect(scanFrames.map((f) => [f.scannedCount, f.runningMinSeatId, f.runningMaxSeatId])).toEqual([
      [1, 357, 357],
      [2, 357, 567],
      [3, 119, 567],
      [4, 119, 820],
    ]);
    expect(scanFrames[0]?.totalPasses).toBe(4);
    expect(scanFrames[0]?.activePass.seatId).toBe(357);
    expect(scanFrames[0]?.result.seatId).toBe(820);

    const bspFrames = frames.slice(4);
    expect(bspFrames).toHaveLength(11);
    expect(bspFrames.every((f) => f.phase === 'bsp' && f.scannedCount === 4)).toBe(true);
    expect(bspFrames[0]?.activePass.seatId).toBe(820);
    expect(bspFrames[10]?.bspStep?.candidateSeatCount).toBe(1);
  });

  it('downsamples scan phase cleanly and handles budgets <= 11', () => {
    const codes = Array.from({ length: 30 }, (_, i) => new BoardingPass(100 + i).code).join('\n');
    const manifest = parseBoardingManifest(codes);

    const capped20 = traceBoardingManifest(manifest, HIGHEST_SEAT_POLICY, 20);
    expect(capped20).toHaveLength(20);
    expect(capped20.slice(0, 9).every((f) => f.phase === 'scan')).toBe(true);
    expect(capped20.slice(9).every((f) => f.phase === 'bsp')).toBe(true);
    expect(capped20[8]?.scannedCount).toBe(30);

    const capped5 = traceBoardingManifest(manifest, HIGHEST_SEAT_POLICY, 5);
    expect(capped5).toHaveLength(5);
    expect(capped5.every((f) => f.phase === 'bsp')).toBe(true);
    expect(capped5[0]?.bspStep?.stepIndex).toBe(0);
    expect(capped5[4]?.bspStep?.stepIndex).toBe(10);

    const capped1 = traceBoardingManifest(manifest, HIGHEST_SEAT_POLICY, 1);
    expect(capped1).toHaveLength(1);
    expect(capped1[0]?.bspStep?.stepIndex).toBe(10);
  });

  it('supports MissingInteriorSeatPolicy and validates trace budget & frame invariants', () => {
    const manifest = parseBoardingManifest(
      [50, 51, 53, 54].map((id) => new BoardingPass(id).code).join('\n'),
    );
    const frames = traceBoardingManifest(manifest, MISSING_INTERIOR_SEAT_POLICY, 12);
    expect(frames).toHaveLength(12);
    expect(frames[11]?.result.seatId).toBe(52);
    expect(frames[11]?.activePass.seatId).toBe(52);

    expect(() => traceBoardingManifest(manifest, HIGHEST_SEAT_POLICY, 0)).toThrow(RangeError);
    expect(() => traceBoardingManifest(manifest, HIGHEST_SEAT_POLICY, 1.5)).toThrow(RangeError);

    const pass = new BoardingPass(10);
    const result = new SeatQueryResult('highest-seat', 'Highest Seat ID', pass, 'detail');
    const step = new BspStep(0, 0, 127, 0, 7, null);
    expect(() => new BoardingTraceFrame(1, 0, pass, 10, 10, result, null)).toThrow(RangeError);
    expect(() => new BoardingTraceFrame(0, 2, pass, 10, 10, result, null)).toThrow(RangeError);
    expect(() => new BoardingTraceFrame(3, 2, pass, 10, 10, result, null)).toThrow(RangeError);
    expect(() => new BoardingTraceFrame(1.5, 2, pass, 10, 10, result, null)).toThrow(RangeError);
    expect(() => new BoardingTraceFrame(1, 2.5, pass, 10, 10, result, null)).toThrow(RangeError);
    expect(() => new BoardingTraceFrame(1, 2, pass, 20, 10, result, null)).toThrow(RangeError);
    expect(() => new BoardingTraceFrame(1, 2, pass, 10, 10, result, step)).toThrow(RangeError);
  });
});
