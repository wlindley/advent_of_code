import { describe, expect, it } from 'vitest';
import { itemPriority, priorityToItem, Rucksack } from '../../shared';
import { ElfGroup, parseElfGroups } from './elfGroup';
import { solvePart2, solver, tracePart2 } from './solver';

const EXAMPLE_INPUT = [
  'vJrwpWtwJgWrhcsFMMfFFhFp',
  'jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL',
  'PmmdzqPrVvPwwTWBwg',
  'wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn',
  'ttgJtRGJQctTZtZT',
  'CrZsJsPPZsGzwwsLwLmpwMDw',
].join('\n');

function oracleSolve(groups: readonly ElfGroup[]): number {
  let sum = 0;
  for (const group of groups) {
    const [first, second, third] = group.rucksacks;
    const setA = new Set(first.raw.split(''));
    const setB = new Set(second.raw.split(''));
    const common = new Set<string>();
    for (const ch of third.raw) {
      if (setA.has(ch) && setB.has(ch)) common.add(ch);
    }
    const [badge] = [...common];
    sum += itemPriority(badge!);
  }
  return sum;
}

function buildSyntheticGroups(count: number): readonly ElfGroup[] {
  const groups: ElfGroup[] = [];
  for (let i = 0; i < count; i += 1) {
    const badge = priorityToItem((i % 52) + 1);
    const f1 = priorityToItem(((i + 1) % 52) + 1);
    const f2 = priorityToItem(((i + 2) % 52) + 1);
    const f3 = priorityToItem(((i + 3) % 52) + 1);
    const r1 = new Rucksack(i * 3 + 1, `${f1}${badge}${f1}${f2}`);
    const r2 = new Rucksack(i * 3 + 2, `${f2}${f3}${badge}${f3}`);
    const r3 = new Rucksack(i * 3 + 3, `${badge}${f1}${f3}${badge}`);
    groups.push(new ElfGroup(i + 1, r1, r2, r3));
  }
  return groups;
}

describe('2022 day 03 part 2 solver', () => {
  it('solves the official example to 70 via solver pipeline', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(70);
    const frames = solver.trace!(parsed);
    expect(frames).toHaveLength(2);
    expect(frames[0]!.group.badgeItem).toBe('r');
    expect(frames[1]!.group.badgeItem).toBe('Z');
    expect(frames[1]!.tally.totalPriority).toBe(70);
    expect(frames[1]!.tally.totalItems).toBe(2);
  });

  it('handles boundary badge priorities a/z/A/Z summing to 106', () => {
    const boundaries = parseElfGroups(
      ['aa', 'ba', 'ca', 'zz', 'az', 'bz', 'AA', 'aA', 'bA', 'ZZ', 'aZ', 'bZ'].join('\n'),
    );
    expect(solvePart2(boundaries)).toBe(1 + 26 + 27 + 52);
  });

  it('rejects empty group lists and groups without a unique 3-way badge', () => {
    expect(() => solvePart2([])).toThrow(RangeError);
    expect(() => tracePart2([])).toThrow(RangeError);

    const pairwise = new ElfGroup(1, new Rucksack(1, 'ab'), new Rucksack(2, 'bc'), new Rucksack(3, 'ca'));
    const multi = new ElfGroup(1, new Rucksack(1, 'ab'), new Rucksack(2, 'ab'), new Rucksack(3, 'ab'));
    expect(() => solvePart2([pairwise])).toThrow(RangeError);
    expect(() => solvePart2([multi])).toThrow(RangeError);
    expect(() => tracePart2([pairwise])).toThrow(RangeError);
    expect(() => tracePart2([multi])).toThrow(RangeError);
  });

  it('samples bounded trace frames on 150 groups and validates maxSteps', () => {
    const groups = buildSyntheticGroups(150);
    const expected = solvePart2(groups);

    const defaultFrames = tracePart2(groups);
    expect(Object.isFrozen(defaultFrames)).toBe(true);
    expect(Object.isFrozen(defaultFrames[0]!)).toBe(true);
    expect(defaultFrames).toHaveLength(120);
    expect(defaultFrames[0]!.groupIndex).toBe(0);
    expect(defaultFrames[119]!.groupIndex).toBe(149);
    expect(defaultFrames[119]!.tally.totalPriority).toBe(expected);
    expect(defaultFrames[119]!.tally.totalItems).toBe(150);

    const twentyFrames = tracePart2(groups, { maxSteps: 20 });
    expect(twentyFrames).toHaveLength(20);
    expect(twentyFrames[0]!.stepIndex).toBe(0);
    expect(twentyFrames[19]!.stepIndex).toBe(19);
    expect(twentyFrames[19]!.totalSteps).toBe(20);
    expect(twentyFrames[19]!.totalGroups).toBe(150);
    expect(twentyFrames[19]!.tally.totalPriority).toBe(expected);

    const singleFrame = tracePart2(groups, { maxSteps: 1 });
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.groupIndex).toBe(149);
    expect(singleFrame[0]!.tally.totalPriority).toBe(expected);

    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => tracePart2(groups, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches an independent 3-way Set<string> differential oracle across 156 synthetic groups', () => {
    const groups = buildSyntheticGroups(156);
    expect(solvePart2(groups)).toBe(oracleSolve(groups));
  });
});
