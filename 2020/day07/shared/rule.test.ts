import { describe, expect, it } from 'vitest';
import {
  BagContainment,
  BagRule,
  DEFAULT_TARGET_COLOR,
  parseBagRule,
  validateBagColor,
} from './rule';

describe('validateBagColor', () => {
  it('accepts multi-word and single-word lowercase bag colors', () => {
    expect(DEFAULT_TARGET_COLOR).toBe('shiny gold');
    expect(validateBagColor('shiny gold')).toBe('shiny gold');
    expect(validateBagColor('crimson')).toBe('crimson');
    expect(validateBagColor('pale light blue')).toBe('pale light blue');
  });

  it('rejects empty, uppercase, padded, or non-alphabetic bag colors', () => {
    for (const bad of ['', ' shiny gold', 'shiny  gold', 'Shiny Gold', 'red 2', 'red-blue']) {
      expect(() => validateBagColor(bad)).toThrow(RangeError);
    }
  });
});

describe('BagContainment and BagRule', () => {
  it('constructs frozen BagContainment and rejects non-positive quantity', () => {
    const item = new BagContainment('bright white', 2n);
    expect(item.color).toBe('bright white');
    expect(item.quantity).toBe(2n);
    expect(Object.isFrozen(item)).toBe(true);
    expect(() => new BagContainment('bright white', 0n)).toThrow(RangeError);
    expect(() => new BagContainment('bright white', -1n)).toThrow(RangeError);
    expect(() => new BagContainment('BAD', 1n)).toThrow(RangeError);
  });

  it('constructs frozen BagRule and rejects duplicate inner colors', () => {
    const a = new BagContainment('bright white', 1n);
    const b = new BagContainment('muted yellow', 2n);
    const rule = new BagRule('light red', [a, b]);
    expect(rule.color).toBe('light red');
    expect(rule.contents).toEqual([a, b]);
    expect(Object.isFrozen(rule)).toBe(true);
    expect(Object.isFrozen(rule.contents)).toBe(true);
    expect(() => new BagRule('light red', [a, new BagContainment('bright white', 3n)])).toThrow(
      Error,
    );
  });
});

describe('parseBagRule', () => {
  it('parses empty rules and single/plural containment lists', () => {
    const empty = parseBagRule('  faded blue bags contain no other bags.  ');
    expect(empty.color).toBe('faded blue');
    expect(empty.contents).toEqual([]);

    const multi = parseBagRule('shiny gold bags contain 1 dark olive bag, 2 vibrant plum bags.');
    expect(multi.color).toBe('shiny gold');
    expect(multi.contents).toEqual([
      new BagContainment('dark olive', 1n),
      new BagContainment('vibrant plum', 2n),
    ]);
  });

  it('rejects malformed syntax, invalid quantities, and singular/plural mismatches', () => {
    const badSyntax = [
      'light red bags contain 1 bright white bag',
      'light red contains 1 bright white bag.',
      'light red bags contain 0 bright white bags.',
      'light red bags contain 01 bright white bag.',
      'light red bags contain 1 bright white bags.',
      'light red bags contain 2 bright white bag.',
      'light red bags contain 1 bright white bag,',
    ];
    for (const line of badSyntax) {
      expect(() => parseBagRule(line)).toThrow(SyntaxError);
    }
    expect(() => parseBagRule('Shiny Gold bags contain no other bags.')).toThrow(RangeError);
  });
});
