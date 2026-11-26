import { describe, expect, it } from 'vitest';
import { FreeSpan } from '../../shared';
import { LeftmostSpanIndex } from './index';

describe('LeftmostSpanIndex', () => {
  it('handles empty span lists', () => {
    const index = new LeftmostSpanIndex([]);
    expect(index.spanCount).toBe(0);
    expect(index.maxFreeLength).toBe(0);
    expect(index.claimLeftmost(1, 10)).toBe(-1);
  });

  it('handles S = 1 exact fit, partial fit, too-large, and beforeStart boundary', () => {
    const exact = new LeftmostSpanIndex([new FreeSpan(2, 3)]);
    expect(exact.spanCount).toBe(1);
    expect(exact.maxFreeLength).toBe(3);
    expect(exact.claimLeftmost(4, 10)).toBe(-1);
    expect(exact.claimLeftmost(3, 2)).toBe(-1);
    expect(exact.claimLeftmost(3, 3)).toBe(2);
    expect(exact.maxFreeLength).toBe(0);
    expect(exact.claimLeftmost(1, 10)).toBe(-1);

    const partial = new LeftmostSpanIndex([new FreeSpan(2, 5)]);
    expect(partial.claimLeftmost(2, 10)).toBe(2);
    expect(partial.maxFreeLength).toBe(3);
    expect(partial.claimLeftmost(3, 10)).toBe(4);
    expect(partial.maxFreeLength).toBe(0);
  });

  it('descends left and right children cleanly for S = 2 and S = 4', () => {
    const two = new LeftmostSpanIndex([new FreeSpan(0, 2), new FreeSpan(5, 5)]);
    expect(two.maxFreeLength).toBe(5);
    expect(two.claimLeftmost(4, 20)).toBe(5);
    expect(two.maxFreeLength).toBe(2);
    expect(two.claimLeftmost(2, 20)).toBe(0);
    expect(two.maxFreeLength).toBe(1);

    const four = new LeftmostSpanIndex([
      new FreeSpan(0, 2),
      new FreeSpan(4, 4),
      new FreeSpan(10, 3),
      new FreeSpan(15, 6),
    ]);
    expect(four.claimLeftmost(5, 30)).toBe(15);
    expect(four.claimLeftmost(3, 30)).toBe(4);
    expect(four.claimLeftmost(3, 30)).toBe(10);
    expect(four.claimLeftmost(2, 30)).toBe(0);
    expect(four.maxFreeLength).toBe(1);
  });

  it('handles non-power-of-2 padding for S = 3 and S = 5', () => {
    const three = new LeftmostSpanIndex([
      new FreeSpan(1, 1),
      new FreeSpan(4, 3),
      new FreeSpan(9, 2),
    ]);
    expect(three.spanCount).toBe(3);
    expect(three.claimLeftmost(2, 20)).toBe(4);
    expect(three.claimLeftmost(2, 20)).toBe(9);
    expect(three.claimLeftmost(1, 20)).toBe(1);
    expect(three.claimLeftmost(1, 20)).toBe(6);
    expect(three.maxFreeLength).toBe(0);

    const five = new LeftmostSpanIndex([
      new FreeSpan(0, 1),
      new FreeSpan(2, 2),
      new FreeSpan(5, 1),
      new FreeSpan(8, 3),
      new FreeSpan(12, 4),
    ]);
    expect(five.claimLeftmost(4, 20)).toBe(12);
    expect(five.claimLeftmost(3, 20)).toBe(8);
    expect(five.claimLeftmost(2, 20)).toBe(2);
    expect(five.claimLeftmost(2, 20)).toBe(-1);
  });

  it('supports multi-claim until exhausted with rightward fallback and leftover reuse', () => {
    const index = new LeftmostSpanIndex([
      new FreeSpan(0, 5),
      new FreeSpan(7, 4),
      new FreeSpan(15, 6),
    ]);
    expect(index.claimLeftmost(3, 30)).toBe(0);
    expect(index.claimLeftmost(4, 30)).toBe(7);
    expect(index.claimLeftmost(2, 30)).toBe(3);
    expect(index.claimLeftmost(6, 30)).toBe(15);
    expect(index.maxFreeLength).toBe(0);
  });

  it('rejects unsorted, overlapping, or invalid claim arguments', () => {
    expect(() => new LeftmostSpanIndex([new FreeSpan(5, 2), new FreeSpan(1, 2)])).toThrow(RangeError);
    expect(() => new LeftmostSpanIndex([new FreeSpan(1, 4), new FreeSpan(3, 2)])).toThrow(RangeError);

    const index = new LeftmostSpanIndex([new FreeSpan(0, 3)]);
    expect(() => index.claimLeftmost(0, 5)).toThrow(RangeError);
    expect(() => index.claimLeftmost(-1, 5)).toThrow(RangeError);
    expect(() => index.claimLeftmost(1.5, 5)).toThrow(RangeError);
    expect(() => index.claimLeftmost(1, -1)).toThrow(RangeError);
    expect(() => index.claimLeftmost(1, 2.5)).toThrow(RangeError);
  });
});
