import { describe, expect, it } from 'vitest';
import { parseOrigamiManual } from './parser';

const SAMPLE = [
  '6,10\r',
  '0,14\r',
  '9,10\r',
  '\r',
  'fold along y=7\r',
  'fold along x=5\r',
].join('\n');

describe('parser', () => {
  it('parses CRLF/LF inputs into OrigamiManual', () => {
    const manual = parseOrigamiManual(`\n${SAMPLE}\n`);
    expect(manual.initialSheet.dotCount).toBe(3);
    expect(manual.initialSheet.hasDot(6, 10)).toBe(true);
    expect(manual.foldCount).toBe(2);
    expect(manual.folds[0]?.axis).toBe('y');
    expect(manual.folds[0]?.value).toBe(7);
    expect(manual.folds[1]?.axis).toBe('x');
    expect(manual.folds[1]?.value).toBe(5);
  });

  it('rejects empty input or missing/extra sections', () => {
    expect(() => parseOrigamiManual('   ')).toThrow(Error);
    expect(() => parseOrigamiManual('1,2\n3,4')).toThrow(Error);
    expect(() => parseOrigamiManual('1,2\n\nfold along x=1\n\nfold along y=1')).toThrow(Error);
  });

  it('rejects malformed dot or fold lines', () => {
    expect(() => parseOrigamiManual('1,2,3\n\nfold along x=1')).toThrow(Error);
    expect(() => parseOrigamiManual('a,2\n\nfold along x=1')).toThrow(Error);
    expect(() => parseOrigamiManual('1,2\n\nfold along z=1')).toThrow(Error);
    expect(() => parseOrigamiManual('1,2\n\nfold along x=0')).toThrow(RangeError);
  });
});
