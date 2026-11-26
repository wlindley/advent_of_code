import { describe, expect, it } from 'vitest';
import { buildDirectionalCostTable, reconstructLayerSequences } from './dp';
import { DIRECTIONAL_KEYPAD, NUMERIC_KEYPAD } from './keypad';
import { parseDoorCodes } from './parser';
import { simulateKeypad, simulateRobotChain } from './simulator';

const OFFICIAL_EXAMPLE = '029A\n980A\n179A\n456A\n379A';

describe('simulateKeypad and simulateRobotChain', () => {
  it('simulates single-keypad commands and rejects invalid commands or gap/out-of-bounds moves', () => {
    expect(simulateKeypad(NUMERIC_KEYPAD, '<A^A>^^AvvvA')).toBe('029A');
    expect(simulateKeypad(DIRECTIONAL_KEYPAD, 'v<<A>>^A')).toBe('<A');

    expect(() => simulateKeypad(NUMERIC_KEYPAD, 'X')).toThrow(RangeError);
    expect(() => simulateKeypad(NUMERIC_KEYPAD, '<<')).toThrow(RangeError);
    expect(() => simulateKeypad(NUMERIC_KEYPAD, '>')).toThrow(RangeError);
    expect(() => simulateKeypad(DIRECTIONAL_KEYPAD, '<<')).toThrow(RangeError);
    expect(() => simulateKeypad(DIRECTIONAL_KEYPAD, '^')).toThrow(RangeError);
  });

  it('round-trips reconstructed Layer D sequences across all 5 example codes for D=0, 1, 2', () => {
    const codes = parseDoorCodes(OFFICIAL_EXAMPLE);
    for (const depth of [0, 1, 2]) {
      const table = buildDirectionalCostTable(depth);
      for (const code of codes) {
        const layers = reconstructLayerSequences(code, table, 1000);
        expect(layers).not.toBeNull();
        expect(simulateRobotChain(layers![depth]!, depth)).toBe(code.raw);
      }
    }
    expect(() => simulateRobotChain('A', -1)).toThrow(RangeError);
  });
});
