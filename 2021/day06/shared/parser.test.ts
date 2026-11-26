import { describe, expect, it } from 'vitest';
import { parseLanternfishSchool } from './parser';

describe('parseLanternfishSchool', () => {
  it('parses official comma-separated sample timers into cohort counts', () => {
    const school = parseLanternfishSchool('3,4,3,1,2');
    expect(school.counts).toEqual([0n, 1n, 1n, 2n, 1n, 0n, 0n, 0n, 0n]);
    expect(school.totalPopulation).toBe(5n);
  });

  it('trims surrounding whitespace and tokens around commas including 0 and 8', () => {
    const school = parseLanternfishSchool('  0 , 8 , 6 \n');
    expect(school.counts).toEqual([1n, 0n, 0n, 0n, 0n, 0n, 1n, 0n, 1n]);
  });

  it('rejects empty input with RangeError', () => {
    expect(() => parseLanternfishSchool('')).toThrow(RangeError);
    expect(() => parseLanternfishSchool('   \n\t ')).toThrow(RangeError);
  });

  it('rejects malformed tokens with SyntaxError', () => {
    for (const bad of ['3,,4', '3,4,', ',3', '3,abc', '3,-1', '3,1.5', '3 4']) {
      expect(() => parseLanternfishSchool(bad)).toThrow(SyntaxError);
    }
  });

  it('rejects out-of-range timer buckets with RangeError', () => {
    expect(() => parseLanternfishSchool('3,9,1')).toThrow(RangeError);
    expect(() => parseLanternfishSchool('10')).toThrow(RangeError);
  });
});
