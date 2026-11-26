import { describe, expect, it } from 'vitest';
import { parseNavigationSubsystem } from './parser';

describe('parseNavigationSubsystem', () => {
  it('parses LF and CRLF inputs while stripping outer blank lines', () => {
    expect(parseNavigationSubsystem('()\n[]')).toEqual(['()', '[]']);
    expect(parseNavigationSubsystem('\r\n()\r\n[]\r\n\r\n')).toEqual(['()', '[]']);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parseNavigationSubsystem('')).toThrow(RangeError);
    expect(() => parseNavigationSubsystem('\n  \r\n\t\n')).toThrow(RangeError);
  });

  it('rejects interior blank lines', () => {
    expect(() => parseNavigationSubsystem('()\n\n[]')).toThrow(RangeError);
    expect(() => parseNavigationSubsystem('()\n   \n[]')).toThrow(RangeError);
  });

  it('rejects lines with invalid characters or spaces', () => {
    expect(() => parseNavigationSubsystem('()\n(]X')).toThrow(SyntaxError);
    expect(() => parseNavigationSubsystem(' () ')).toThrow(SyntaxError);
  });
});
