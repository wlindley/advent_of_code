import { describe, expect, it } from 'vitest';
import { DigitMatch, type DigitExtractor } from './calibration';
import { CalibrationDocument, DEFAULT_MAX_TRACE_STEPS } from './document';

const asciiFakeExtractor: DigitExtractor = {
  matchAt(line: string, index: number): DigitMatch | null {
    const ch = line[index];
    return ch !== undefined && ch >= '0' && ch <= '9'
      ? new DigitMatch(Number(ch), index, 1)
      : null;
  },
};

describe('CalibrationDocument', () => {
  it('parses LF and CRLF inputs, trims outer whitespace, and freezes lines', () => {
    const raw = ['1abc2', 'pqr3stu8vwx'];
    const docFromArray = new CalibrationDocument(raw);
    expect(Object.isFrozen(docFromArray)).toBe(true);
    expect(Object.isFrozen(docFromArray.lines)).toBe(true);
    expect(docFromArray.lineCount).toBe(2);

    const doc = CalibrationDocument.parse('  \r\n1abc2\r\npqr3stu8vwx\r\n  ');
    expect(doc.lines).toEqual(['1abc2', 'pqr3stu8vwx']);
    expect(doc.lineCount).toBe(2);
  });

  it('rejects empty documents and blank interior lines with 1-based line numbers', () => {
    expect(() => CalibrationDocument.parse('')).toThrow(Error);
    expect(() => CalibrationDocument.parse('  \n\t\r\n  ')).toThrow(Error);
    expect(() => new CalibrationDocument([])).toThrow(Error);
    expect(() => CalibrationDocument.parse('a1b\n\nc2d')).toThrow('Line 2');
    expect(() => CalibrationDocument.parse('a1b\n   \nc2d')).toThrow('Line 2');
  });

  it('calibrates total sum across all lines and surfaces line-numbered errors', () => {
    const doc = CalibrationDocument.parse('1abc2\npqr3stu8vwx\na1b2c3d4e5f\ntreb7uchet');
    expect(doc.calibrate(asciiFakeExtractor)).toBe(142);

    const broken = CalibrationDocument.parse('1abc2\nnodigits');
    expect(() => broken.calibrate(asciiFakeExtractor)).toThrow(
      'Line 2: no calibration digit found in "nodigits"',
    );
  });

  it('traces every line when under maxSteps and freezes frames', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const doc = CalibrationDocument.parse('1abc2\npqr3stu8vwx\ntreb7uchet');
    const frames = doc.trace(asciiFakeExtractor);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(3);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames.map((f) => [f.calibration.lineNumber, f.calibration.value, f.runningSum, f.totalLines])).toEqual([
      [1, 12, 12, 3],
      [2, 38, 50, 3],
      [3, 77, 127, 3],
    ]);
  });

  it('samples large documents to maxSteps while preserving endpoints and exact runningSum', () => {
    const lines = Array.from({ length: 500 }, (_, i) => `x${(i % 9) + 1}y`);
    const doc = new CalibrationDocument(lines);
    const expectedSum = doc.calibrate(asciiFakeExtractor);

    const sampled = doc.trace(asciiFakeExtractor, { maxSteps: 25 });
    expect(sampled).toHaveLength(25);
    expect(sampled[0]?.calibration.lineNumber).toBe(1);
    expect(sampled.at(-1)?.calibration.lineNumber).toBe(500);
    expect(sampled.at(-1)?.runningSum).toBe(expectedSum);

    const single = doc.trace(asciiFakeExtractor, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.calibration.lineNumber).toBe(500);
    expect(single[0]?.runningSum).toBe(expectedSum);
  });

  it('validates maxSteps and surfaces errors on unsampled interior lines', () => {
    const doc = CalibrationDocument.parse('1a\n2b\n3c');
    expect(() => doc.trace(asciiFakeExtractor, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => doc.trace(asciiFakeExtractor, { maxSteps: 1.5 })).toThrow(RangeError);

    const hiddenBroken = CalibrationDocument.parse('1a\nbad\n3c');
    expect(() => hiddenBroken.trace(asciiFakeExtractor, { maxSteps: 1 })).toThrow(
      'Line 2: no calibration digit found in "bad"',
    );
  });
});
