import { describe, expect, it } from 'vitest';
import { ElfInventory, parseCalorieInventories } from './inventory';

describe('ElfInventory', () => {
  it('creates a frozen value object with defensive copy and dynamic getters', () => {
    const source = [1000, 2000, 3000];
    const elf = new ElfInventory(1, source);
    source[0] = 9999;

    expect(elf.elfNumber).toBe(1);
    expect(elf.items).toEqual([1000, 2000, 3000]);
    expect(elf.itemCount).toBe(3);
    expect(elf.totalCalories).toBe(6000);
    expect(Object.isFrozen(elf)).toBe(true);
    expect(Object.isFrozen(elf.items)).toBe(true);
  });

  it('rejects invalid elfNumber, empty items, invalid items, and sum overflow', () => {
    expect(() => new ElfInventory(0, [100])).toThrow(RangeError);
    expect(() => new ElfInventory(1.5, [100])).toThrow(RangeError);
    expect(() => new ElfInventory(Number.MAX_SAFE_INTEGER + 1, [100])).toThrow(RangeError);
    expect(() => new ElfInventory(1, [])).toThrow(RangeError);
    expect(() => new ElfInventory(1, [0])).toThrow(RangeError);
    expect(() => new ElfInventory(1, [-10])).toThrow(RangeError);
    expect(() => new ElfInventory(1, [2.5])).toThrow(RangeError);
    expect(() => new ElfInventory(1, [Number.MAX_SAFE_INTEGER, 1])).toThrow(RangeError);
  });
});

describe('parseCalorieInventories', () => {
  it('parses multi-block calorie input into frozen ElfInventory instances', () => {
    const raw = '1000\n2000\n3000\n\n4000\n\n5000\n6000\n\n7000\n8000\n9000\n\n10000';
    const elves = parseCalorieInventories(raw);

    expect(Object.isFrozen(elves)).toBe(true);
    expect(elves).toHaveLength(5);
    expect(elves.map((e) => [e.elfNumber, e.totalCalories])).toEqual([
      [1, 6000],
      [2, 4000],
      [3, 11000],
      [4, 24000],
      [5, 10000],
    ]);
  });

  it('tolerates CRLF, leading/trailing blanks, spaces, and multiple blank lines', () => {
    const raw = '\r\n  \r\n 100 \r\n200\r\n\r\n\r\n\t300\r\n\r\n';
    const elves = parseCalorieInventories(raw);

    expect(elves).toHaveLength(2);
    expect(elves[0]?.items).toEqual([100, 200]);
    expect(elves[1]?.items).toEqual([300]);
  });

  it('throws descriptive errors for empty input and invalid lines with 1-based line numbers', () => {
    expect(() => parseCalorieInventories('')).toThrow(Error);
    expect(() => parseCalorieInventories('  \n\t\r\n ')).toThrow(Error);
    expect(() => parseCalorieInventories('100\nfoo\n200')).toThrow(/Line 2:/);
    expect(() => parseCalorieInventories('100\n-5')).toThrow(/Line 2:/);
    expect(() => parseCalorieInventories('100\n\n0')).toThrow(/Line 3:/);
    expect(() => parseCalorieInventories('9007199254740992')).toThrow(/Line 1:/);
  });
});
