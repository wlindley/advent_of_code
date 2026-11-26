import { describe, expect, it } from 'vitest';
import {
  AllowedValuesRule,
  HeightRule,
  PatternRule,
  STRICT_FIELD_RULES,
  YearRangeRule,
} from './fieldRules';

describe('YearRangeRule', () => {
  it('validates 4-digit integer years within inclusive bounds', () => {
    const rule = new YearRangeRule(1920, 2002);
    expect(Object.isFrozen(rule)).toBe(true);
    expect(rule.description).toBe('1920..2002 (4 digits)');
    expect(rule.isValid('1920')).toBe(true);
    expect(rule.isValid('2002')).toBe(true);
    expect(rule.isValid('1919')).toBe(false);
    expect(rule.isValid('2003')).toBe(false);
    expect(rule.isValid('01920')).toBe(false);
    expect(rule.isValid('abcd')).toBe(false);
  });

  it('rejects non-integer, out-of-range, or inverted bounds', () => {
    expect(() => new YearRangeRule(1920.5, 2002)).toThrow(RangeError);
    expect(() => new YearRangeRule(1920, 2002.5)).toThrow(RangeError);
    expect(() => new YearRangeRule(999, 2002)).toThrow(RangeError);
    expect(() => new YearRangeRule(1920, 10000)).toThrow(RangeError);
    expect(() => new YearRangeRule(2003, 2002)).toThrow(RangeError);
  });
});

describe('HeightRule', () => {
  it('validates cm and in heights with inclusive unit-specific bounds', () => {
    const rule = new HeightRule(150, 193, 59, 76);
    expect(Object.isFrozen(rule)).toBe(true);
    expect(rule.description).toBe('150-193cm or 59-76in');
    expect(rule.isValid('150cm')).toBe(true);
    expect(rule.isValid('193cm')).toBe(true);
    expect(rule.isValid('149cm')).toBe(false);
    expect(rule.isValid('194cm')).toBe(false);
    expect(rule.isValid('59in')).toBe(true);
    expect(rule.isValid('76in')).toBe(true);
    expect(rule.isValid('58in')).toBe(false);
    expect(rule.isValid('77in')).toBe(false);
    expect(rule.isValid('190')).toBe(false);
    expect(rule.isValid('0150cm')).toBe(false);
  });

  it('rejects invalid cm or in bounds', () => {
    expect(() => new HeightRule(0, 193, 59, 76)).toThrow(RangeError);
    expect(() => new HeightRule(150, 1000, 59, 76)).toThrow(RangeError);
    expect(() => new HeightRule(150, 193, 77, 76)).toThrow(RangeError);
  });
});

describe('PatternRule', () => {
  it('clones the regex and validates matching values', () => {
    const rule = new PatternRule(/^#[0-9a-f]{6}$/, '  hex color  ');
    expect(Object.isFrozen(rule)).toBe(true);
    expect(rule.description).toBe('hex color');
    expect(rule.isValid('#123abc')).toBe(true);
    expect(rule.isValid('#123abz')).toBe(false);
    expect(rule.isValid('123abc')).toBe(false);
  });

  it('rejects global/sticky regexes and blank descriptions', () => {
    expect(() => new PatternRule(/^a$/g, 'global')).toThrow(RangeError);
    expect(() => new PatternRule(/^a$/y, 'sticky')).toThrow(RangeError);
    expect(() => new PatternRule(/^a$/, '   ')).toThrow(RangeError);
  });
});

describe('AllowedValuesRule', () => {
  it('stores a defensive set and formats dynamic description', () => {
    const source = ['amb', 'blu', 'brn'];
    const rule = new AllowedValuesRule(source);
    source.push('zzz');

    expect(Object.isFrozen(rule)).toBe(true);
    expect(rule.description).toBe('amb | blu | brn');
    expect(rule.isValid('blu')).toBe(true);
    expect(rule.isValid('zzz')).toBe(false);
    expect(() => new AllowedValuesRule([])).toThrow(RangeError);
  });
});

describe('STRICT_FIELD_RULES', () => {
  it('defines frozen rules for all seven required passport fields', () => {
    expect(Object.isFrozen(STRICT_FIELD_RULES)).toBe(true);
    expect(STRICT_FIELD_RULES.byr.isValid('2002')).toBe(true);
    expect(STRICT_FIELD_RULES.byr.isValid('2003')).toBe(false);
    expect(STRICT_FIELD_RULES.iyr.isValid('2015')).toBe(true);
    expect(STRICT_FIELD_RULES.eyr.isValid('2025')).toBe(true);
    expect(STRICT_FIELD_RULES.hgt.isValid('60in')).toBe(true);
    expect(STRICT_FIELD_RULES.hgt.isValid('190cm')).toBe(true);
    expect(STRICT_FIELD_RULES.hcl.isValid('#123abc')).toBe(true);
    expect(STRICT_FIELD_RULES.hcl.isValid('#123abz')).toBe(false);
    expect(STRICT_FIELD_RULES.ecl.isValid('brn')).toBe(true);
    expect(STRICT_FIELD_RULES.ecl.isValid('wat')).toBe(false);
    expect(STRICT_FIELD_RULES.pid.isValid('000000001')).toBe(true);
    expect(STRICT_FIELD_RULES.pid.isValid('0123456789')).toBe(false);
  });
});
