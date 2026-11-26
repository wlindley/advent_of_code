import { describe, expect, it } from 'vitest';
import { DialBucketQueue } from './dialBucketQueue';

describe('DialBucketQueue', () => {
  it('returns -1 when popping from an empty queue and tracks size and currentDist', () => {
    const q = new DialBucketQueue(4, 3);
    expect(q.size).toBe(0);
    expect(q.currentDist).toBe(0);
    expect(q.popMin()).toBe(-1);

    q.insert(2, 0);
    expect(q.size).toBe(1);
    expect(q.popMin()).toBe(2);
    expect(q.size).toBe(0);
    expect(q.popMin()).toBe(-1);
  });

  it('handles all 4 doubly-linked list unlink cases (head-only, head-with-next, middle, tail)', () => {
    const q = new DialBucketQueue(5, 4);
    // Bucket 3 gets [3 -> 2 -> 1 -> 0] (head is 3, middle are 2 and 1, tail is 0)
    q.insert(0, 3);
    q.insert(1, 3);
    q.insert(2, 3);
    q.insert(3, 3);

    // 1. Unlink middle (node 1) -> bucket 3 becomes [3 -> 2 -> 0], bucket 1 gets [1]
    q.decreaseKey(1, 3, 1);
    // 2. Unlink tail (node 0) -> bucket 3 becomes [3 -> 2], bucket 2 gets [0]
    q.decreaseKey(0, 3, 2);
    // 3. Unlink head-with-next (node 3) via popMin -> bucket 3 becomes [2]
    expect(q.popMin()).toBe(1);
    expect(q.currentDist).toBe(1);
    expect(q.popMin()).toBe(0);
    expect(q.currentDist).toBe(2);
    expect(q.popMin()).toBe(3);
    expect(q.currentDist).toBe(3);
    // 4. Unlink head-only (node 2) via popMin -> bucket 3 becomes empty
    expect(q.popMin()).toBe(2);
    expect(q.size).toBe(0);
    expect(q.popMin()).toBe(-1);
  });

  it('supports bucketCount = 1 and multi-wrap circular progression', () => {
    const single = new DialBucketQueue(3, 1);
    single.insert(0, 0);
    single.insert(1, 0);
    expect([single.popMin(), single.popMin()]).toEqual([1, 0]);
    expect(single.currentDist).toBe(0);

    const wrap = new DialBucketQueue(4, 4);
    wrap.insert(0, 2);
    wrap.insert(1, 3);
    expect(wrap.popMin()).toBe(0);
    expect(wrap.currentDist).toBe(2);
    wrap.insert(2, 5);
    expect(wrap.popMin()).toBe(1);
    expect(wrap.currentDist).toBe(3);
    wrap.insert(3, 6);
    wrap.decreaseKey(3, 6, 4);
    expect(wrap.popMin()).toBe(3);
    expect(wrap.currentDist).toBe(4);
    wrap.insert(0, 7);
    expect(wrap.popMin()).toBe(2);
    expect(wrap.currentDist).toBe(5);
    expect(wrap.popMin()).toBe(0);
    expect(wrap.currentDist).toBe(7);
  });

  it('validates constructor bounds, states, and distances', () => {
    expect(() => new DialBucketQueue(0, 2)).toThrow(RangeError);
    expect(() => new DialBucketQueue(1.5, 2)).toThrow(RangeError);
    expect(() => new DialBucketQueue(2, 0)).toThrow(RangeError);
    expect(() => new DialBucketQueue(2, 2.5)).toThrow(RangeError);

    const q = new DialBucketQueue(3, 4);
    expect(() => q.insert(-1, 0)).toThrow(RangeError);
    expect(() => q.insert(3, 0)).toThrow(RangeError);
    expect(() => q.insert(0.5, 0)).toThrow(RangeError);
    expect(() => q.insert(0, 1.5)).toThrow(RangeError);
    q.insert(0, 2);
    expect(q.popMin()).toBe(0);
    expect(() => q.insert(1, 1)).toThrow(RangeError);

    q.insert(1, 5);
    expect(() => q.decreaseKey(1, 5, 5)).toThrow(RangeError);
    expect(() => q.decreaseKey(1, 5.5, 4)).toThrow(RangeError);
  });
});
