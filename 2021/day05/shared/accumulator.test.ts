import { describe, expect, it } from 'vitest';
import {
  MAX_DENSE_GRID_CELLS,
  NOOP_COVERAGE_OBSERVER,
  createCoverageAccumulator,
  type CoverageObserver,
} from './accumulator';
import { VentBounds, VentPoint, VentSegment } from './types';

function makeRecorder(): { observer: CoverageObserver; overlaps: string[]; intense: string[] } {
  const overlaps: string[] = [];
  const intense: string[] = [];
  const observer: CoverageObserver = {
    onOverlap: (x, y) => overlaps.push(`${x},${y}`),
    onIntense: (x, y) => intense.push(`${x},${y}`),
  };
  return { observer, overlaps, intense };
}

describe('CoverageAccumulator', () => {
  it('selects dense vs sparse mode based on bounds area and validates maxDenseCells', () => {
    const small = new VentBounds(0, 3, 0, 3);
    expect(createCoverageAccumulator(small, MAX_DENSE_GRID_CELLS, NOOP_COVERAGE_OBSERVER).mode).toBe('dense');
    expect(createCoverageAccumulator(small, 15, NOOP_COVERAGE_OBSERVER).mode).toBe('sparse');
    expect(() => createCoverageAccumulator(small, 0, NOOP_COVERAGE_OBSERVER)).toThrow(RangeError);
    expect(() => createCoverageAccumulator(small, 1.5, NOOP_COVERAGE_OBSERVER)).toThrow(RangeError);
    expect(Object.isFrozen(NOOP_COVERAGE_OBSERVER)).toBe(true);
  });

  it('tracks covered, overlap, intense, maxDepth, and observer events identically in dense and sparse modes', () => {
    const bounds = new VentBounds(0, 4, 0, 4);
    const segments = [
      new VentSegment(new VentPoint(0, 2), new VentPoint(4, 2)),
      new VentSegment(new VentPoint(2, 0), new VentPoint(2, 4)),
      new VentSegment(new VentPoint(0, 0), new VentPoint(4, 4)),
      new VentSegment(new VentPoint(2, 2), new VentPoint(2, 2)),
    ];

    for (const limit of [100, 1]) {
      const rec = makeRecorder();
      const acc = createCoverageAccumulator(bounds, limit, rec.observer);
      expect(Object.isFrozen(acc)).toBe(false);
      for (const seg of segments) acc.addSegment(seg);
      expect(acc.coveredCount).toBe(13);
      expect(acc.overlapCount).toBe(1);
      expect(acc.intenseCount).toBe(1);
      expect(acc.maxDepth).toBe(4);
      expect(rec.overlaps).toEqual(['2,2']);
      expect(rec.intense).toEqual(['2,2']);
    }

    const noopAcc = createCoverageAccumulator(bounds, 100, NOOP_COVERAGE_OBSERVER);
    for (const seg of segments) noopAcc.addSegment(seg);
    expect(noopAcc.overlapCount).toBe(1);
    expect(noopAcc.intenseCount).toBe(1);
  });

  it('rejects out-of-bounds or oblique segments in both accumulators', () => {
    const bounds = new VentBounds(0, 2, 0, 2);
    for (const limit of [100, 1]) {
      const acc = createCoverageAccumulator(bounds, limit, NOOP_COVERAGE_OBSERVER);
      expect(() => acc.addSegment(new VentSegment(new VentPoint(-1, 0), new VentPoint(1, 0)))).toThrow(RangeError);
      expect(() => acc.addSegment(new VentSegment(new VentPoint(0, 0), new VentPoint(3, 0)))).toThrow(RangeError);
      expect(() => acc.addSegment(new VentSegment(new VentPoint(0, 0), new VentPoint(2, 1)))).toThrow(RangeError);
    }
  });
});
