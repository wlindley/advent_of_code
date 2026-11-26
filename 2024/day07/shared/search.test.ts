import { describe, expect, it } from 'vitest';
import { CalibrationEquation } from './equation';
import { ADD_OPERATOR, MUL_OPERATOR, PART1_OPERATORS } from './operator';
import {
  CalibrationTraceFrame,
  EquationTrace,
  SEARCH_NODE_STATUS,
  solveEquation,
  totalCalibrationResult,
  traceEquation,
} from './search';

describe('solveEquation', () => {
  it('handles single-operand equations (k=1)', () => {
    expect(solveEquation(new CalibrationEquation(7n, [7n]), PART1_OPERATORS)).toEqual([]);
    expect(solveEquation(new CalibrationEquation(7n, [8n]), PART1_OPERATORS)).toBeNull();
  });

  it('finds witness matching operator priority and handles unsolvable equations', () => {
    const eq = new CalibrationEquation(3267n, [81n, 40n, 27n]);
    const witness = solveEquation(eq, PART1_OPERATORS);
    expect(witness).toEqual([ADD_OPERATOR, MUL_OPERATOR]);
    expect(Object.isFrozen(witness)).toBe(true);
    expect(eq.evaluateSteps(witness!).at(-1)).toBe(3267n);

    const unsolvable = new CalibrationEquation(21037n, [9n, 7n, 18n, 13n]);
    expect(solveEquation(unsolvable, PART1_OPERATORS)).toBeNull();
    expect(solveEquation(new CalibrationEquation(10n, [5n, 2n]), [])).toBeNull();
  });

  it('avoids operand-1 pruning traps', () => {
    expect(solveEquation(new CalibrationEquation(10n, [10n, 1n]), PART1_OPERATORS)).toEqual([
      MUL_OPERATOR,
    ]);
    expect(solveEquation(new CalibrationEquation(11n, [10n, 1n]), PART1_OPERATORS)).toEqual([
      ADD_OPERATOR,
    ]);
    expect(solveEquation(new CalibrationEquation(1n, [1n, 1n, 1n]), PART1_OPERATORS)).toEqual([
      MUL_OPERATOR,
      MUL_OPERATOR,
    ]);
  });
});

describe('totalCalibrationResult and trace value objects', () => {
  it('sums targets of solvable equations', () => {
    const eqs = [
      new CalibrationEquation(190n, [10n, 19n]),
      new CalibrationEquation(83n, [17n, 5n]),
      new CalibrationEquation(292n, [11n, 6n, 16n, 20n]),
    ];
    expect(totalCalibrationResult(eqs, PART1_OPERATORS)).toBe(482n);
    expect(totalCalibrationResult([], PART1_OPERATORS)).toBe(0n);
  });

  it('freezes EquationTrace and CalibrationTraceFrame with derived getters', () => {
    const eq = new CalibrationEquation(190n, [10n, 19n]);
    const trace = traceEquation(eq, PART1_OPERATORS);
    expect(trace).toBeInstanceOf(EquationTrace);
    expect(Object.isFrozen(trace)).toBe(true);
    expect(Object.isFrozen(trace.nodes)).toBe(true);
    expect(trace.solvable).toBe(true);
    expect(trace.truncated).toBe(false);
    expect(trace.naiveCombinations).toBe(2n);
    expect(SEARCH_NODE_STATUS.WINNING).toBe('winning');
    expect(SEARCH_NODE_STATUS.BACKTRACKED).toBe('backtracked');
    expect(SEARCH_NODE_STATUS.PRUNED).toBe('pruned');

    const frame = new CalibrationTraceFrame(2, 9, trace, 190n, 1);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame.unsolvedSoFar).toBe(2);
  });
});
