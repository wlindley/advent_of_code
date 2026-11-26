import { describe, expect, it } from 'vitest';
import { CARDINAL_DIR, ForestGrid } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, ScenicScanTimeline, ScenicTraceFrame, solver } from './index';

const EXAMPLE = ['30373', '25512', '65332', '33549', '35390'].join('\n');

describe('2022 Day 8 Part 2 — Scenic Score', () => {
  it('solves the official 5x5 example and traces row-major best progression', () => {
    const forest = solver.parse(EXAMPLE);
    expect(solver.solve(forest)).toBe(8);

    const frames = solver.trace(forest);
    expect(frames).toHaveLength(5);
    expect(frames.map((f) => [f.scannedRow, f.bestRow, f.bestCol, f.bestScore, f.improvedOnRow, f.isComplete])).toEqual([
      [0, 0, 0, 0, false, false],
      [1, 1, 2, 4, true, false],
      [2, 2, 1, 6, true, false],
      [3, 3, 2, 8, true, false],
      [4, 3, 2, 8, false, true],
    ]);

    expect(frames[0]!.bestDistances).toEqual([0, 2, 2, 0]);
    expect(frames[3]!.bestHeight).toBe(5);
    expect(frames[3]!.bestDistances).toEqual([2, 2, 1, 2]);
    expect(frames[3]!.forest).toBe(forest);
    expect(frames[3]!.sightlines.scenicScore(3, 2)).toBe(8);
    expect(frames[0]!.totalRawSteps).toBe(5);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.totalSteps).toBe(5);
  });

  it('tracks interior scanned cells and freezes domain objects', () => {
    const forest = solver.parse(EXAMPLE);
    const frames = solver.trace(forest);

    expect(frames[0]!.isInteriorScanned(0, 0)).toBe(false);
    expect(frames[0]!.isInteriorScanned(1, 1)).toBe(false);
    expect(frames[2]!.isInteriorScanned(1, 2)).toBe(true);
    expect(frames[2]!.isInteriorScanned(2, 1)).toBe(true);
    expect(frames[2]!.isInteriorScanned(2, 0)).toBe(false);
    expect(frames[2]!.isInteriorScanned(3, 2)).toBe(false);
    expect(frames[4]!.isInteriorScanned(4, 2)).toBe(false);

    expect(Object.isFrozen(solver)).toBe(true);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(Object.isFrozen(frames[3]!.bestDistances)).toBe(true);
    expect(Object.isFrozen(ScenicScanTimeline.build(forest))).toBe(true);
  });

  it.each(['5', '12345', '1\n2\n3\n4\n5', '12\n34', '12345\n67890', '12\n34\n56\n78\n90', '12\n34\n56'])(
    'returns 0 at (0,0) for perimeter-only grid %j',
    (raw) => {
      const forest = solver.parse(raw);
      expect(solver.solve(forest)).toBe(0);
      const frames = solver.trace(forest);
      const last = frames[frames.length - 1]!;
      expect(last.bestRow).toBe(0);
      expect(last.bestCol).toBe(0);
      expect(last.bestScore).toBe(0);
      expect(last.improvedOnRow).toBe(false);
      expect(last.isComplete).toBe(true);
    },
  );

  it('breaks tied scenic scores in row-major order across uniform and symmetric grids', () => {
    const zeros = solver.parse(['00000', '00000', '00000', '00000', '00000'].join('\n'));
    expect(solver.solve(zeros)).toBe(1);
    const zeroLast = solver.trace(zeros).at(-1)!;
    expect([zeroLast.bestRow, zeroLast.bestCol]).toEqual([1, 1]);

    const fives = solver.parse(['55555', '55555', '55555', '55555', '55555'].join('\n'));
    expect(solver.solve(fives)).toBe(1);
    expect([solver.trace(fives).at(-1)!.bestRow, solver.trace(fives).at(-1)!.bestCol]).toEqual([1, 1]);

    // Symmetric 5x5 where (1,1), (1,3), (3,1), (3,3) all score 1*2*2*1 = 4 (tied maxima > 1).
    const tied = solver.parse(['99999', '95159', '91119', '95159', '99999'].join('\n'));
    expect(solver.solve(tied)).toBe(4);
    const tiedLast = solver.trace(tied).at(-1)!;
    expect([tiedLast.bestRow, tiedLast.bestCol]).toEqual([1, 1]);
  });

  it('bounds trace frames via maxSteps while preserving endpoints', () => {
    const forest = solver.parse(EXAMPLE);
    const single = solver.trace(forest, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.scannedRow).toBe(4);
    expect(single[0]!.isComplete).toBe(true);

    const sampled = solver.trace(forest, { maxSteps: 3 });
    expect(sampled.map((f) => f.scannedRow)).toEqual([0, 2, 4]);
    expect(sampled.map((f) => f.stepIndex)).toEqual([0, 1, 2]);

    const grid99 = ForestGrid.parse(Array.from({ length: 99 }, () => '5'.repeat(99)).join('\n'));
    expect(solver.trace(grid99)).toHaveLength(99);

    const tall = ForestGrid.parse(Array.from({ length: 150 }, () => '12345').join('\n'));
    const capped = solver.trace(tall);
    expect(capped).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(capped[0]!.scannedRow).toBe(0);
    expect(capped.at(-1)!.scannedRow).toBe(149);
    expect(capped.at(-1)!.isComplete).toBe(true);
  });

  it('rejects invalid maxSteps, timeline indices, frame bounds, and out-of-bounds queries', () => {
    const forest = solver.parse(EXAMPLE);
    const timeline = ScenicScanTimeline.build(forest);
    const frame0 = solver.trace(forest)[0]!;

    expect(() => solver.trace(forest, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(forest, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => solver.trace(forest, { maxSteps: 1.5 })).toThrow(RangeError);
    expect(() => solver.trace(forest, { maxSteps: Number.NaN })).toThrow(RangeError);

    expect(() => timeline.bestRowAt(-1)).toThrow(RangeError);
    expect(() => timeline.bestColAt(5)).toThrow(RangeError);
    expect(() => timeline.bestScoreAt(1.5)).toThrow(RangeError);

    expect(() => frame0.isInteriorScanned(-1, 0)).toThrow(RangeError);
    expect(() => frame0.isInteriorScanned(0, -1)).toThrow(RangeError);
    expect(() => frame0.isInteriorScanned(5, 0)).toThrow(RangeError);
    expect(() => frame0.isInteriorScanned(0, 5)).toThrow(RangeError);
    expect(() => frame0.isInteriorScanned(1.5, 0)).toThrow(RangeError);

    expect(() => new ScenicTraceFrame(timeline, -1, 0, 1)).toThrow(RangeError);
    expect(() => new ScenicTraceFrame(timeline, 5, 0, 1)).toThrow(RangeError);
    expect(() => new ScenicTraceFrame(timeline, 0, 0, 0)).toThrow(RangeError);
    expect(() => new ScenicTraceFrame(timeline, 0, 0, 1.5)).toThrow(RangeError);
    expect(() => new ScenicTraceFrame(timeline, 0, -1, 2)).toThrow(RangeError);
    expect(() => new ScenicTraceFrame(timeline, 0, 2, 2)).toThrow(RangeError);
    expect(() => new ScenicTraceFrame(timeline, 0, 0.5, 2)).toThrow(RangeError);

    // Ensure cardinal direction order matches [UP, RIGHT, DOWN, LEFT].
    expect(frame0.sightlines.distanceAt(3, 2, CARDINAL_DIR.UP)).toBe(2);
    expect(frame0.sightlines.distanceAt(3, 2, CARDINAL_DIR.RIGHT)).toBe(2);
    expect(frame0.sightlines.distanceAt(3, 2, CARDINAL_DIR.DOWN)).toBe(1);
    expect(frame0.sightlines.distanceAt(3, 2, CARDINAL_DIR.LEFT)).toBe(2);
  });
});
