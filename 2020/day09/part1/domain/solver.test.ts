import { describe, expect, it } from 'vitest';
import { DEFAULT_PREAMBLE_LENGTH, solver } from './index';

const MANIFEST_EXAMPLE = [
  ...Array.from({ length: 25 }, (_, i) => String(i + 1)),
  '45',
  '26',
  '64',
  '66',
  '125',
  '111',
].join('\n');

describe('2020 Day 9 Part 1 domain solver', () => {
  it('solves the W=25 manifest example to 125n', () => {
    expect(DEFAULT_PREAMBLE_LENGTH).toBe(25);
    const stream = solver.parse(MANIFEST_EXAMPLE);
    expect(solver.solve(stream)).toBe(125n);
  });

  it('produces a bounded trace ending on the invalid target frame', () => {
    const stream = solver.parse(MANIFEST_EXAMPLE);
    const frames = solver.trace(stream);
    expect(frames).toHaveLength(5);
    const last = frames[4]!;
    expect(last.phase).toBe('preamble');
    if (last.phase === 'preamble') {
      expect(last.isInvalid).toBe(true);
      expect(stream.at(last.check.targetIndex)).toBe(125n);
    }
  });

  it('throws on undersized (< 26) streams', () => {
    const undersized = solver.parse(Array.from({ length: 25 }, (_, i) => String(i + 1)).join('\n'));
    expect(() => solver.solve(undersized)).toThrow(RangeError);
  });
});
