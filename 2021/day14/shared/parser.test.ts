import { describe, expect, it } from 'vitest';
import { parsePolymerFormula } from './parser';

describe('parsePolymerFormula', () => {
  it('parses a valid template and insertion rules across LF and CRLF inputs', () => {
    const lf = 'NNCB\n\nCH -> B\nHH -> N';
    const formula = parsePolymerFormula(lf);
    expect(formula.template).toBe('NNCB');
    expect(formula.ruleCount).toBe(2);
    expect(formula.ruleFor('CH')?.insert).toBe('B');
    expect(formula.ruleFor('HH')?.insert).toBe('N');

    const crlf = '  NNCB  \r\n  \r\n  CH -> B  \r  HH -> N  \r\n';
    const normalized = parsePolymerFormula(crlf);
    expect(normalized.template).toBe('NNCB');
    expect(normalized.ruleCount).toBe(2);
  });

  it('rejects empty input and invalid section counts', () => {
    expect(() => parsePolymerFormula('')).toThrow(Error);
    expect(() => parsePolymerFormula('   \n\t  ')).toThrow(Error);
    expect(() => parsePolymerFormula('NNCB')).toThrow(Error);
    expect(() => parsePolymerFormula('NNCB\n\nCH -> B\n\nHH -> N')).toThrow(Error);
  });

  it('rejects multiline templates, malformed rule lines, and duplicate rules', () => {
    expect(() => parsePolymerFormula('NN\nCB\n\nCH -> B')).toThrow(RangeError);
    expect(() => parsePolymerFormula('NNCB\n\nCH => B')).toThrow(Error);
    expect(() => parsePolymerFormula('NNCB\n\nC -> B')).toThrow(Error);
    expect(() => parsePolymerFormula('NNCB\n\nCH -> BB')).toThrow(Error);
    expect(() => parsePolymerFormula('NNCB\n\nch -> B')).toThrow(Error);
    expect(() => parsePolymerFormula('NNCB\n\nCH -> B\nCH -> N')).toThrow(RangeError);
  });
});
