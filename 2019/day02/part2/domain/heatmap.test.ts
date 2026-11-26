import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../../shared/intcode';
import {
  DEFAULT_HEATMAP_SAMPLES,
  SearchHeatmap,
  buildAxisSamples,
  buildSearchHeatmap,
  computeLogError,
} from './heatmap';

function affineHeatmapProgram(a: bigint, b: bigint, c: bigint) {
  return parseIntcodeProgram(
    [1n, 0n, 0n, 3n, 2n, 1n, 21n, 0n, 2n, 2n, 22n, 3n, 1n, 0n, 3n, 0n, 1n, 0n, 23n, 0n, 99n, a, b, c, 0n].join(','),
  );
}

describe('2019 Day 2 Part 2 heatmap', () => {
  it('computes log2 error with exact 0n/1n separation and huge > 2^1100 values', () => {
    expect(DEFAULT_HEATMAP_SAMPLES).toBe(21);
    expect(computeLogError(0n)).toBe(0);
    expect(computeLogError(1n)).toBe(1);
    expect(computeLogError(2n)).toBe(2);
    expect(computeLogError(1n << 1100n)).toBe(1101);
    expect(() => computeLogError(-1n)).toThrow(RangeError);
  });

  it('builds exact axis samples when range fits, sampled BigInt axis for large maxInput, and rejects invalid args', () => {
    const exact = buildAxisSamples(3n, 5);
    expect(exact).toEqual([0n, 1n, 2n, 3n]);
    expect(Object.isFrozen(exact)).toBe(true);

    const sampled = buildAxisSamples(99n, 21);
    expect(sampled.length).toBe(21);
    expect(sampled[0]).toBe(0n);
    expect(sampled[1]).toBe(5n);
    expect(sampled[20]).toBe(99n);

    const huge = buildAxisSamples(10n ** 20n, 5);
    expect(huge).toEqual([0n, 25n * 10n ** 18n, 50n * 10n ** 18n, 75n * 10n ** 18n, 10n ** 20n]);

    expect(() => buildAxisSamples(0n, 5)).toThrow(RangeError);
    expect(() => buildAxisSamples(-5n, 5)).toThrow(RangeError);
    expect(() => buildAxisSamples(10n, 1)).toThrow(RangeError);
    expect(() => buildAxisSamples(10n, 2.5)).toThrow(RangeError);
  });

  it('builds normalized affine heatmap with 0 at exact match and 1 at peak error', () => {
    // 10*noun + verb with target 23 -> exact hit at (2, 3), max error at (0, 0) or (4, 4) -> |44 - 23| = 21, |0 - 23| = 23.
    const prog = affineHeatmapProgram(10n, 1n, 0n);
    const heatmap = buildSearchHeatmap(prog, 23n, 4n, 5);
    expect(heatmap).toBeInstanceOf(SearchHeatmap);
    expect(heatmap.size).toBe(5);
    expect(heatmap.maxInput).toBe(4n);
    expect(heatmap.maxError).toBe(23n);
    expect(heatmap.normalizedErrorAt(2, 3)).toBe(0);
    expect(heatmap.normalizedErrorAt(0, 0)).toBe(1);
    const mid = heatmap.normalizedErrorAt(2, 2);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(Object.isFrozen(heatmap)).toBe(true);
    expect(Object.isFrozen(heatmap.nounSamples)).toBe(true);
    expect(Object.isFrozen(heatmap.verbSamples)).toBe(true);
  });

  it('handles all-zero constant outputs without NaN and huge > 2^1100 target errors', () => {
    const constantHalt = parseIntcodeProgram('99,0,0');
    const zeroMap = buildSearchHeatmap(constantHalt, 99n, 10n ** 20n, 4);
    expect(zeroMap.maxError).toBe(0n);
    expect(zeroMap.maxInput).toBe(10n ** 20n);
    expect(zeroMap.normalizedErrorAt(0, 0)).toBe(0);
    expect(zeroMap.normalizedErrorAt(3, 3)).toBe(0);

    const hugeProg = affineHeatmapProgram(1n, 1n, 1n << 1100n);
    const hugeMap = buildSearchHeatmap(hugeProg, 0n, 2n, 3);
    expect(hugeMap.normalizedErrorAt(2, 2)).toBe(1);
    expect(Number.isFinite(hugeMap.normalizedErrorAt(0, 0))).toBe(true);
  });

  it('enforces bounds checking on normalizedErrorAt', () => {
    const prog = affineHeatmapProgram(1n, 1n, 0n);
    const heatmap = buildSearchHeatmap(prog, 0n, 2n, 3);
    expect(() => heatmap.normalizedErrorAt(-1, 0)).toThrow(RangeError);
    expect(() => heatmap.normalizedErrorAt(3, 0)).toThrow(RangeError);
    expect(() => heatmap.normalizedErrorAt(1.5, 0)).toThrow(RangeError);
    expect(() => heatmap.normalizedErrorAt(0, -1)).toThrow(RangeError);
    expect(() => heatmap.normalizedErrorAt(0, 3)).toThrow(RangeError);
    expect(() => heatmap.normalizedErrorAt(0, 0.5)).toThrow(RangeError);
  });
});
