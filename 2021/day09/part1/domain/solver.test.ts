import { describe, expect, it } from 'vitest';
import { LowPointScanFrame } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = ['2199943210', '3987894921', '9856789892', '8767896789', '9899965678'].join('\n');

describe('2021 Day 9 Part 1 solver', () => {
  it('solves the official 5x10 example to 15', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(map)).toBe(15);
  });

  it('produces trace frames whose final runningTotal matches solve()', () => {
    const map = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace(map);
    expect(frames).toHaveLength(4);
    const finalFrame = frames[frames.length - 1] as LowPointScanFrame;
    expect(finalFrame.kind).toBe('low-point-risk');
    expect(finalFrame.runningTotal).toBe(solver.solve(map));
  });

  it('rejects empty, ragged, or non-digit inputs', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('12\n3')).toThrow();
    expect(() => solver.parse('12x')).toThrow(RangeError);
  });
});
