import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { PartRating } from './partRating';
import { RatingBox } from './ratingBox';
import { ConditionalRule } from './workflow';

describe('RatingBox', () => {
  it('constructs uniform hypercube and computes exact BigInt volume', () => {
    const box = RatingBox.uniform(1n, 4000n);
    expect(Object.isFrozen(box)).toBe(true);
    expect(box.volume).toBe(256000000000000n);
    expect(box.rangeFor('x').start).toBe(1n);
    expect(box.rangeFor('s').end).toBe(4000n);
  });

  it('wraps a single PartRating and checks containment across all axes', () => {
    const part = new PartRating({ x: 10, m: 20, a: 30, s: 40 });
    const box = RatingBox.fromPart(part);
    expect(box.volume).toBe(1n);
    expect(box.contains(part)).toBe(true);
    expect(box.contains(new PartRating({ x: 11, m: 20, a: 30, s: 40 }))).toBe(false);
    expect(box.contains(new PartRating({ x: 10, m: 21, a: 30, s: 40 }))).toBe(false);
    expect(box.contains(new PartRating({ x: 10, m: 20, a: 31, s: 40 }))).toBe(false);
    expect(box.contains(new PartRating({ x: 10, m: 20, a: 30, s: 41 }))).toBe(false);

    const updated = box.withRange('a', new ClosedInterval(1n, 50n));
    expect(updated.volume).toBe(50n);
    expect(box.volume).toBe(1n);
  });

  it('splits accurately on < rules across partial, full, and empty matches', () => {
    const box = RatingBox.uniform(1n, 4000n);
    const partial = box.split(new ConditionalRule('a', '<', 2006, 'qkq'));
    expect(partial.matched?.rangeFor('a')).toEqual(new ClosedInterval(1n, 2005n));
    expect(partial.remaining?.rangeFor('a')).toEqual(new ClosedInterval(2006n, 4000n));
    expect(partial.matched!.volume + partial.remaining!.volume).toBe(box.volume);

    const small = RatingBox.uniform(10n, 20n);
    expect(small.split(new ConditionalRule('x', '<', 21, 'A'))).toEqual({
      matched: small,
      remaining: null,
    });
    expect(small.split(new ConditionalRule('x', '<', 10, 'A'))).toEqual({
      matched: null,
      remaining: small,
    });
    expect(RatingBox.uniform(1n, 10n).split(new ConditionalRule('x', '<', 1, 'A'))).toEqual({
      matched: null,
      remaining: RatingBox.uniform(1n, 10n),
    });
  });

  it('splits accurately on > rules across partial, full, and empty matches', () => {
    const box = RatingBox.uniform(1n, 4000n);
    const partial = box.split(new ConditionalRule('m', '>', 2090, 'A'));
    expect(partial.matched?.rangeFor('m')).toEqual(new ClosedInterval(2091n, 4000n));
    expect(partial.remaining?.rangeFor('m')).toEqual(new ClosedInterval(1n, 2090n));
    expect(partial.matched!.volume + partial.remaining!.volume).toBe(box.volume);

    const small = RatingBox.uniform(10n, 20n);
    expect(small.split(new ConditionalRule('s', '>', 9, 'A'))).toEqual({
      matched: small,
      remaining: null,
    });
    expect(small.split(new ConditionalRule('s', '>', 20, 'A'))).toEqual({
      matched: null,
      remaining: small,
    });
  });
});
