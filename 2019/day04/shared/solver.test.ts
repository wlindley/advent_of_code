import { describe, expect, it } from 'vitest';
import { AT_LEAST_PAIR_POLICY, EXACT_PAIR_POLICY } from './policy';
import { PasswordRange } from './range';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PasswordTraceFrame,
  countMatchingPasswords,
  createSecureContainerSolver,
  tracePasswordSearch,
} from './solver';

describe('shared secure-container solver and trace', () => {
  it('counts matching passwords across boundary and example ranges', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(countMatchingPasswords(new PasswordRange(111_111, 123_789), AT_LEAST_PAIR_POLICY)).toBe(674);
    expect(countMatchingPasswords(new PasswordRange(111_111, 123_789), EXACT_PAIR_POLICY)).toBe(533);
    expect(countMatchingPasswords(new PasswordRange(200_000, 210_000), AT_LEAST_PAIR_POLICY)).toBe(0);
    expect(countMatchingPasswords(new PasswordRange(999_998, 999_999), AT_LEAST_PAIR_POLICY)).toBe(1);
    expect(countMatchingPasswords(new PasswordRange(999_998, 999_999), EXACT_PAIR_POLICY)).toBe(0);
    expect(countMatchingPasswords(new PasswordRange(999_999, 999_999), AT_LEAST_PAIR_POLICY)).toBe(1);
    expect(countMatchingPasswords(new PasswordRange(100_000, 999_999), AT_LEAST_PAIR_POLICY)).toBe(2919);
  });

  it('traces empty, small, and upper-bound ranges with dynamic derived counters', () => {
    const empty = tracePasswordSearch(new PasswordRange(200_000, 210_000), AT_LEAST_PAIR_POLICY);
    expect(empty).toEqual([]);
    expect(Object.isFrozen(empty)).toBe(true);

    const smallRange = new PasswordRange(123_455, 123_466);
    const frames = tracePasswordSearch(smallRange, AT_LEAST_PAIR_POLICY);
    expect(frames.map((f) => f.candidate.value)).toEqual([
      123_455, 123_456, 123_457, 123_458, 123_459, 123_466,
    ]);
    expect(frames[0]).toBeInstanceOf(PasswordTraceFrame);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]!.previousValue).toBeNull();
    expect(frames[0]!.skippedIntegers).toBe(0);
    expect(frames[0]!.accepted).toBe(true);
    expect(frames[0]!.matchedCount).toBe(1);
    expect(frames[0]!.rejectedCount).toBe(0);

    expect(frames[1]!.accepted).toBe(false);
    expect(frames[1]!.rejectedCount).toBe(1);

    const last = frames[frames.length - 1]!;
    expect(last.previousValue).toBe(123_459);
    expect(last.skippedIntegers).toBe(6);
    expect(last.accepted).toBe(true);
    expect(last.matchedCount).toBe(2);
    expect(last.rejectedCount).toBe(4);

    const upper = tracePasswordSearch(new PasswordRange(999_998, 999_999), AT_LEAST_PAIR_POLICY);
    expect(upper).toHaveLength(1);
    expect(upper[0]!.candidate.value).toBe(999_999);
    expect(upper[0]!.skippedIntegers).toBe(1);
  });

  it('downsamples large traces and validates maxSteps', () => {
    const range = new PasswordRange(111_111, 123_789);
    const defaultSampled = tracePasswordSearch(range, AT_LEAST_PAIR_POLICY);
    expect(defaultSampled).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultSampled[0]!.stepIndex).toBe(0);
    expect(defaultSampled[defaultSampled.length - 1]!.matchedCount).toBe(674);

    const custom = tracePasswordSearch(range, EXACT_PAIR_POLICY, { maxSteps: 10 });
    expect(custom).toHaveLength(10);
    expect(custom[custom.length - 1]!.matchedCount).toBe(533);

    expect(() => tracePasswordSearch(range, AT_LEAST_PAIR_POLICY, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('creates a frozen PuzzleSolver bound to a RunLengthPolicy', () => {
    const solver = createSecureContainerSolver(AT_LEAST_PAIR_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.policy).toBe(AT_LEAST_PAIR_POLICY);
    const parsed = solver.parse('111111-123789');
    expect(solver.solve(parsed)).toBe(674);
    expect(solver.trace(parsed, { maxSteps: 5 })).toHaveLength(5);
  });
});
