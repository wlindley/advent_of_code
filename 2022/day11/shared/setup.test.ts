import { describe, expect, it } from 'vitest';
import { AddConstantOperation, MultiplyConstantOperation, SquareOperation } from './operation';
import { KeepAwaySetup, MonkeySpec } from './setup';

const EXAMPLE_INPUT = [
  'Monkey 0:',
  '  Starting items: 79, 98',
  '  Operation: new = old * 19',
  '  Test: divisible by 23',
  '    If true: throw to monkey 2',
  '    If false: throw to monkey 3',
  '',
  'Monkey 1:',
  '  Starting items: 54, 65, 75, 74',
  '  Operation: new = old + 6',
  '  Test: divisible by 19',
  '    If true: throw to monkey 2',
  '    If false: throw to monkey 0',
  '',
  'Monkey 2:',
  '  Starting items: 79, 60, 97',
  '  Operation: new = old * old',
  '  Test: divisible by 13',
  '    If true: throw to monkey 1',
  '    If false: throw to monkey 3',
  '',
  'Monkey 3:',
  '  Starting items: 74',
  '  Operation: new = old + 3',
  '  Test: divisible by 17',
  '    If true: throw to monkey 0',
  '    If false: throw to monkey 1',
].join('\n');

const op = new AddConstantOperation(1n);

describe('MonkeySpec validation and immutability', () => {
  it('freezes spec and copies startingItems', () => {
    const items = [10n, 20n];
    const spec = new MonkeySpec(0, items, op, 5n, 1, 1);
    items.push(99n);
    expect(Object.isFrozen(spec)).toBe(true);
    expect(Object.isFrozen(spec.startingItems)).toBe(true);
    expect(spec.startingItems).toEqual([10n, 20n]);
    expect(spec.trueTarget).toBe(1);
    expect(spec.falseTarget).toBe(1);
  });

  it('rejects negative or non-integer id', () => {
    expect(() => new MonkeySpec(-1, [], op, 2n, 1, 1)).toThrow(RangeError);
    expect(() => new MonkeySpec(1.5, [], op, 2n, 0, 0)).toThrow(RangeError);
  });

  it('rejects negative item worry level', () => {
    expect(() => new MonkeySpec(0, [-1n], op, 2n, 1, 1)).toThrow(RangeError);
  });

  it('rejects non-positive divisor', () => {
    expect(() => new MonkeySpec(0, [], op, 0n, 1, 1)).toThrow(RangeError);
    expect(() => new MonkeySpec(0, [], op, -3n, 1, 1)).toThrow(RangeError);
  });

  it('rejects invalid or self-referencing targets', () => {
    expect(() => new MonkeySpec(0, [], op, 2n, -1, 1)).toThrow(RangeError);
    expect(() => new MonkeySpec(0, [], op, 2n, 1, 1.5)).toThrow(RangeError);
    expect(() => new MonkeySpec(0, [], op, 2n, 0, 1)).toThrow(RangeError);
    expect(() => new MonkeySpec(1, [], op, 2n, 0, 1)).toThrow(RangeError);
  });
});

describe('KeepAwaySetup validation and derived getters', () => {
  it('computes monkeyCount, totalItems, and non-coprime commonModulus', () => {
    const m0 = new MonkeySpec(0, [1n, 2n], op, 6n, 1, 1);
    const m1 = new MonkeySpec(1, [3n], op, 10n, 0, 0);
    const setup = new KeepAwaySetup([m0, m1]);
    expect(Object.isFrozen(setup)).toBe(true);
    expect(Object.isFrozen(setup.monkeys)).toBe(true);
    expect(setup.monkeyCount).toBe(2);
    expect(setup.totalItems).toBe(3);
    expect(setup.commonModulus).toBe(30n);
  });

  it('rejects fewer than 2 monkeys', () => {
    const m0 = new MonkeySpec(0, [], op, 2n, 1, 1);
    expect(() => new KeepAwaySetup([m0])).toThrow(RangeError);
  });

  it('rejects non-contiguous monkey ids', () => {
    const m0 = new MonkeySpec(0, [], op, 2n, 1, 1);
    const m2 = new MonkeySpec(2, [], op, 3n, 0, 0);
    expect(() => new KeepAwaySetup([m0, m2])).toThrow(RangeError);
  });

  it('rejects out-of-range targets', () => {
    const m0 = new MonkeySpec(0, [], op, 2n, 2, 1);
    const m1 = new MonkeySpec(1, [], op, 3n, 0, 0);
    expect(() => new KeepAwaySetup([m0, m1])).toThrow(RangeError);
    const m1Bad = new MonkeySpec(1, [], op, 3n, 0, 5);
    expect(() => new KeepAwaySetup([new MonkeySpec(0, [], op, 2n, 1, 1), m1Bad])).toThrow(RangeError);
  });
});

