import { describe, expect, it } from 'vitest';
import {
  createFullSignalPolicy,
  createOffsetMessagePolicy,
  FULL_SIGNAL_POLICY,
  OFFSET_MESSAGE_POLICY,
} from './policies';
import {
  DEFAULT_PHASES,
  MESSAGE_LENGTH,
  OFFSET_DIGITS,
  PART2_REPEAT_COUNT,
  parseSignal,
} from './signal';
import { FftSolver } from './solver';
import { DEFAULT_MAX_TRACE_STEPS, extractFrameMessage } from './trace';

describe('FftPolicy and FftSolver', () => {
  it('solves and traces Part 1 via FULL_SIGNAL_POLICY with omitted and explicit trace options', () => {
    const solver = new FftSolver(FULL_SIGNAL_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(Object.isFrozen(FULL_SIGNAL_POLICY)).toBe(true);
    expect(FULL_SIGNAL_POLICY.id).toBe('full-signal');
    expect(FULL_SIGNAL_POLICY.mode).toBe('full');

    const signal = solver.parse('80871224585914546619083218645595');
    expect(solver.solve(signal)).toBe('24176176');

    const defaultFrames = solver.trace(signal);
    expect(defaultFrames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    const lastDefault = defaultFrames[defaultFrames.length - 1]!;
    expect(extractFrameMessage(lastDefault)).toBe('24176176');
    expect(FULL_SIGNAL_POLICY.formatFrameSummary(lastDefault)).toContain('24176176');

    const customFrames = solver.trace(signal, { maxSteps: 6 });
    expect(customFrames).toHaveLength(6);
    expect(extractFrameMessage(customFrames[5]!)).toBe('24176176');
  });

  it('solves and traces Part 2 via OFFSET_MESSAGE_POLICY', () => {
    const solver = new FftSolver(OFFSET_MESSAGE_POLICY);
    expect(Object.isFrozen(OFFSET_MESSAGE_POLICY)).toBe(true);
    expect(OFFSET_MESSAGE_POLICY.id).toBe('offset-message');
    expect(OFFSET_MESSAGE_POLICY.mode).toBe('tail');
    expect(OFFSET_MESSAGE_POLICY.repeatCount).toBe(PART2_REPEAT_COUNT);
    expect(OFFSET_MESSAGE_POLICY.offsetDigits).toBe(OFFSET_DIGITS);

    const signal = solver.parse('03036732577212944063491565474664');
    expect(solver.solve(signal)).toBe('84462026');

    const frames = solver.trace(signal, { maxSteps: 5 });
    expect(frames).toHaveLength(5);
    const last = frames[4]!;
    expect(extractFrameMessage(last)).toBe('84462026');
    expect(OFFSET_MESSAGE_POLICY.formatFrameSummary(last)).toContain('84462026');
  });

  it('validates custom policy factory arguments and solver trace options', () => {
    const customFull = createFullSignalPolicy(4, 8);
    expect(customFull.solve(parseSignal('12345678'))).toBe('01029498');
    const customTail = createOffsetMessagePolicy(2, 1, 2, 3);
    expect(customTail.phases).toBe(2);
    expect(customTail.messageLength).toBe(3);

    expect(() => createFullSignalPolicy(-1, MESSAGE_LENGTH)).toThrow(RangeError);
    expect(() => createFullSignalPolicy(DEFAULT_PHASES, 0)).toThrow(RangeError);
    expect(() => createOffsetMessagePolicy(0, OFFSET_DIGITS, DEFAULT_PHASES, MESSAGE_LENGTH)).toThrow(RangeError);
    expect(() => createOffsetMessagePolicy(1, 0, DEFAULT_PHASES, MESSAGE_LENGTH)).toThrow(RangeError);
    expect(() => createOffsetMessagePolicy(1, OFFSET_DIGITS, -1, MESSAGE_LENGTH)).toThrow(RangeError);
    expect(() => createOffsetMessagePolicy(1, OFFSET_DIGITS, DEFAULT_PHASES, 0)).toThrow(RangeError);

    const solver = new FftSolver(customFull);
    expect(() => solver.trace(parseSignal('12345678'), { maxSteps: 0 })).toThrow(RangeError);
  });
});
