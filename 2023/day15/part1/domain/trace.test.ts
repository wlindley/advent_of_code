import { describe, expect, it } from 'vitest';
import { HASH_BUCKET_COUNT, parseInitSequence } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  HashSequenceFrame,
  traceHashSequence,
  validateBucketCounts,
} from './index';

function makeCounts(overrides: Readonly<Record<number, number>> = {}): number[] {
  const counts = new Array<number>(HASH_BUCKET_COUNT).fill(0);
  for (const [bucket, count] of Object.entries(overrides)) {
    counts[Number(bucket)] = count;
  }
  return counts;
}

describe('validateBucketCounts', () => {
  it('returns a frozen copy of valid 256 non-negative integer counts', () => {
    const raw = makeCounts({ 52: 2, 255: 1 });
    const frozen = validateBucketCounts(raw);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(frozen).not.toBe(raw);
    expect(frozen[52]).toBe(2);
    expect(frozen[255]).toBe(1);
  });

  it('rejects arrays whose length is not 256', () => {
    expect(() => validateBucketCounts(new Array<number>(255).fill(0))).toThrow(RangeError);
    expect(() => validateBucketCounts(new Array<number>(257).fill(0))).toThrow(RangeError);
  });

  it('rejects negative or non-integer bucket counts', () => {
    expect(() => validateBucketCounts(makeCounts({ 10: -1 }))).toThrow(RangeError);
    expect(() => validateBucketCounts(makeCounts({ 10: 1.5 }))).toThrow(RangeError);
  });
});

describe('HashSequenceFrame', () => {
  it('freezes itself and derives telemetry dynamically via getters', () => {
    const counts = makeCounts({ 52: 2, 10: 1 });
    const frame = new HashSequenceFrame(0, 2, 5, 'HASH', counts);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame.frameIndex).toBe(0);
    expect(frame.stepIndex).toBe(2);
    expect(frame.totalSteps).toBe(5);
    expect(frame.token).toBe('HASH');
    expect(frame.processedCount).toBe(3);
    expect(frame.tokenHash).toBe(52);
    expect(frame.charTransitions).toHaveLength(4);
    expect(frame.runningSum).toBe(52 * 2 + 10);
    expect(frame.occupiedBuckets).toBe(2);
    expect(frame.maxBucketCount).toBe(2);
  });

  it('rejects invalid frameIndex and totalSteps', () => {
    const counts = makeCounts();
    expect(() => new HashSequenceFrame(-1, 0, 1, 'a', counts)).toThrow(RangeError);
    expect(() => new HashSequenceFrame(0.5, 0, 1, 'a', counts)).toThrow(RangeError);
    expect(() => new HashSequenceFrame(0, 0, 0, 'a', counts)).toThrow(RangeError);
    expect(() => new HashSequenceFrame(0, 0, 1.5, 'a', counts)).toThrow(RangeError);
  });

  it('rejects out-of-range or non-integer stepIndex', () => {
    const counts = makeCounts();
    expect(() => new HashSequenceFrame(0, -1, 2, 'a', counts)).toThrow(RangeError);
    expect(() => new HashSequenceFrame(0, 2, 2, 'a', counts)).toThrow(RangeError);
    expect(() => new HashSequenceFrame(0, 0.5, 2, 'a', counts)).toThrow(RangeError);
  });

  it('rejects empty, non-printable, or space-containing tokens', () => {
    const counts = makeCounts();
    expect(() => new HashSequenceFrame(0, 0, 1, '', counts)).toThrow(RangeError);
    expect(() => new HashSequenceFrame(0, 0, 1, 'a\n', counts)).toThrow(RangeError);
    expect(() => new HashSequenceFrame(0, 0, 1, 'a b', counts)).toThrow(RangeError);
  });
});

describe('traceHashSequence', () => {
  it('returns an empty frozen array for an empty sequence', () => {
    const frames = traceHashSequence([]);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toEqual([]);
  });

  it('produces unsampled frames when options are omitted for small sequences', () => {
    const steps = parseInitSequence('rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7');
    const frames = traceHashSequence(steps);
    expect(frames).toHaveLength(11);
    const last = frames[frames.length - 1]!;
    expect(last.processedCount).toBe(11);
    expect(last.runningSum).toBe(1320);
    expect(last.occupiedBuckets).toBe(11);
    expect(last.maxBucketCount).toBe(1);
  });

  it('samples uniformly with maxSteps: 4 and maxSteps: 1 preserving endpoints', () => {
    const steps = parseInitSequence('rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7');
    const four = traceHashSequence(steps, { maxSteps: 4 });
    expect(four.map((f) => f.stepIndex)).toEqual([0, 3, 7, 10]);
    expect(four[3]!.runningSum).toBe(1320);

    const single = traceHashSequence(steps, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.stepIndex).toBe(10);
    expect(single[0]!.runningSum).toBe(1320);
  });

  it('caps a 300-step sequence at DEFAULT_MAX_TRACE_STEPS', () => {
    const steps = Array.from({ length: 300 }, (_, i) => (i % 2 === 0 ? 'HASH' : 'a'));
    const frames = traceHashSequence(steps);
    expect(frames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[frames.length - 1]!.stepIndex).toBe(299);
    expect(frames[frames.length - 1]!.maxBucketCount).toBe(150);
  });

  it('rejects invalid maxSteps options', () => {
    expect(() => traceHashSequence(['HASH'], { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceHashSequence(['HASH'], { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceHashSequence(['HASH'], { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
