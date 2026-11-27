import { describe, expect, it } from 'vitest';
import {
  MAX_MAIN_CALLS,
  MAX_ROUTINE_CHARS,
  MAX_ROUTINE_TOKENS,
  RoutinePlan,
  compressPath,
} from './routineCompressor';

describe('RoutinePlan', () => {
  it('formats routine texts and ASCII program with continuous feed toggle', () => {
    const plan = new RoutinePlan(['A', 'B', 'C'], ['R', '8'], ['L', '10'], ['R', '4']);
    expect(plan.mainText).toBe('A,B,C');
    expect(plan.routineAText).toBe('R,8');
    expect(plan.routineBText).toBe('L,10');
    expect(plan.routineCText).toBe('R,4');
    expect(plan.toAsciiProgram(false)).toBe('A,B,C\nR,8\nL,10\nR,4\nn\n');
    expect(plan.toAsciiProgram(true)).toBe('A,B,C\nR,8\nL,10\nR,4\ny\n');
  });

  it('validates main call count and routine token/length constraints', () => {
    expect(() => new RoutinePlan([], ['R'], ['R'], ['R'])).toThrow(RangeError);
    expect(
      () => new RoutinePlan(Array(MAX_MAIN_CALLS + 1).fill('A'), ['R'], ['R'], ['R']),
    ).toThrow(RangeError);
    expect(() => new RoutinePlan(['A'], [], ['R'], ['R'])).toThrow(RangeError);
    expect(() => new RoutinePlan(['A'], ['0'], ['R'], ['R'])).toThrow('Invalid movement token');
    expect(
      () => new RoutinePlan(['A'], ['10', '10', '10', '10', '10', '10', '10', '10'], ['R'], ['R']),
    ).toThrow(`${MAX_ROUTINE_CHARS}`);
  });
});

describe('compressPath', () => {
  it('compresses a multi-routine path and pads unused routines when fewer than three suffice', () => {
    const tokens = [
      'R', '8', 'R', '8', 'R', '4', 'R', '4',
      'R', '8', 'L', '6', 'L', '2',
      'R', '4', 'R', '4', 'R', '8',
      'R', '8', 'R', '8', 'L', '6', 'L', '2',
    ];
    const plan = compressPath(tokens);
    expect(plan.main.length).toBeLessThanOrEqual(MAX_MAIN_CALLS);
    expect(plan.routineAText.length).toBeLessThanOrEqual(MAX_ROUTINE_CHARS);
    expect(plan.routineBText.length).toBeLessThanOrEqual(MAX_ROUTINE_CHARS);
    expect(plan.routineCText.length).toBeLessThanOrEqual(MAX_ROUTINE_CHARS);

    const lookup = { A: plan.routineA, B: plan.routineB, C: plan.routineC };
    const expanded = plan.main.flatMap((name) => lookup[name]);
    expect(expanded).toEqual(tokens);

    const singleRoutine = compressPath(['L', '4', 'L', '4']);
    expect(singleRoutine.main).toEqual(['A']);
    expect(singleRoutine.routineB).toEqual(['R']);
    expect(singleRoutine.routineC).toEqual(['R']);

    // Two routines [A, B, A] exercises existing-routine reuse in searchRoutines before C is needed
    const twoRoutines = compressPath([
      'L', '10', 'R', '12', 'L', '14', 'R', '16',
      'R', '20', 'L', '22', 'R', '24', 'L', '26',
      'L', '10', 'R', '12', 'L', '14', 'R', '16',
    ]);
    expect(twoRoutines.main).toEqual(['A', 'B', 'A']);
    expect(twoRoutines.routineC).toEqual(['R']);
  });

  it('avoids duplicate routines and backtracks with memoized reachability pruning', () => {
    // Forces A to be tried with longest slice first, then backtracks to shorter A so B and C fit.
    const tokens = [
      'L', '1', 'R', '2', 'L', '3',
      'L', '1', 'R', '2',
      'L', '4', 'R', '5',
      'L', '1', 'R', '2', 'L', '3',
      'L', '4', 'R', '5',
    ];
    const plan = compressPath(tokens);
    const lookup = { A: plan.routineA, B: plan.routineB, C: plan.routineC };
    expect(plan.main.flatMap((name) => lookup[name])).toEqual(tokens);
    expect(plan.routineAText).not.toBe(plan.routineBText);

    // Forces backtracking inside matchWithThreeRoutines when prefix routine A exceeds 10-call budget
    const prefixBacktrack = [
      'L', '123456', '10000000000000001',
      'L', '123456', 'R', '234567', 'L', '123456', 'R', '234567',
      'L', '123456', 'R', '234567', 'L', '123456', 'R', '234567',
      'L', '123456', 'R', '234567', 'L', '123456', 'R', '234567',
      'L', '123456', 'R', '234567', 'L', '123456', 'R', '234567',
    ];
    const prefixPlan = compressPath(prefixBacktrack);
    expect(prefixPlan.main).toEqual(['A', 'B', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C']);
  });

  it('rejects empty, oversized, invalid, and incompressible token sequences', () => {
    expect(() => compressPath([])).toThrow(RangeError);
    expect(() => compressPath(Array(MAX_MAIN_CALLS * MAX_ROUTINE_TOKENS + 1).fill('L'))).toThrow(
      'exceeds maximum',
    );
    expect(() => compressPath(['L', 'X'])).toThrow('Invalid movement token');

    // 11 distinct step counts cannot be packed into 3 routines of <= 20 chars each within 10 calls
    const incompressible = [
      'L', '11', 'R', '12', 'L', '13', 'R', '14', 'L', '15', 'R', '16',
      'L', '17', 'R', '18', 'L', '19', 'R', '20', 'L', '21', 'R', '22',
      'L', '23', 'R', '24', 'L', '25', 'R', '26', 'L', '27', 'R', '28',
    ];
    expect(() => compressPath(incompressible)).toThrow('Unable to compress');

    // Exercises 10-call budget exhaustion before 3 routines and memoized failed state hits
    expect(() =>
      compressPath([...Array(10).fill('10000000001'), '10000000002']),
    ).toThrow('Unable to compress');
    expect(() =>
      compressPath([
        'L', '1', 'L', '1', 'L', '1', 'L', '1', 'L', '1', 'L', '1',
        '10000000001', '10000000002', '10000000003', '10000000004',
      ]),
    ).toThrow('Unable to compress');
  });
});
