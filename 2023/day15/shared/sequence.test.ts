import { describe, expect, it } from 'vitest';
import { parseInitSequence } from './index';

describe('parseInitSequence', () => {
  it('parses the official 11-step example into a frozen token array', () => {
    const raw = 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7\n';
    const steps = parseInitSequence(raw);
    expect(Object.isFrozen(steps)).toBe(true);
    expect(steps).toEqual([
      'rn=1',
      'cm-',
      'qp=3',
      'cm=2',
      'qp-',
      'pc=4',
      'ot=9',
      'ab=5',
      'pc-',
      'pc=6',
      'ot=7',
    ]);
  });

  it('parses a single token and strips CRLF and mid-sequence newlines', () => {
    expect(parseInitSequence('HASH')).toEqual(['HASH']);
    expect(parseInitSequence('rn=1,\r\ncm-\n,qp=3\r\n')).toEqual(['rn=1', 'cm-', 'qp=3']);
  });

  it('rejects empty input and newline-only input', () => {
    expect(() => parseInitSequence('')).toThrow(RangeError);
    expect(() => parseInitSequence('\r\n\n\r')).toThrow(RangeError);
  });

  it('rejects empty comma-separated tokens (leading, trailing, double comma)', () => {
    expect(() => parseInitSequence(',rn=1')).toThrow(RangeError);
    expect(() => parseInitSequence('rn=1,')).toThrow(RangeError);
    expect(() => parseInitSequence('rn=1,,cm-')).toThrow(RangeError);
  });

  it('rejects non-printable ASCII characters inside tokens', () => {
    expect(() => parseInitSequence('rn=1,\tcm-')).toThrow(RangeError);
    expect(() => parseInitSequence('rn=1,cm-\x7f')).toThrow(RangeError);
  });

  it('rejects spaces inside tokens', () => {
    expect(() => parseInitSequence('rn=1, cm-')).toThrow(RangeError);
    expect(() => parseInitSequence(' ')).toThrow(RangeError);
  });
});
