import { describe, expect, it } from 'vitest';
import { parseMonkeyRiddle } from './parser';

describe('parseMonkeyRiddle', () => {
  it('parses literals, negative integers, operations, blank lines, and CRLF', () => {
    const raw = [
      'root: pppw + sjmn',
      '',
      'pppw: -3',
      'sjmn: drzm * dbpl\r',
      'drzm: 2',
      'dbpl: 5',
    ].join('\n');

    const riddle = parseMonkeyRiddle(raw);
    expect(riddle.monkeyCount).toBe(5);
    expect(riddle.require('pppw')).toEqual({ kind: 'literal', name: 'pppw', value: -3n });
    expect(riddle.require('sjmn')).toEqual({
      kind: 'op',
      name: 'sjmn',
      left: 'drzm',
      op: '*',
      right: 'dbpl',
    });
  });

  it('delegates empty input validation to MonkeyRiddle', () => {
    expect(() => parseMonkeyRiddle('')).toThrow(RangeError);
    expect(() => parseMonkeyRiddle('   \n\t\n')).toThrow(RangeError);
  });

  it('rejects malformed lines and unsupported operators with SyntaxError', () => {
    expect(() => parseMonkeyRiddle('not valid')).toThrow(SyntaxError);
    expect(() => parseMonkeyRiddle('root: abc')).toThrow(SyntaxError);
    expect(() => parseMonkeyRiddle('root: a % b')).toThrow(SyntaxError);
  });
});
