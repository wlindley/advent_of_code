import { describe, expect, it } from 'vitest';
import {
  parseSpringRecords,
  SpringRecord,
  validateUnfoldFactor,
} from './index';

const EXAMPLE_INPUT = [
  '???.### 1,1,3',
  '.??..??...?##. 1,1,3',
  '?#?#?#?#?#?#?#? 1,3,1,6',
  '????.#...#... 4,1,1',
  '????.######..#####. 1,6,5',
  '?###???????? 3,2,1',
].join('\n');

describe('validateUnfoldFactor', () => {
  it('accepts positive safe integers', () => {
    expect(validateUnfoldFactor(1)).toBe(1);
    expect(validateUnfoldFactor(5)).toBe(5);
  });

  it('rejects zero, negative, non-integer, and unsafe integers', () => {
    expect(() => validateUnfoldFactor(0)).toThrow(RangeError);
    expect(() => validateUnfoldFactor(-2)).toThrow(RangeError);
    expect(() => validateUnfoldFactor(1.5)).toThrow(RangeError);
    expect(() => validateUnfoldFactor(Number.NaN)).toThrow(RangeError);
    expect(() => validateUnfoldFactor(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('SpringRecord', () => {
  it('freezes instance and defensively copies groups', () => {
    const rawGroups = [1, 2];
    const rec = new SpringRecord('?#?.#', rawGroups);
    rawGroups[0] = 99;

    expect(Object.isFrozen(rec)).toBe(true);
    expect(Object.isFrozen(rec.groups)).toBe(true);
    expect(rec.groups).toEqual([1, 2]);
    expect(rec.length).toBe(5);
    expect(rec.groupCount).toBe(2);
    expect(rec.wildcardCount).toBe(2);
  });

  it('allows empty groups mathematically', () => {
    const rec = new SpringRecord('.?.', []);
    expect(rec.groupCount).toBe(0);
    expect(rec.groups).toEqual([]);
    expect(rec.wildcardCount).toBe(1);
  });

  it('rejects empty or invalid patterns', () => {
    expect(() => new SpringRecord('', [1])).toThrow(RangeError);
    expect(() => new SpringRecord('..x..', [1])).toThrow(RangeError);
  });

  it('rejects invalid group entries', () => {
    expect(() => new SpringRecord('#', [0])).toThrow(RangeError);
    expect(() => new SpringRecord('#', [-1])).toThrow(RangeError);
    expect(() => new SpringRecord('#', [1.5])).toThrow(RangeError);
    expect(() => new SpringRecord('#', [Number.MAX_SAFE_INTEGER + 1])).toThrow(RangeError);
  });

  it('returns this for unfold(1) and unfolds copies >= 2 with ? separator', () => {
    const rec = new SpringRecord('.#', [1]);
    expect(rec.unfold(1)).toBe(rec);

    const doubled = rec.unfold(2);
    expect(doubled.pattern).toBe('.#?.#');
    expect(doubled.groups).toEqual([1, 1]);

    const five = new SpringRecord('???.###', [1, 1, 3]).unfold(5);
    expect(five.pattern).toBe('???.###????.###????.###????.###????.###');
    expect(five.groups).toEqual([1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3]);
    expect(() => rec.unfold(0)).toThrow(RangeError);
  });
});

describe('parseSpringRecords', () => {
  it('parses the official 6-row example and freezes the list', () => {
    const records = parseSpringRecords(EXAMPLE_INPUT);
    expect(Object.isFrozen(records)).toBe(true);
    expect(records).toHaveLength(6);
    expect(records[0]?.pattern).toBe('???.###');
    expect(records[0]?.groups).toEqual([1, 1, 3]);
    expect(records[5]?.pattern).toBe('?###????????');
    expect(records[5]?.groups).toEqual([3, 2, 1]);
  });

  it('handles CRLF line endings, surrounding whitespace, and blank lines', () => {
    const raw = '\r\n  ?#? 1  \r\n\r\n  .#. 1 \r\n';
    const records = parseSpringRecords(raw);
    expect(records).toHaveLength(2);
    expect(records[0]?.pattern).toBe('?#?');
    expect(records[1]?.groups).toEqual([1]);
  });

  it('rejects empty input', () => {
    expect(() => parseSpringRecords('')).toThrow(RangeError);
    expect(() => parseSpringRecords('  \n\r\n  ')).toThrow(RangeError);
  });

  it('rejects lines without exactly 2 whitespace-separated tokens', () => {
    expect(() => parseSpringRecords('???.###')).toThrow(SyntaxError);
    expect(() => parseSpringRecords('???.### 1,1 3')).toThrow(SyntaxError);
  });

  it('rejects invalid pattern characters', () => {
    expect(() => parseSpringRecords('??* 1')).toThrow(RangeError);
  });

  it('rejects malformed, empty, non-positive, or unsafe CSV group tokens', () => {
    expect(() => parseSpringRecords('?# 1,,2')).toThrow(RangeError);
    expect(() => parseSpringRecords('?# ,1')).toThrow(RangeError);
    expect(() => parseSpringRecords('?# 1,')).toThrow(RangeError);
    expect(() => parseSpringRecords('?# abc')).toThrow(RangeError);
    expect(() => parseSpringRecords('?# 1.5')).toThrow(RangeError);
    expect(() => parseSpringRecords('?# 0')).toThrow(RangeError);
    expect(() => parseSpringRecords('?# -1')).toThrow(RangeError);
    expect(() => parseSpringRecords(`?# ${Number.MAX_SAFE_INTEGER + 1}`)).toThrow(RangeError);
  });
});
