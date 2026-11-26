import { describe, expect, it } from 'vitest';
import {
  PasswordDatabase,
  PasswordEntry,
  parsePasswordDatabase,
} from './passwordEntry';

describe('PasswordEntry', () => {
  it('stores validated fields as a frozen immutable object', () => {
    const entry = new PasswordEntry(1, 3, 'a', 'abcde');
    expect(entry.first).toBe(1);
    expect(entry.second).toBe(3);
    expect(entry.letter).toBe('a');
    expect(entry.password).toBe('abcde');
    expect(Object.isFrozen(entry)).toBe(true);
  });

  it('accepts equal bounds such as 2-2', () => {
    const entry = new PasswordEntry(2, 2, 'z', 'z');
    expect(entry.first).toBe(2);
    expect(entry.second).toBe(2);
  });

  it('rejects invalid first bound (zero, negative, non-integer, unsafe)', () => {
    expect(() => new PasswordEntry(0, 3, 'a', 'abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(-1, 3, 'a', 'abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(1.5, 3, 'a', 'abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 1, 'a', 'abc')).toThrow(RangeError);
  });

  it('rejects invalid second bound (less than first, non-integer, unsafe)', () => {
    expect(() => new PasswordEntry(4, 3, 'a', 'abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(1, 2.5, 'a', 'abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(1, Number.MAX_SAFE_INTEGER + 1, 'a', 'abc')).toThrow(RangeError);
  });

  it('rejects invalid policy letter (empty, multi-char, uppercase, non-alpha)', () => {
    expect(() => new PasswordEntry(1, 3, '', 'abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(1, 3, 'ab', 'abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(1, 3, 'A', 'abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(1, 3, '1', 'abc')).toThrow(RangeError);
  });

  it('rejects invalid password (empty, uppercase, digits, symbols)', () => {
    expect(() => new PasswordEntry(1, 3, 'a', '')).toThrow(RangeError);
    expect(() => new PasswordEntry(1, 3, 'a', 'Abc')).toThrow(RangeError);
    expect(() => new PasswordEntry(1, 3, 'a', 'abc1')).toThrow(RangeError);
    expect(() => new PasswordEntry(1, 3, 'a', 'ab-c')).toThrow(RangeError);
  });
});

describe('PasswordDatabase', () => {
  it('stores a defensive frozen copy of entries and exposes size', () => {
    const source = [new PasswordEntry(1, 3, 'a', 'abcde')];
    const db = new PasswordDatabase(source);
    source.push(new PasswordEntry(1, 3, 'b', 'cdefg'));

    expect(db.size).toBe(1);
    expect(db.entries).toHaveLength(1);
    expect(Object.isFrozen(db)).toBe(true);
    expect(Object.isFrozen(db.entries)).toBe(true);
  });

  it('rejects an empty entry list', () => {
    expect(() => new PasswordDatabase([])).toThrow(RangeError);
  });
});

describe('parsePasswordDatabase', () => {
  it('parses CRLF and LF lines while skipping blank lines', () => {
    const db = parsePasswordDatabase('\r\n 1-3 a: abcde \r\n\n2-9 c:   ccccccccc\n');
    expect(db.size).toBe(2);
    expect(db.entries[0]!.first).toBe(1);
    expect(db.entries[0]!.second).toBe(3);
    expect(db.entries[0]!.letter).toBe('a');
    expect(db.entries[0]!.password).toBe('abcde');
    expect(db.entries[1]!.password).toBe('ccccccccc');
  });

  it('throws SyntaxError on malformed lines', () => {
    expect(() => parsePasswordDatabase('1-3 a abcde')).toThrow(SyntaxError);
    expect(() => parsePasswordDatabase('1-3 A: abcde')).toThrow(SyntaxError);
    expect(() => parsePasswordDatabase('a-3 a: abcde')).toThrow(SyntaxError);
    expect(() => parsePasswordDatabase('1-3 a: abcde extra')).toThrow(SyntaxError);
  });

  it('throws RangeError on blank-only input or invalid numeric bounds', () => {
    expect(() => parsePasswordDatabase('   \n\r\n  ')).toThrow(RangeError);
    expect(() => parsePasswordDatabase('0-3 a: abcde')).toThrow(RangeError);
    expect(() => parsePasswordDatabase('5-3 a: abcde')).toThrow(RangeError);
  });
});
