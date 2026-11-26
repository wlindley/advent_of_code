import { describe, expect, it } from 'vitest';
import { CalibrationEquation, parseCalibrationInput } from './equation';
import { ADD_OPERATOR, MUL_OPERATOR } from './operator';

describe('CalibrationEquation', () => {
  it('stores frozen target and defensive frozen operands copy', () => {
    const rawOperands = [10n, 19n];
    const eq = new CalibrationEquation(190n, rawOperands);
    rawOperands.push(99n);

    expect(eq.target).toBe(190n);
    expect(eq.operands).toEqual([10n, 19n]);
    expect(Object.isFrozen(eq)).toBe(true);
    expect(Object.isFrozen(eq.operands)).toBe(true);
  });

  it('rejects non-positive target, empty operands, and non-positive operands', () => {
    expect(() => new CalibrationEquation(0n, [1n])).toThrow(RangeError);
    expect(() => new CalibrationEquation(-5n, [1n])).toThrow(RangeError);
    expect(() => new CalibrationEquation(10n, [])).toThrow(RangeError);
    expect(() => new CalibrationEquation(10n, [5n, 0n])).toThrow(RangeError);
    expect(() => new CalibrationEquation(10n, [5n, -2n])).toThrow(RangeError);
  });

  it('evaluates progressive left-to-right accumulators for k=1 and k>=2', () => {
    const single = new CalibrationEquation(7n, [7n]);
    const singleSteps = single.evaluateSteps([]);
    expect(singleSteps).toEqual([7n]);
    expect(Object.isFrozen(singleSteps)).toBe(true);

    const multi = new CalibrationEquation(3267n, [81n, 40n, 27n]);
    expect(multi.evaluateSteps([ADD_OPERATOR, MUL_OPERATOR])).toEqual([81n, 121n, 3267n]);
    expect(multi.evaluateSteps([MUL_OPERATOR, ADD_OPERATOR])).toEqual([81n, 3240n, 3267n]);
  });

  it('rejects mismatched operator count in evaluateSteps', () => {
    const eq = new CalibrationEquation(190n, [10n, 19n]);
    expect(() => eq.evaluateSteps([])).toThrow(RangeError);
    expect(() => eq.evaluateSteps([ADD_OPERATOR, MUL_OPERATOR])).toThrow(RangeError);
  });
});

describe('parseCalibrationInput', () => {
  it('parses multiline calibration input with CRLF, extra spaces, and bigints', () => {
    const raw = '  190: 10 19 \r\n\r\n 2305843009213693953: 1152921504606846976   2 1\n';
    const eqs = parseCalibrationInput(raw);
    expect(Object.isFrozen(eqs)).toBe(true);
    expect(eqs).toHaveLength(2);
    expect(eqs[0]!.target).toBe(190n);
    expect(eqs[0]!.operands).toEqual([10n, 19n]);
    expect(eqs[1]!.target).toBe(2305843009213693953n);
    expect(eqs[1]!.operands).toEqual([1152921504606846976n, 2n, 1n]);
  });

  it.each([
    ['empty input', ''],
    ['whitespace only', '   \r\n  '],
    ['missing colon', '190 10 19'],
    ['extra colon', '190: 10: 19'],
    ['empty target', ': 10 19'],
    ['empty operands', '190:   '],
    ['non-digit target', '19a: 10 19'],
    ['negative target', '-190: 10 19'],
    ['non-digit operand', '190: 10 x'],
    ['negative operand', '190: 10 -19'],
    ['zero target', '0: 10 19'],
    ['zero operand', '190: 10 0'],
  ])('rejects invalid input (%s)', (_label, invalid) => {
    expect(() => parseCalibrationInput(invalid)).toThrow();
  });
});
