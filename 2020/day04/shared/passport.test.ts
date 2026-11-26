import { describe, expect, it } from 'vitest';
import {
  OPTIONAL_PASSPORT_FIELD,
  PassportBatch,
  PassportRecord,
  REQUIRED_PASSPORT_FIELDS,
  STANDARD_PASSPORT_FIELDS,
  parsePassportBatch,
} from './passport';

function sampleMap(): Map<string, string> {
  return new Map([
    ['ecl', 'gry'],
    ['pid', '860033327'],
    ['byr', '1937'],
  ]);
}

describe('passport constants', () => {
  it('defines frozen required, optional, and standard field lists', () => {
    expect(REQUIRED_PASSPORT_FIELDS).toEqual(['byr', 'iyr', 'eyr', 'hgt', 'hcl', 'ecl', 'pid']);
    expect(OPTIONAL_PASSPORT_FIELD).toBe('cid');
    expect(STANDARD_PASSPORT_FIELDS).toEqual([...REQUIRED_PASSPORT_FIELDS, 'cid']);
    expect(Object.isFrozen(REQUIRED_PASSPORT_FIELDS)).toBe(true);
    expect(Object.isFrozen(STANDARD_PASSPORT_FIELDS)).toBe(true);
  });
});

describe('PassportRecord', () => {
  it('stores a frozen defensive copy and exposes getters and query methods', () => {
    const source = sampleMap();
    const record = new PassportRecord(source);
    source.set('cid', '999');

    expect(Object.isFrozen(record)).toBe(true);
    expect(record.fieldCount).toBe(3);
    expect(record.fieldKeys).toEqual(['ecl', 'pid', 'byr']);
    expect(record.entries).toEqual([['ecl', 'gry'], ['pid', '860033327'], ['byr', '1937']]);
    expect(record.hasField('ecl')).toBe(true);
    expect(record.hasField('cid')).toBe(false);
    expect(record.fieldValue('byr')).toBe('1937');
    expect(record.fieldValue('cid')).toBeUndefined();
  });

  it('rejects empty maps and invalid keys or values', () => {
    expect(() => new PassportRecord(new Map())).toThrow(RangeError);
    expect(() => new PassportRecord(new Map([['', '1937']]))).toThrow(RangeError);
    expect(() => new PassportRecord(new Map([['by r', '1937']]))).toThrow(RangeError);
    expect(() => new PassportRecord(new Map([['by:r', '1937']]))).toThrow(RangeError);
    expect(() => new PassportRecord(new Map([['byr', '']]))).toThrow(RangeError);
    expect(() => new PassportRecord(new Map([['byr', '19 37']]))).toThrow(RangeError);
    expect(() => new PassportRecord(new Map([['byr', '19:37']]))).toThrow(RangeError);
  });
});

describe('PassportBatch', () => {
  it('stores a frozen defensive copy of records and rejects empty arrays', () => {
    const first = new PassportRecord(sampleMap());
    const list = [first];
    const batch = new PassportBatch(list);
    list.push(first);

    expect(Object.isFrozen(batch)).toBe(true);
    expect(Object.isFrozen(batch.records)).toBe(true);
    expect(batch.size).toBe(1);
    expect(batch.records[0]).toBe(first);
    expect(() => new PassportBatch([])).toThrow(RangeError);
  });
});

describe('parsePassportBatch', () => {
  it('parses multi-line and CRLF passport blocks separated by blank lines', () => {
    const raw = [
      '  ecl:gry pid:860033327\r\neyr:2020 hcl:#fffffd',
      ' \t ',
      'iyr:2013 ecl:amb cid:350\rbyr:1989\n\npid:028048884 hgt:170cm  ',
    ].join('\n');

    const batch = parsePassportBatch(raw);
    expect(batch.size).toBe(3);
    expect(batch.records[0]?.fieldValue('hcl')).toBe('#fffffd');
    expect(batch.records[1]?.fieldValue('cid')).toBe('350');
    expect(batch.records[2]?.fieldValue('hgt')).toBe('170cm');
  });

  it('rejects empty input, malformed tokens, and duplicate keys', () => {
    expect(() => parsePassportBatch('  \r\n \t  ')).toThrow(RangeError);
    expect(() => parsePassportBatch('eclgry')).toThrow(SyntaxError);
    expect(() => parsePassportBatch(':gry')).toThrow(SyntaxError);
    expect(() => parsePassportBatch('ecl:')).toThrow(SyntaxError);
    expect(() => parsePassportBatch('ecl:gry:blue')).toThrow(SyntaxError);
    expect(() => parsePassportBatch('ecl:gry\necl:amb')).toThrow(SyntaxError);
  });
});
