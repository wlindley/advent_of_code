import { describe, expect, it } from 'vitest';
import { parseRucksacks, Rucksack } from '../../shared';
import { ELF_GROUP_SIZE, ElfGroup, parseElfGroups, partitionElfGroups } from './elfGroup';

const EXAMPLE_INPUT = [
  'vJrwpWtwJgWrhcsFMMfFFhFp',
  'jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL',
  'PmmdzqPrVvPwwTWBwg',
  'wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn',
  'ttgJtRGJQctTZtZT',
  'CrZsJsPPZsGzwwsLwLmpwMDw',
].join('\n');

describe('2022 day 03 part 2 ElfGroup', () => {
  it('freezes ElfGroup and rucksacks tuple and computes dynamic badge properties', () => {
    const [a, b, c] = parseRucksacks('ab\ncb\neb');
    const group = new ElfGroup(1, a!, b!, c!);

    expect(ELF_GROUP_SIZE).toBe(3);
    expect(Object.isFrozen(group)).toBe(true);
    expect(Object.isFrozen(group.rucksacks)).toBe(true);
    expect(group.groupNumber).toBe(1);
    expect(group.rucksacks).toEqual([a, b, c]);
    expect(group.badgeMask).toBe(2n);
    expect(group.badgePriority).toBe(2);
    expect(group.badgeItem).toBe('b');
  });

  it('finds badges across different compartments and with duplicate items', () => {
    const [a, b, c] = parseRucksacks('Zaab\ncdZe\nZZfg');
    const group = new ElfGroup(2, a!, b!, c!);

    expect(group.badgeItem).toBe('Z');
    expect(group.badgePriority).toBe(52);
  });

  it('rejects invalid groupNumber values', () => {
    const [a, b, c] = parseRucksacks('aa\naa\naa');
    for (const bad of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new ElfGroup(bad, a!, b!, c!)).toThrow(RangeError);
    }
  });

  it('rejects 0-common, pairwise-only, and multi-common badge candidates', () => {
    const zeroCommon = parseRucksacks('ab\ncd\nef');
    const pairwiseOnly = parseRucksacks('ab\nbc\nca');
    const multiCommon = parseRucksacks('abcd\nabef\nabgh');

    const gZero = new ElfGroup(1, zeroCommon[0]!, zeroCommon[1]!, zeroCommon[2]!);
    const gPair = new ElfGroup(1, pairwiseOnly[0]!, pairwiseOnly[1]!, pairwiseOnly[2]!);
    const gMulti = new ElfGroup(1, multiCommon[0]!, multiCommon[1]!, multiCommon[2]!);

    expect(gZero.badgeMask).toBe(0n);
    expect(() => gZero.badgePriority).toThrow(RangeError);
    expect(() => gZero.badgeItem).toThrow(RangeError);

    expect(gPair.badgeMask).toBe(0n);
    expect(() => gPair.badgePriority).toThrow(RangeError);

    expect(() => gMulti.badgePriority).toThrow(RangeError);
    expect(() => gMulti.badgeItem).toThrow(RangeError);
  });

  it('partitions valid rucksack counts (3 and 6) and rejects invalid counts (0, 1, 2, 4)', () => {
    const makeSacks = (n: number): readonly Rucksack[] =>
      Array.from({ length: n }, (_, i) => new Rucksack(i + 1, 'ab'));

    for (const badLen of [0, 1, 2, 4]) {
      expect(() => partitionElfGroups(makeSacks(badLen))).toThrow(RangeError);
    }

    const oneGroup = partitionElfGroups(makeSacks(3));
    expect(Object.isFrozen(oneGroup)).toBe(true);
    expect(oneGroup).toHaveLength(1);
    expect(oneGroup[0]!.groupNumber).toBe(1);

    const twoGroups = partitionElfGroups(makeSacks(6));
    expect(twoGroups).toHaveLength(2);
    expect(twoGroups[0]!.groupNumber).toBe(1);
    expect(twoGroups[1]!.groupNumber).toBe(2);
  });

  it('parses the official example into two ElfGroups with badges r and Z', () => {
    const groups = parseElfGroups(EXAMPLE_INPUT);
    expect(Object.isFrozen(groups)).toBe(true);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.badgeItem).toBe('r');
    expect(groups[0]!.badgePriority).toBe(18);
    expect(groups[1]!.badgeItem).toBe('Z');
    expect(groups[1]!.badgePriority).toBe(52);
  });
});
