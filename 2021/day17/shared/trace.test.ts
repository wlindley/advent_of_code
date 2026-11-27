import { describe, expect, it } from 'vitest';
import { analyzeTargetArea } from './analyzer';
import { MAX_APEX_POLICY, VALID_VELOCITY_COUNT_POLICY } from './policy';
import { TargetArea } from './target';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MAX_ARC_POINTS,
  MAX_PHASE_BANDS,
  traceTrickShot,
} from './trace';

describe('2021 Day 17 traceTrickShot', () => {
  const exampleAnalysis = analyzeTargetArea(new TargetArea(20, 30, -10, -5));

  it('produces bounded frames with sweep and arc phases for MAX_APEX_POLICY', () => {
    const frames = traceTrickShot(exampleAnalysis, MAX_APEX_POLICY);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[0]!.phase).toBe('sweep');
    expect(frames[0]!.isComplete).toBe(false);
    expect(frames[0]!.progressRatio).toBeGreaterThan(0);

    const last = frames[frames.length - 1]!;
    expect(last.phase).toBe('arc');
    expect(last.isComplete).toBe(true);
    expect(last.progressRatio).toBe(1);
    expect(last.activeResult).toBe(45);
    expect(last.activeBand.matchCount).toBe(2);
    expect(last.activeBand.vxRanges[0]!.count).toBe(2);
  });

  it('supports VALID_VELOCITY_COUNT_POLICY, custom maxSteps, and maxSteps=1', () => {
    const frames = traceTrickShot(exampleAnalysis, VALID_VELOCITY_COUNT_POLICY, { maxSteps: 12 });
    expect(frames).toHaveLength(12);
    expect(frames[11]!.isComplete).toBe(true);
    expect(frames[11]!.activeResult).toBe(112);

    const single = traceTrickShot(exampleAnalysis, MAX_APEX_POLICY, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.isComplete).toBe(true);
    expect(single[0]!.activeResult).toBe(45);

    expect(() => traceTrickShot(exampleAnalysis, MAX_APEX_POLICY, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('handles empty-match y bands, disjoint vx ranges, and downsampling caps', () => {
    const narrow = analyzeTargetArea(new TargetArea(14, 14, -10, -2));
    const narrowFrames = traceTrickShot(narrow, VALID_VELOCITY_COUNT_POLICY);
    const zeroMatchBand = narrowFrames[0]!.snapshot.phaseBands.find((b) => b.matchCount === 0);
    expect(zeroMatchBand).toBeDefined();
    expect(zeroMatchBand!.vxRanges).toEqual([]);
    expect(narrowFrames.some((f) => f.phase === 'sweep' && f.candidateArc.length === 0)).toBe(true);
    expect(narrowFrames[narrowFrames.length - 1]!.activeResult).toBe(12);

    const gapped = analyzeTargetArea(new TargetArea(14, 15, -6, -3));
    const gappedFrames = traceTrickShot(gapped, VALID_VELOCITY_COUNT_POLICY);
    const disjointBand = gappedFrames[0]!.snapshot.phaseBands.find((b) => b.vxRanges.length > 1);
    expect(disjointBand).toBeDefined();

    const deep = analyzeTargetArea(new TargetArea(20, 30, -200, -180));
    const deepFrames = traceTrickShot(deep, MAX_APEX_POLICY, { maxSteps: 30 });
    const snap = deepFrames[0]!.snapshot;
    expect(snap.phaseBands.length).toBe(MAX_PHASE_BANDS);
    expect(snap.bestArc.length).toBe(MAX_ARC_POINTS);
    expect(deepFrames[deepFrames.length - 1]!.activeResult).toBe(deep.maxApexY);
  });
});
