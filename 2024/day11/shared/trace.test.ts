import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MAX_ORDERED_PREVIEW,
  parsePebbleLine,
  PebbleLine,
  TOP_BUCKETS_LIMIT,
  tracePebbleEvolution,
} from './index';

describe('tracePebbleEvolution', () => {
  it('exposes expected trace constants', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(MAX_ORDERED_PREVIEW).toBe(64n);
    expect(TOP_BUCKETS_LIMIT).toBe(12);
  });

  it('produces single frozen frame for blinkCount = 0', () => {
    const line = parsePebbleLine('125 17');
    const frames = tracePebbleEvolution(line, 0);

    expect(frames).toHaveLength(1);
    const frame = frames[0]!;
    expect(frame.blink).toBe(0);
    expect(frame.totalStones).toBe(2n);
    expect(frame.distinctStones).toBe(2);
    expect(frame.ruleCounts).toEqual({ zero: 0n, split: 0n, scale: 0n });
    expect(frame.orderedPreview).toEqual([125n, 17n]);
    expect(frame.topBuckets).toEqual([
      { stone: 17n, count: 1n },
      { stone: 125n, count: 1n },
    ]);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.topBuckets)).toBe(true);
    expect(Object.isFrozen(frame.topBuckets[0])).toBe(true);
    expect(Object.isFrozen(frame.orderedPreview)).toBe(true);
  });

  it('matches AoC 125 17 ordered previews for blinks 0..6', () => {
    const line = parsePebbleLine('125 17');
    const frames = tracePebbleEvolution(line, 6);
    expect(frames.map((f) => f.orderedPreview)).toEqual([
      [125n, 17n],
      [253000n, 1n, 7n],
      [253n, 0n, 2024n, 14168n],
      [512072n, 1n, 20n, 24n, 28676032n],
      [512n, 72n, 2024n, 2n, 0n, 2n, 4n, 2867n, 6032n],
      [1036288n, 7n, 2n, 20n, 24n, 4048n, 1n, 4048n, 8096n, 28n, 67n, 60n, 32n],
      [
        2097446912n, 14168n, 4048n, 2n, 0n, 2n, 4n, 40n, 48n, 2024n, 40n, 48n,
        80n, 96n, 2n, 8n, 6n, 7n, 6n, 0n, 3n, 2n,
      ],
    ]);
  });

  it('transitions orderedPreview from non-null to null once totalStones exceeds 64n', () => {
    const frames = tracePebbleEvolution(parsePebbleLine('125 17'), 12);
    expect(frames).toHaveLength(13);
    expect(frames[0]!.orderedPreview).not.toBeNull();
    expect(frames[12]!.orderedPreview).toBeNull();
  });

  it('starts with null orderedPreview when initial line exceeds 64 stones', () => {
    const stones = Array.from({ length: 65 }, (_, i) => BigInt(i));
    const frames = tracePebbleEvolution(new PebbleLine(stones), 2);
    expect(frames[0]!.orderedPreview).toBeNull();
    expect(frames[1]!.orderedPreview).toBeNull();
    expect(frames[2]!.orderedPreview).toBeNull();
  });

  it('respects maxSteps = 1 and maxSteps = 5 endpoint sampling', () => {
    const line = parsePebbleLine('125 17');
    const one = tracePebbleEvolution(line, 10, { maxSteps: 1 });
    expect(one.map((f) => f.blink)).toEqual([10]);

    const five = tracePebbleEvolution(line, 10, { maxSteps: 5 });
    expect(five).toHaveLength(5);
    expect(five[0]!.blink).toBe(0);
    expect(five[4]!.blink).toBe(10);
  });

  it('caps topBuckets at 12 and orders by count desc then stone asc', () => {
    const stones: bigint[] = [
      30n, 10n, 20n,
      40n, 40n, 40n,
      5n, 5n,
      ...Array.from({ length: 15 }, (_, i) => BigInt(100 + i)),
    ];
    const frames = tracePebbleEvolution(new PebbleLine(stones), 0);
    const buckets = frames[0]!.topBuckets;

    expect(buckets).toHaveLength(12);
    expect(buckets[0]).toEqual({ stone: 40n, count: 3n });
    expect(buckets[1]).toEqual({ stone: 5n, count: 2n });
    expect(buckets.slice(2)).toEqual([
      { stone: 10n, count: 1n },
      { stone: 20n, count: 1n },
      { stone: 30n, count: 1n },
      { stone: 100n, count: 1n },
      { stone: 101n, count: 1n },
      { stone: 102n, count: 1n },
      { stone: 103n, count: 1n },
      { stone: 104n, count: 1n },
      { stone: 105n, count: 1n },
      { stone: 106n, count: 1n },
    ]);
  });

  it('rejects invalid blinkCount and maxSteps', () => {
    const line = new PebbleLine([1n]);
    expect(() => tracePebbleEvolution(line, -1)).toThrow(RangeError);
    expect(() => tracePebbleEvolution(line, 5, { maxSteps: 0 })).toThrow(RangeError);
  });
});
