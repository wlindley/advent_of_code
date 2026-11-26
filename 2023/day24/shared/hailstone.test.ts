import { describe, expect, it } from 'vitest';
import { Hailstone, parseHailstones, TestArea, Vec3 } from './hailstone';

const EXAMPLE_INPUT = [
  '19, 13, 30 @ -2,  1, -2',
  '18, 19, 22 @ -1, -1, -2',
  '20, 25, 34 @ -2, -2, -4',
  '12, 31, 28 @ -1, -2, -1',
  '20, 19, 15 @  1, -5, -3',
].join('\n');

describe('Vec3 and Hailstone', () => {
  it('supports subtraction, cross product, equality, and immutability', () => {
    const a = new Vec3(1n, 2n, 3n);
    const b = new Vec3(4n, 6n, 8n);
    expect(Object.isFrozen(a)).toBe(true);
    expect(a.sub(b).equals(new Vec3(-3n, -4n, -5n))).toBe(true);
    expect(a.cross(b).equals(new Vec3(-2n, 4n, -2n))).toBe(true);
    expect(a.equals(new Vec3(1n, 2n, 3n))).toBe(true);
    expect(a.equals(new Vec3(1n, 9n, 3n))).toBe(false);
    expect(a.equals(new Vec3(1n, 2n, 9n))).toBe(false);

    const stone = new Hailstone(0, a, b);
    expect(Object.isFrozen(stone)).toBe(true);
    expect(stone.id).toBe(0);
    expect(stone.position).toBe(a);
    expect(stone.velocity).toBe(b);
  });
});

describe('TestArea', () => {
  it('validates bounds and computes dynamic span', () => {
    const area = new TestArea(7n, 27n);
    expect(Object.isFrozen(area)).toBe(true);
    expect(area.span).toBe(20n);
    expect(() => new TestArea(10n, 10n)).toThrow(RangeError);
    expect(() => new TestArea(15n, 10n)).toThrow(RangeError);
  });

  it('checks exact rational containment including boundaries', () => {
    const area = new TestArea(7n, 27n);
    expect(area.containsRatio(14n, 54n, 2n)).toBe(true);
    expect(area.containsRatio(43n, 31n, 3n)).toBe(true);
    expect(area.containsRatio(13n, 30n, 2n)).toBe(false);
    expect(area.containsRatio(55n, 30n, 2n)).toBe(false);
    expect(area.containsRatio(30n, 13n, 2n)).toBe(false);
    expect(area.containsRatio(30n, 55n, 2n)).toBe(false);
    expect(() => area.containsRatio(10n, 10n, 0n)).toThrow(RangeError);
    expect(() => area.containsRatio(10n, 10n, -2n)).toThrow(RangeError);
  });

  it('normalizes exact ratios relative to area bounds', () => {
    const area = new TestArea(200_000_000_000_000n, 400_000_000_000_000n);
    expect(area.normalizeRatio(200_000_000_000_000n, 1n)).toBe(0);
    expect(area.normalizeRatio(300_000_000_000_000n, 1n)).toBe(0.5);
    expect(area.normalizeRatio(400_000_000_000_000n, 1n)).toBe(1);
    expect(area.normalizeRatio(160_000_000_000_000n, 1n)).toBe(-0.2);
    expect(() => area.normalizeRatio(0n, 0n)).toThrow(RangeError);
    expect(() => area.normalizeRatio(0n, -1n)).toThrow(RangeError);
  });
});

describe('parseHailstones', () => {
  it('parses valid lines with CRLF, blank lines, and negative coordinates', () => {
    const withBlank = EXAMPLE_INPUT.replace('\n18,', '\n\n18,').replace(/\n/g, '\r\n');
    const stones = parseHailstones(`\n${withBlank}\n\n`);
    expect(Object.isFrozen(stones)).toBe(true);
    expect(stones).toHaveLength(5);
    expect(stones[0]!.id).toBe(0);
    expect(stones[0]!.position.equals(new Vec3(19n, 13n, 30n))).toBe(true);
    expect(stones[0]!.velocity.equals(new Vec3(-2n, 1n, -2n))).toBe(true);
    expect(stones[4]!.id).toBe(4);
    expect(stones[4]!.velocity.equals(new Vec3(1n, -5n, -3n))).toBe(true);
  });

  it('rejects empty input and malformed lines', () => {
    expect(() => parseHailstones('')).toThrow(/empty/i);
    expect(() => parseHailstones('   \n  ')).toThrow(/empty/i);
    expect(() => parseHailstones('1, 2, 3 @ 4, 5')).toThrow(/Invalid hailstone/);
    expect(() => parseHailstones('1, 2, x @ 4, 5, 6')).toThrow(/Invalid hailstone/);
  });
});
