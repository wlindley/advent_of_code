import { describe, expect, it } from 'vitest';
import {
  assertPriority,
  encodeItemMask,
  extractSinglePriority,
  itemPriority,
  PRIORITY_COUNT,
  priorityToItem,
} from './priority';
import { parseRucksacks, Rucksack, validateRucksackRaw } from './rucksack';
import { DEFAULT_MAX_TRACE_STEPS, PriorityTally } from './tally';

describe('2022 day 03 priority', () => {
  it('maps item characters to and from priorities 1..52', () => {
    expect(PRIORITY_COUNT).toBe(52);
    expect(itemPriority('a')).toBe(1);
    expect(itemPriority('z')).toBe(26);
    expect(itemPriority('A')).toBe(27);
    expect(itemPriority('Z')).toBe(52);
    expect(priorityToItem(1)).toBe('a');
    expect(priorityToItem(26)).toBe('z');
    expect(priorityToItem(27)).toBe('A');
    expect(priorityToItem(52)).toBe('Z');
  });

  it('rejects invalid items and priorities with RangeError', () => {
    for (const bad of ['', 'ab', '1', '@', '[', '`', '{']) {
      expect(() => itemPriority(bad)).toThrow(RangeError);
    }
    for (const bad of [0, 53, -1, 1.5, Number.NaN]) {
      expect(() => assertPriority(bad)).toThrow(RangeError);
      expect(() => priorityToItem(bad)).toThrow(RangeError);
    }
  });

  it('encodes item masks and extracts single-bit priorities', () => {
    expect(encodeItemMask('')).toBe(0n);
    expect(encodeItemMask('a')).toBe(1n);
    expect(encodeItemMask('Z')).toBe(1n << 51n);
    expect(encodeItemMask('aZa')).toBe(1n | (1n << 51n));
    expect(() => encodeItemMask('a1')).toThrow(RangeError);

    expect(extractSinglePriority(1n)).toBe(1);
    expect(extractSinglePriority(1n << 25n)).toBe(26);
    expect(extractSinglePriority(1n << 26n)).toBe(27);
    expect(extractSinglePriority(1n << 51n)).toBe(52);

    for (const bad of [0n, -1n, 1n << 52n, 3n, 1n | (1n << 25n)]) {
      expect(() => extractSinglePriority(bad)).toThrow(RangeError);
    }
  });
});

describe('2022 day 03 rucksack', () => {
  it('constructs frozen Rucksack instances and computes dynamic getters', () => {
    const sack = new Rucksack(1, 'vJrwpWtwJgWrhcsFMMfFFhFp');
    expect(Object.isFrozen(sack)).toBe(true);
    expect(Object.keys(sack)).toEqual(['rucksackNumber', 'raw']);
    expect(sack.rucksackNumber).toBe(1);
    expect(sack.midpoint).toBe(12);
    expect(sack.firstCompartment).toBe('vJrwpWtwJgWr');
    expect(sack.secondCompartment).toBe('hcsFMMfFFhFp');
    expect(sack.misplacedItem).toBe('p');
    expect(sack.misplacedPriority).toBe(16);
    expect(sack.allMask).toBe(sack.firstMask | sack.secondMask);
    expect(sack.misplacedMask).toBe(sack.firstMask & sack.secondMask);
  });

  it('allows zero-overlap and multi-overlap rucksacks to construct for Part 2', () => {
    const noOverlap = new Rucksack(1, 'ab');
    expect(noOverlap.misplacedMask).toBe(0n);
    expect(() => noOverlap.misplacedPriority).toThrow(RangeError);

    const multiOverlap = new Rucksack(2, 'abab');
    expect(() => multiOverlap.misplacedPriority).toThrow(RangeError);
  });

  it('validates Rucksack constructor arguments and parseRucksacks lines', () => {
    expect(() => new Rucksack(0, 'aa')).toThrow(RangeError);
    expect(() => new Rucksack(1.5, 'aa')).toThrow(RangeError);
    expect(() => validateRucksackRaw('', 'Line 1')).toThrow(/Line 1:/);
    expect(() => validateRucksackRaw('abc', 'Line 2')).toThrow(/Line 2:/);
    expect(() => validateRucksackRaw('a1', 'Line 3')).toThrow(/Line 3:/);

    const parsed = parseRucksacks('\n  aa \r\n\r\n bZ \n');
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]!.rucksackNumber).toBe(1);
    expect(parsed[1]!.raw).toBe('bZ');

    expect(() => parseRucksacks('')).toThrow(Error);
    expect(() => parseRucksacks('  \r\n\t ')).toThrow(Error);
    expect(() => parseRucksacks('aa\n\nabc')).toThrow(/Line 3:/);
  });
});

describe('2022 day 03 tally', () => {
  it('constructs defensive frozen PriorityTally and computes dynamic summaries', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const zero = new PriorityTally(new Array<number>(PRIORITY_COUNT).fill(0));
    expect(zero.totalItems).toBe(0);
    expect(zero.totalPriority).toBe(0);
    expect(zero.distinctTypes).toBe(0);
    expect(zero.maxCount).toBe(0);

    const rawCounts = new Array<number>(PRIORITY_COUNT).fill(0);
    rawCounts[0] = 2; // priority 1 ('a') * 2 = 2
    rawCounts[51] = 3; // priority 52 ('Z') * 3 = 156
    const tally = new PriorityTally(rawCounts);
    rawCounts[0] = 99;

    expect(Object.isFrozen(tally)).toBe(true);
    expect(Object.isFrozen(tally.counts)).toBe(true);
    expect(tally.countOf(1)).toBe(2);
    expect(tally.countOf(52)).toBe(3);
    expect(tally.totalItems).toBe(5);
    expect(tally.totalPriority).toBe(158);
    expect(tally.distinctTypes).toBe(2);
    expect(tally.maxCount).toBe(3);

    expect(() => tally.countOf(0)).toThrow(RangeError);
    expect(() => tally.countOf(53)).toThrow(RangeError);
  });

  it('rejects invalid count arrays in PriorityTally constructor', () => {
    expect(() => new PriorityTally([])).toThrow(RangeError);
    const negative = new Array<number>(PRIORITY_COUNT).fill(0);
    negative[3] = -1;
    expect(() => new PriorityTally(negative)).toThrow(RangeError);

    const fractional = new Array<number>(PRIORITY_COUNT).fill(0);
    fractional[3] = 1.5;
    expect(() => new PriorityTally(fractional)).toThrow(RangeError);
  });
});