describe('KeepAwaySetup.parse', () => {
  it('parses the 4-monkey example setup accurately', () => {
    const setup = KeepAwaySetup.parse(EXAMPLE_INPUT);
    expect(setup.monkeyCount).toBe(4);
    expect(setup.totalItems).toBe(10);
    expect(setup.commonModulus).toBe(23n * 19n * 13n * 17n);
    expect(setup.monkeys[0]!.startingItems).toEqual([79n, 98n]);
    expect(setup.monkeys[0]!.operation).toBeInstanceOf(MultiplyConstantOperation);
    expect(setup.monkeys[2]!.operation).toBeInstanceOf(SquareOperation);
    expect(setup.monkeys[3]!.trueTarget).toBe(0);
    expect(setup.monkeys[3]!.falseTarget).toBe(1);
  });

  it('handles CRLF line endings, empty Starting items, and 2-monkey same-target', () => {
    const raw = [
      'Monkey 0:',
      '  Starting items:',
      '  Operation: new = old + 2',
      '  Test: divisible by 4',
      '    If true: throw to monkey 1',
      '    If false: throw to monkey 1',
      '',
      'Monkey 1:',
      '  Starting items: 5',
      '  Operation: new = old * 3',
      '  Test: divisible by 6',
      '    If true: throw to monkey 0',
      '    If false: throw to monkey 0',
    ].join('\r\n');
    const setup = KeepAwaySetup.parse(raw);
    expect(setup.monkeys[0]!.startingItems).toEqual([]);
    expect(setup.commonModulus).toBe(12n);
    expect(setup.monkeys[0]!.trueTarget).toBe(1);
    expect(setup.monkeys[0]!.falseTarget).toBe(1);
  });

  it('rejects blank input', () => {
    expect(() => KeepAwaySetup.parse('   \n  ')).toThrow(Error);
  });

  it('rejects block with wrong number of lines', () => {
    const bad = 'Monkey 0:\n  Starting items: 1';
    expect(() => KeepAwaySetup.parse(bad)).toThrow(Error);
  });

  it('rejects malformed monkey header, test, or target lines', () => {
    const base = EXAMPLE_INPUT.split('\n\n')[0]!;
    const second = EXAMPLE_INPUT.split('\n\n')[1]!;
    expect(() => KeepAwaySetup.parse(`${base.replace('Monkey 0:', 'Ape 0:')}\n\n${second}`)).toThrow(Error);
    expect(() => KeepAwaySetup.parse(`${base.replace('divisible by 23', 'divisible by 0')}\n\n${second}`)).toThrow(RangeError);
    expect(() => KeepAwaySetup.parse(`${base.replace('throw to monkey 2', 'throw to 2')}\n\n${second}`)).toThrow(Error);
  });

  it('rejects trailing comma or negative/non-integer starting items', () => {
    const [b0, b1] = EXAMPLE_INPUT.split('\n\n');
    expect(() => KeepAwaySetup.parse(`${b0!.replace('79, 98', '79, 98,')}\n\n${b1}`)).toThrow(Error);
    expect(() => KeepAwaySetup.parse(`${b0!.replace('79, 98', '79, -5')}\n\n${b1}`)).toThrow(Error);
    expect(() => KeepAwaySetup.parse(`${b0!.replace('79, 98', '79, abc')}\n\n${b1}`)).toThrow(Error);
  });
});
