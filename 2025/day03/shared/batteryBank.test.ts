import { describe, expect, it } from 'vitest';
import { BatteryBank, JoltageSelection, parseBatteryBanks } from './index';

function oracleBestSelection(bank: BatteryBank, k: number): { joltage: bigint; indices: number[] } {
  let bestJoltage = -1n;
  let bestIndices: number[] = [];
  const picked: number[] = [];

  function dfs(start: number): void {
    if (picked.length === k) {
      const value = BigInt(picked.map((i) => bank.raw[i]!).join(''));
      if (value > bestJoltage) {
        bestJoltage = value;
        bestIndices = [...picked];
      }
      return;
    }
    const maxStart = bank.length - (k - picked.length);
    for (let i = start; i <= maxStart; i++) {
      picked.push(i);
      dfs(i + 1);
      picked.pop();
    }
  }

  dfs(0);
  return { joltage: bestJoltage, indices: bestIndices };
}

describe('BatteryBank and JoltageSelection', () => {
  it('constructs valid BatteryBank and rejects invalid digits', () => {
    const bank = new BatteryBank('987654321');
    expect(bank.raw).toBe('987654321');
    expect(bank.length).toBe(9);
    expect(Object.isFrozen(bank)).toBe(true);

    for (const bad of ['', '0', '109', '12a3', ' 12', '12 ']) {
      expect(() => new BatteryBank(bad)).toThrow();
    }
  });

  it('constructs frozen JoltageSelection with defensive copy and derived getters', () => {
    const bank = new BatteryBank('91827');
    const source = [0, 2, 4];
    const sel = new JoltageSelection(bank, source);
    source[0] = 1;

    expect(sel.indices).toEqual([0, 2, 4]);
    expect(sel.count).toBe(3);
    expect(sel.digits).toBe('987');
    expect(sel.joltage).toBe(987n);
    expect(Object.isFrozen(sel)).toBe(true);
    expect(Object.isFrozen(sel.indices)).toBe(true);

    for (const bad of [[], [-1], [5], [1.5], [Number.NaN], [1, 1], [2, 1]]) {
      expect(() => new JoltageSelection(bank, bad)).toThrow(RangeError);
    }
  });

  it('parses LF/CRLF banks and rejects empty or invalid lines with context', () => {
    const parsed = parseBatteryBanks('  19\r\n827\n34  ');
    expect(parsed.map((b) => b.raw)).toEqual(['19', '827', '34']);
    expect(Object.isFrozen(parsed)).toBe(true);

    expect(() => parseBatteryBanks('')).toThrow();
    expect(() => parseBatteryBanks('   \r\n\t ')).toThrow();
    expect(() => parseBatteryBanks('123\n\n456')).toThrow(/Line 2:/);
    expect(() => parseBatteryBanks('123\n405')).toThrow(/Line 2:/);
  });

  it('validates count and handles edge cases including 25-digit BigInt', () => {
    const bank = new BatteryBank('811119');
    for (const bad of [0, -1, 1.5, Number.NaN, 7]) {
      expect(() => bank.selectMaxJoltage(bad)).toThrow(RangeError);
    }

    expect(bank.selectMaxJoltage(1).joltage).toBe(9n);
    expect(bank.selectMaxJoltage(6).joltage).toBe(811119n);
    expect(new BatteryBank('98765').selectMaxJoltage(2).joltage).toBe(98n);
    expect(new BatteryBank('12345').selectMaxJoltage(2).joltage).toBe(45n);
    expect(bank.selectMaxJoltage(2).joltage).toBe(89n);
    expect(new BatteryBank('91919').selectMaxJoltage(2).indices).toEqual([0, 2]);
    expect(new BatteryBank('5555').selectMaxJoltage(2).indices).toEqual([0, 1]);

    const big = new BatteryBank('1234567891234567891234567');
    const bigSel = big.selectMaxJoltage(20);
    expect(bigSel.digits).toBe('67891234567891234567');
    expect(bigSel.joltage).toBe(67891234567891234567n);
  });

  it('matches recursive combination oracle for joltage and exact indices across k=1..L', () => {
    const samples = ['9', '19', '91', '5555', '811119', '91919', '234234278', '8181819112111'];
    for (const raw of samples) {
      const bank = new BatteryBank(raw);
      for (let k = 1; k <= bank.length; k++) {
        const actual = bank.selectMaxJoltage(k);
        const expected = oracleBestSelection(bank, k);
        expect(actual.joltage).toBe(expected.joltage);
        expect(actual.indices).toEqual(expected.indices);
      }
    }
  });
});
