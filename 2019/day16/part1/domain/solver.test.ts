import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, extractFrameMessage } from '../../shared';
import { solver } from './solver';

describe('2019 Day 16 Part 1 domain solver', () => {
  it('solves all three official 100-phase Part 1 examples', () => {
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['80871224585914546619083218645595', '24176176'],
      ['19617804207202209144916044189917', '73745418'],
      ['69317163492948606335995924319873', '52432133'],
    ];
    for (const [raw, expected] of cases) {
      const signal = solver.parse(`  ${raw}\n`);
      expect(solver.solve(signal)).toBe(expected);
    }
  });

  it('produces bounded trace frames with omitted and explicit TraceOptions', () => {
    const signal = solver.parse('80871224585914546619083218645595');

    const defaultFrames = solver.trace(signal);
    expect(defaultFrames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultFrames[0]!.phase).toBe(0);
    expect(defaultFrames[defaultFrames.length - 1]!.phase).toBe(100);
    expect(extractFrameMessage(defaultFrames[defaultFrames.length - 1]!)).toBe('24176176');

    const sampledFrames = solver.trace(signal, { maxSteps: 8 });
    expect(sampledFrames).toHaveLength(8);
    expect(extractFrameMessage(sampledFrames[7]!)).toBe('24176176');
  });

  it('rejects empty or non-digit signal inputs', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('12x34')).toThrow();
  });
});
