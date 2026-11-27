import { describe, expect, it } from 'vitest';
import {
  assertUint36,
  Bitmask,
  DockingProgram,
  MAX_FLOATING_BITS,
  parseDockingProgram,
  WORD_BITS,
  WORD_MASK,
} from './model';

const SAMPLE_MASK = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXX1XXXX0X';
const V2_MASK_ONE = '000000000000000000000000000000X1001X';
const V2_MASK_TWO = '00000000000000000000000000000000X0XX';

describe('2020 Day 14 model: assertUint36 & constants', () => {
  it('exposes 36-bit constants and validates uint36 bounds', () => {
    expect(WORD_BITS).toBe(36);
    expect(WORD_MASK).toBe((1n << 36n) - 1n);
    expect(MAX_FLOATING_BITS).toBe(18);
    expect(assertUint36(0n, 'v')).toBe(0n);
    expect(assertUint36(WORD_MASK, 'v')).toBe(WORD_MASK);
    expect(() => assertUint36(-1n, 'value')).toThrow(RangeError);
    expect(() => assertUint36(WORD_MASK + 1n, 'address')).toThrow(RangeError);
  });
});

describe('2020 Day 14 model: Bitmask', () => {
  it('validates 36-char [01X] patterns, freezes, and derives counts/masks dynamically', () => {
    const mask = new Bitmask(SAMPLE_MASK);
    expect(Object.isFrozen(mask)).toBe(true);
    expect(mask.pattern).toBe(SAMPLE_MASK);
    expect(mask.setMask).toBe(64n);
    expect(mask.forcedOneCount).toBe(1);
    expect(mask.forcedZeroCount).toBe(1);
    expect(mask.floatingCount).toBe(34);
    expect(mask.floatingMask).toBe(WORD_MASK ^ 66n);
    expect(mask.expandedAddressCount).toBe(1n << 34n);

    expect(() => new Bitmask('10X')).toThrow(RangeError);
    expect(() => new Bitmask(`${'X'.repeat(35)}2`)).toThrow(RangeError);
  });

  it('applies Part 1 value masks and Part 2 base/expanded addresses', () => {
    const v1 = new Bitmask(SAMPLE_MASK);
    expect(v1.applyToValue(11n)).toBe(73n);
    expect(v1.applyToValue(101n)).toBe(101n);
    expect(v1.applyToValue(0n)).toBe(64n);
    expect(() => v1.applyToValue(-1n)).toThrow(RangeError);

    const v2a = new Bitmask(V2_MASK_ONE);
    expect(v2a.baseAddressFor(42n)).toBe(26n);
    expect([...v2a.expandedAddresses(42n)]).toEqual([26n, 27n, 58n, 59n]);

    const v2b = new Bitmask(V2_MASK_TWO);
    expect([...v2b.expandedAddresses(26n)]).toEqual([16n, 17n, 18n, 19n, 24n, 25n, 26n, 27n]);

    const concrete = new Bitmask('0'.repeat(36));
    expect([...concrete.expandedAddresses(15n)]).toEqual([15n]);

    const allOnes = new Bitmask('1'.repeat(36));
    expect(allOnes.baseAddressFor(0n)).toBe(WORD_MASK);
    expect([...allOnes.expandedAddresses(0n)]).toEqual([WORD_MASK]);
  });

  it('validates address range and floating-bit cap synchronously before yielding', () => {
    const overCap = new Bitmask(`${'0'.repeat(17)}${'X'.repeat(19)}`);
    expect(() => overCap.expandedAddresses(0n)).toThrow(RangeError);

    const exactCap = new Bitmask(`${'0'.repeat(18)}${'X'.repeat(18)}`);
    const iter = exactCap.expandedAddresses(0n);
    expect(iter.next().value).toBe(0n);

    const v2 = new Bitmask(V2_MASK_ONE);
    expect(() => v2.expandedAddresses(WORD_MASK + 1n)).toThrow(RangeError);
  });
});

describe('2020 Day 14 model: DockingProgram & parseDockingProgram', () => {
  it('parses CRLF/blank lines, freezes structures, and rejects invalid inputs', () => {
    const raw = [
      '',
      `mask = ${SAMPLE_MASK}`,
      'mem[8] = 11',
      '   ',
      'mem[7] = 101',
      'mem[8] = 0',
      '',
    ].join('\r\n');

    const program = parseDockingProgram(raw);
    expect(Object.isFrozen(program)).toBe(true);
    expect(Object.isFrozen(program.instructions)).toBe(true);
    expect(program.length).toBe(4);
    expect(program.initialMask.pattern).toBe(SAMPLE_MASK);
    expect(program.instructions[1]).toEqual({ kind: 'mem', address: 8n, value: 11n });

    expect(() => new DockingProgram([])).toThrow(RangeError);
    expect(() => new DockingProgram([{ kind: 'mem', address: 1n, value: 2n }])).toThrow(Error);
    expect(() => parseDockingProgram('   \n\n ')).toThrow(RangeError);
    expect(() => parseDockingProgram('mem[8] = 11')).toThrow(Error);
    expect(() => parseDockingProgram(`mask = ${SAMPLE_MASK}\nbad line`)).toThrow(/line 2/);
    expect(() => parseDockingProgram('mask = INVALID')).toThrow(RangeError);
    expect(() => parseDockingProgram(`mask = ${SAMPLE_MASK}\nmem[0] = ${WORD_MASK + 1n}`)).toThrow(RangeError);
  });
});
