import { describe, expect, it } from 'vitest';
import { AXIS_ALIGNED_POLICY, OCTILINEAR_POLICY } from './engine';
import { parseVentField } from './parser';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MAX_TRACE_HOTSPOTS,
  createVentSolver,
  traceVentField,
} from './trace';

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

describe('Vent trace and PolicyVentSolver', () => {
  it('traces all segments by default and supports maxSteps sampling', () => {
    const field = parseVentField(EXAMPLE_INPUT);
    const full = traceVentField(field, AXIS_ALIGNED_POLICY);
    expect(full).toHaveLength(10);
    expect(full[0]!.stepIndex).toBe(0);
    expect(full[0]!.latestIncluded).toBe(true);
    expect(full[1]!.latestIncluded).toBe(false);
    expect(full[9]!.processedSegmentCount).toBe(10);
    expect(full[9]!.overlapCount).toBe(5);
    expect(full[9]!.hotspotsTruncated).toBe(false);
    expect(full[9]!.overlapRatio).toBeGreaterThan(0);
    expect(Object.isFrozen(full[9]!)).toBe(true);

    const sampled = traceVentField(field, AXIS_ALIGNED_POLICY, { maxSteps: 3 });
    expect(sampled.map((f) => f.stepIndex)).toEqual([0, 5, 9]);
    const totalOverlaps = sampled.reduce((sum, f) => sum + f.addedOverlaps.length, 0);
    expect(totalOverlaps).toBe(5);
  });

  it('handles all-skipped fields and preserves exact counts when hotspots are truncated', () => {
    const allDiag = parseVentField('0,0 -> 3,3\n1,0 -> 4,3');
    const emptyFrames = traceVentField(allDiag, AXIS_ALIGNED_POLICY);
    expect(emptyFrames).toHaveLength(2);
    expect(emptyFrames[1]!.overlapCount).toBe(0);
    expect(emptyFrames[1]!.overlapRatio).toBe(0);
    expect(emptyFrames[1]!.maxDepth).toBe(0);

    const stacked = parseVentField('0,0 -> 3,0\n0,0 -> 3,0\n0,0 -> 3,0');
    const capped = traceVentField(stacked, AXIS_ALIGNED_POLICY, { maxHotspots: 1 });
    expect(capped[2]!.overlapCount).toBe(4);
    expect(capped[2]!.intenseCount).toBe(4);
    expect(capped[2]!.hotspotsTruncated).toBe(true);
    const collected = capped.reduce((s, f) => s + f.addedOverlaps.length + f.addedIntense.length, 0);
    expect(collected).toBe(1);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(MAX_TRACE_HOTSPOTS).toBe(25_000);
  });

  it('creates a frozen PolicyVentSolver implementing parse, solve, and trace', () => {
    const solver = createVentSolver(OCTILINEAR_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
    const field = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(field)).toBe(12);
    const frames = solver.trace(field, { maxSteps: 2 });
    expect(frames[1]!.overlapCount).toBe(12);
    expect(frames[1]!.intenseCount).toBeGreaterThan(0);
  });
});
