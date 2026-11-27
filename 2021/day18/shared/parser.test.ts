import { describe, expect, it } from 'vitest';
import { parseSnailfishHomework, parseSnailfishNumber } from './parser';

describe('parseSnailfishNumber', () => {
  it('parses flat and deeply nested snailfish numbers with whitespace trimming', () => {
    const simple = parseSnailfishNumber('  [1,2]  ');
    expect(simple.toString()).toBe('[1,2]');
    expect(simple.maxDepth).toBe(1);
    expect(simple.magnitude).toBe(7);

    const nested = parseSnailfishNumber('[[[[1,3],[5,3]],[[1,3],[8,7]]],[[[4,9],[6,9]],[[8,2],[7,3]]]]');
    expect(nested.toString()).toBe('[[[[1,3],[5,3]],[[1,3],[8,7]]],[[[4,9],[6,9]],[[8,2],[7,3]]]]');
    expect(nested.maxDepth).toBe(4);
    expect(nested.magnitude).toBe(2763);
  });

  it('rejects malformed bracketed syntax, non-digits, trailing tokens, and unsafe integers', () => {
    expect(() => parseSnailfishNumber('')).toThrow(SyntaxError);
    expect(() => parseSnailfishNumber('5')).toThrow(SyntaxError);
    expect(() => parseSnailfishNumber('[1,2')).toThrow(SyntaxError);
    expect(() => parseSnailfishNumber('[1 2]')).toThrow(SyntaxError);
    expect(() => parseSnailfishNumber('[1,]')).toThrow(SyntaxError);
    expect(() => parseSnailfishNumber('[1,-2]')).toThrow(SyntaxError);
    expect(() => parseSnailfishNumber('[1,a]')).toThrow(SyntaxError);
    expect(() => parseSnailfishNumber('[1,2]3')).toThrow(SyntaxError);
    expect(() => parseSnailfishNumber('[9007199254740992,1]')).toThrow(SyntaxError);
  });
});

describe('parseSnailfishHomework', () => {
  it('parses CRLF and LF homework lines while skipping blank lines', () => {
    const hw = parseSnailfishHomework('\r\n[1,1]\r\n\n[2,2]\n\n[3,3]\r\n');
    expect(hw.count).toBe(3);
    expect(hw.numbers[0]!.toString()).toBe('[1,1]');
    expect(hw.numbers[2]!.toString()).toBe('[3,3]');
  });

  it('rejects empty homework input via RangeError', () => {
    expect(() => parseSnailfishHomework('   \n  \r\n ')).toThrow(RangeError);
  });
});
