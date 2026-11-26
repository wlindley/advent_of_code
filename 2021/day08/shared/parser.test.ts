import { describe, expect, it } from 'vitest';
import { parseDisplayEntry, parseDisplayNotes } from './parser';

const SMALL_LINE =
  'acedgfb cdfbe gcdfa fbcad dab cefabd cdfgeb eafb cagedb ab | cdfeb fcadb cdfeb cdbaf';

describe('2021 Day 8 parser', () => {
  it('parses a single display entry line with arbitrary whitespace', () => {
    const entry = parseDisplayEntry(`  ${SMALL_LINE.replace('|', '  |  ')}  `);
    expect(entry.signals).toHaveLength(10);
    expect(entry.outputs).toHaveLength(4);
    expect(entry.outputs[0].letters).toBe('bcdef');
  });

  it('parses multi-line notes, ignores blank lines, and freezes result', () => {
    const raw = `\n  ${SMALL_LINE} \r\n\n  ${SMALL_LINE}  \n`;
    const entries = parseDisplayNotes(raw);
    expect(Object.isFrozen(entries)).toBe(true);
    expect(entries).toHaveLength(2);
  });

  it('rejects malformed separator, empty halves, invalid tokens, and empty notes', () => {
    expect(() => parseDisplayEntry('ab cd')).toThrow(SyntaxError);
    expect(() => parseDisplayEntry('ab | cd | ef')).toThrow(SyntaxError);
    expect(() => parseDisplayEntry(' | cdfeb fcadb cdfeb cdbaf')).toThrow(RangeError);
    expect(() => parseDisplayEntry('acedgfb cdfbe gcdfa fbcad dab cefabd cdfgeb eafb cagedb ab | ')).toThrow(
      RangeError,
    );
    expect(() =>
      parseDisplayEntry('acedgfb cdfbe gcdfa fbcad dab cefabd cdfgeb eafb cagedb ab | cdfeb fcadb cdfeb xyz'),
    ).toThrow(SyntaxError);
    expect(() => parseDisplayNotes('')).toThrow(RangeError);
    expect(() => parseDisplayNotes('  \n \r\n  ')).toThrow(RangeError);
  });
});
