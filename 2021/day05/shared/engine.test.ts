import { describe, expect, it } from 'vitest';
import {
  AXIS_ALIGNED_POLICY,
  OCTILINEAR_POLICY,
  analyzeVentField,
  countVentOverlaps,
} from './engine';
import { parseVentField } from './parser';
import { VentField, VentPoint, VentSegment, type VentSelectionPolicy } from './types';

const EXAMPLE_INPUT = [
  '0,9 -> 5,9',
  '8,0 -> 0,8',
  '9,4 -> 3,4',
  '2,2 -> 2,1',
  '7,0 -> 7,4',
  '6,4 -> 2,0',
  '0,9 -> 2,9',
  '3,4 -> 1,4',
  '0,0 -> 8,8',
  '5,5 -> 8,2',
].join('\n');

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state;
  };
}

function bruteForceOverlapOracle(field: VentField, policy: VentSelectionPolicy): number {
  const counts = new Map<string, number>();
  for (const segment of field.segments) {
    if (!policy.includes(segment)) continue;
    segment.forEachPoint((x, y) => {
      const key = `${x},${y}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
  }
  let overlaps = 0;
  for (const count of counts.values()) {
    if (count >= 2) overlaps += 1;
  }
  return overlaps;
}

function generateRandomField(nextRand: () => number): VentField {
  const segmentCount = 4 + (nextRand() % 12);
  const segments: VentSegment[] = [];
  for (let i = 0; i < segmentCount; i += 1) {
    const x1 = (nextRand() % 21) - 10;
    const y1 = (nextRand() % 21) - 10;
    const len = nextRand() % 8;
    const kind = nextRand() % 4;
    const sx = kind === 0 ? 1 : kind === 1 ? 0 : kind === 2 ? 1 : -1;
    const sy = kind === 0 ? 0 : kind === 1 ? 1 : 1;
    const sign = nextRand() % 2 === 0 ? 1 : -1;
    segments.push(new VentSegment(new VentPoint(x1, y1), new VentPoint(x1 + len * sx * sign, y1 + len * sy * sign)));
  }
  return new VentField(segments);
}

describe('Vent engine', () => {
  it('solves the official example for axis-aligned (5) and octilinear (12) policies', () => {
    const field = parseVentField(EXAMPLE_INPUT);
    expect(Object.isFrozen(AXIS_ALIGNED_POLICY)).toBe(true);
    expect(Object.isFrozen(OCTILINEAR_POLICY)).toBe(true);
    expect(countVentOverlaps(field, AXIS_ALIGNED_POLICY)).toBe(5);
    expect(countVentOverlaps(field, OCTILINEAR_POLICY)).toBe(12);
  });

  it('handles all-skipped fields and ignores skipped bounds when selecting dense mode', () => {
    const allDiag = parseVentField('0,0 -> 5,5\n1,2 -> 3,4');
    const emptySummary = analyzeVentField(allDiag, AXIS_ALIGNED_POLICY);
    expect(emptySummary.mode).toBe('sparse');
    expect(emptySummary.bounds).toBeNull();
    expect(emptySummary.includedCount).toBe(0);
    expect(emptySummary.skippedCount).toBe(2);
    expect(emptySummary.processedSegmentCount).toBe(2);
    expect(emptySummary.overlapRatio).toBe(0);
    expect(Object.isFrozen(emptySummary)).toBe(true);

    const mixed = parseVentField('0,0 -> 1000000,1000000\n2,2 -> 2,4\n1,3 -> 3,3');
    const summary = analyzeVentField(mixed, AXIS_ALIGNED_POLICY);
    expect(summary.mode).toBe('dense');
    expect(summary.overlapCount).toBe(1);
    expect(summary.coveredCount).toBe(5);
    expect(summary.overlapRatio).toBeCloseTo(0.2);

    const forcedSparse = analyzeVentField(mixed, AXIS_ALIGNED_POLICY, 1);
    expect(forcedSparse.mode).toBe('sparse');
    expect(forcedSparse.overlapCount).toBe(1);
  });

  it('matches an independent brute-force Map oracle across 50 seeded PRNG cases for both policies', () => {
    const nextRand = createPrng(202105);
    for (let i = 0; i < 50; i += 1) {
      const field = generateRandomField(nextRand);
      expect(countVentOverlaps(field, AXIS_ALIGNED_POLICY)).toBe(bruteForceOverlapOracle(field, AXIS_ALIGNED_POLICY));
      expect(countVentOverlaps(field, OCTILINEAR_POLICY)).toBe(bruteForceOverlapOracle(field, OCTILINEAR_POLICY));
    }
  });
});
