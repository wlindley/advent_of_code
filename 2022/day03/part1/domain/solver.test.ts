import { describe, expect, it } from 'vitest';
import { itemPriority, parseRucksacks, priorityToItem, Rucksack } from '../../shared';
import { solvePart1, solver, tracePart1 } from './solver';

const EXAMPLE_INPUT = [
  'vJrwpWtwJgWrhcsFMMfFFhFp',
  'jqHRNqRjqzjGDLGLrsFMfFZSrLrFZsSL',
  'PmmdzqPrVvPwwTWBwg',
  'wMqvLMZHhHMvwLHjbvcjnnSBnvTQFn',
  'ttgJtRGJQctTZtZT',
  'CrZsJsPPZsGzwwsLwLmpwMDw',
].join('\n');

function oracleSolve(rucksacks: readonly Rucksack[]): number {
  let sum = 0;
  for (const rucksack of rucksacks) {
    const left = new Set(rucksack.firstCompartment.split(''));
    const common = new Set<string>();
    for (const ch of rucksack.secondCompartment) {
      if (left.has(ch)) common.add(ch);
    }
    const [only] = [...common];
    sum += itemPriority(only!);
  }
  return sum;
}

function buildSyntheticRucksacks(count: number): readonly Rucksack[] {
  const sacks: Rucksack[] = [];
  for (let i = 0; i < count; i += 1) {
    const targetPriority = (i % 52) + 1;
    const fillerAPriority = ((i + 1) % 52) + 1;
    const fillerBPriority = ((i + 2) % 52) + 1;
    const fillerCPriority = ((i + 3) % 52) + 1;
    const target = priorityToItem(targetPriority);
    const a = priorityToItem(fillerAPriority);
    const b = priorityToItem(fillerBPriority);
    const c = priorityToItem(fillerCPriority);
    const left = i % 2 === 0 ? `${a}${target}${a}` : `${target}${b}${a}`;
    const right = i % 3 === 0 ? `${c}${target}${c}` : `${target}${c}${target}`;
    sacks.push(new Rucksack(i + 1, `${left}${right}`));
  }
  return sacks;
}

describe('2022 day 03 part 1 solver', () => {
  it('solves the official example to 157 via solver pipeline', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(157);
    const frames = solver.trace!(parsed);
    expect(frames).toHaveLength(6);
    expect(frames[0]!.rucksack.misplacedItem).toBe('p');
    expect(frames[5]!.tally.totalPriority).toBe(157);
    expect(frames[5]!.tally.totalItems).toBe(6);
  });

  it('handles boundary priorities a/z/A/Z and duplicate items within compartments', () => {
    const boundaries = parseRucksacks('aa\nzz\nAA\nZZ');
    expect(solvePart1(boundaries)).toBe(1 + 26 + 27 + 52);

    const duplicates = parseRucksacks('ppapqb\nMMNMoM');
    expect(solvePart1(duplicates)).toBe(16 + 39);
  });

  it('rejects empty rucksack arrays, 0-overlap, and multi-overlap rucksacks', () => {
    expect(() => solvePart1([])).toThrow(RangeError);
    expect(() => tracePart1([])).toThrow(RangeError);

    expect(() => solvePart1([new Rucksack(1, 'ab')])).toThrow(RangeError);
    expect(() => solvePart1([new Rucksack(1, 'abab')])).toThrow(RangeError);
    expect(() => tracePart1([new Rucksack(1, 'ab')])).toThrow(RangeError);
    expect(() => tracePart1([new Rucksack(1, 'abab')])).toThrow(RangeError);
  });

  it('samples bounded trace frames on 300 rucksacks and validates maxSteps', () => {
    const sacks = buildSyntheticRucksacks(300);
    const expected = solvePart1(sacks);

    const defaultFrames = tracePart1(sacks);
    expect(Object.isFrozen(defaultFrames)).toBe(true);
    expect(defaultFrames).toHaveLength(120);
    expect(defaultFrames[0]!.rucksackIndex).toBe(0);
    expect(defaultFrames[119]!.rucksackIndex).toBe(299);
    expect(defaultFrames[119]!.tally.totalPriority).toBe(expected);
    expect(defaultFrames[119]!.tally.totalItems).toBe(300);

    const twentyFrames = tracePart1(sacks, { maxSteps: 20 });
    expect(twentyFrames).toHaveLength(20);
    expect(twentyFrames[0]!.stepIndex).toBe(0);
    expect(twentyFrames[19]!.stepIndex).toBe(19);
    expect(twentyFrames[19]!.totalSteps).toBe(20);
    expect(twentyFrames[19]!.totalRucksacks).toBe(300);
    expect(twentyFrames[19]!.tally.totalPriority).toBe(expected);

    const singleFrame = tracePart1(sacks, { maxSteps: 1 });
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.rucksackIndex).toBe(299);
    expect(singleFrame[0]!.tally.totalPriority).toBe(expected);

    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => tracePart1(sacks, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches an independent Set<string> differential oracle across 312 synthetic rucksacks', () => {
    const sacks = buildSyntheticRucksacks(312);
    expect(solvePart1(sacks)).toBe(oracleSolve(sacks));
  });
});
