import { describe, expect, it } from 'vitest';
import {
  computeBufferMagnitude,
  formatSnailfish,
  SnailfishHomework,
  SnailfishLeaf,
  SnailfishNumber,
} from './snailfish';

describe('SnailfishLeaf', () => {
  it('stores immutable non-negative integer value and positive depth', () => {
    const leaf = new SnailfishLeaf(0, 1);
    expect(leaf.value).toBe(0);
    expect(leaf.depth).toBe(1);
    expect(Object.isFrozen(leaf)).toBe(true);
  });

  it('rejects invalid values and depths', () => {
    expect(() => new SnailfishLeaf(-1, 1)).toThrow(RangeError);
    expect(() => new SnailfishLeaf(1.5, 1)).toThrow(RangeError);
    expect(() => new SnailfishLeaf(Number.MAX_SAFE_INTEGER + 1, 1)).toThrow(RangeError);
    expect(() => new SnailfishLeaf(1, 0)).toThrow(RangeError);
    expect(() => new SnailfishLeaf(1, 1.5)).toThrow(RangeError);
  });
});

describe('SnailfishNumber and helpers', () => {
  it('computes leafCount, maxDepth, magnitude, and formatted expression', () => {
    const num = new SnailfishNumber([
      new SnailfishLeaf(9, 2),
      new SnailfishLeaf(1, 2),
      new SnailfishLeaf(1, 2),
      new SnailfishLeaf(9, 2),
    ]);
    expect(num.leafCount).toBe(4);
    expect(num.maxDepth).toBe(2);
    expect(num.magnitude).toBe(129);
    expect(num.toString()).toBe('[[9,1],[1,9]]');
    expect(Object.isFrozen(num)).toBe(true);
    expect(Object.isFrozen(num.leaves)).toBe(true);
  });

  it('handles asymmetric tree depths for maxDepth and magnitude', () => {
    const num = new SnailfishNumber([
      new SnailfishLeaf(1, 1),
      new SnailfishLeaf(2, 2),
      new SnailfishLeaf(3, 2),
    ]);
    expect(num.maxDepth).toBe(2);
    expect(num.magnitude).toBe(3 * 1 + 2 * (3 * 2 + 2 * 3));
    expect(num.toString()).toBe('[1,[2,3]]');
  });

  it('rejects incomplete or malformed leaf sequences', () => {
    expect(() => new SnailfishNumber([])).toThrow(RangeError);
    expect(() => new SnailfishNumber([new SnailfishLeaf(1, 1)])).toThrow(RangeError);
    expect(
      () => new SnailfishNumber([new SnailfishLeaf(1, 2), new SnailfishLeaf(2, 1)]),
    ).toThrow(RangeError);
    expect(
      () => new SnailfishNumber([new SnailfishLeaf(1, 2), new SnailfishLeaf(2, 2)]),
    ).toThrow(RangeError);
  });

  it('computes buffer magnitude and rejects mismatched or incomplete buffers', () => {
    expect(computeBufferMagnitude([1, 2, 3], [1, 2, 2])).toBe(27);
    expect(() => computeBufferMagnitude([1], [1, 1])).toThrow(RangeError);
    expect(() => computeBufferMagnitude([1], [1])).toThrow(RangeError);
  });

  it('formats valid leaves and rejects malformed leaf sequences in formatSnailfish', () => {
    expect(formatSnailfish([new SnailfishLeaf(4, 1), new SnailfishLeaf(5, 1)])).toBe('[4,5]');
    expect(() => formatSnailfish([])).toThrow(RangeError);
    expect(() => formatSnailfish([new SnailfishLeaf(4, 1)])).toThrow(RangeError);
  });
});

describe('SnailfishHomework', () => {
  it('stores frozen list of snailfish numbers and rejects empty homework', () => {
    const a = new SnailfishNumber([new SnailfishLeaf(1, 1), new SnailfishLeaf(2, 1)]);
    const hw = new SnailfishHomework([a]);
    expect(hw.count).toBe(1);
    expect(hw.numbers[0]).toBe(a);
    expect(Object.isFrozen(hw)).toBe(true);
    expect(Object.isFrozen(hw.numbers)).toBe(true);
    expect(() => new SnailfishHomework([])).toThrow(RangeError);
  });
});
