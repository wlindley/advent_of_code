import { describe, expect, it } from 'vitest';
import { Rational } from '../../../shared/core';
import {
  DEFAULT_ROOT_NAME,
  DEFAULT_UNKNOWN_NAME,
  evaluateAllAffine,
  evaluateAllMonkeys,
  solveEqualitySolution,
  solveEqualityUnknown,
  solveRootYell,
  toExactBigInt,
} from './evaluator';
import { parseMonkeyRiddle } from './parser';

const OFFICIAL_EXAMPLE = [
  'root: pppw + sjmn',
  'dbpl: 5',
  'cczh: sllz + lgvd',
  'zczc: 2',
  'ptdq: humn - dvpt',
  'dvpt: 3',
  'lfqf: 4',
  'humn: 5',
  'ljgn: 2',
  'sjmn: drzm * dbpl',
  'sllz: 4',
  'pppw: cczh / lfqf',
  'lgvd: ljgn * ptdq',
  'drzm: hmdt - zczc',
  'hmdt: 32',
].join('\n');

describe('evaluator', () => {
  it('converts integer Rationals to bigint and rejects fractions', () => {
    expect(toExactBigInt(new Rational(42n))).toBe(42n);
    expect(() => toExactBigInt(new Rational(3n, 2n))).toThrow(RangeError);
  });

  it('evaluates official example Part 1 and ignores dead unreachable monkeys', () => {
    const riddle = parseMonkeyRiddle(OFFICIAL_EXAMPLE);
    expect(solveRootYell(riddle, DEFAULT_ROOT_NAME)).toBe(152n);

    const withDeadDivZero = parseMonkeyRiddle([
      'root: a + b',
      'a: 10',
      'b: 20',
      'dead: a / z',
      'z: 0',
    ].join('\n'));
    const values = evaluateAllMonkeys(withDeadDivZero, DEFAULT_ROOT_NAME);
    expect(values.has('dead')).toBe(false);
    expect(solveRootYell(withDeadDivZero, DEFAULT_ROOT_NAME)).toBe(30n);
  });

  it('solves official example Part 2 with inversion steps', () => {
    const riddle = parseMonkeyRiddle(OFFICIAL_EXAMPLE);
    const solution = solveEqualitySolution(riddle, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME);

    expect(solution.unknownValue).toBe(301n);
    expect(solution.unknownOccurrences).toBe(1n);
    expect(solution.steps[0]!.op).toBe('=');
    expect(solution.steps[solution.steps.length - 1]!.unknownChild).toBe('humn');
    expect(solveEqualityUnknown(riddle, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME)).toBe(301n);
  });

  it('does not evaluate dummy unknown during 10 / humn inversion', () => {
    const riddle = parseMonkeyRiddle([
      'root: lhs + rhs',
      'lhs: ten / humn',
      'ten: 10',
      'rhs: 5',
      'humn: 0',
    ].join('\n'));

    expect(solveEqualityUnknown(riddle, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME)).toBe(2n);
  });

  it('solves single-path and multi-path affine equalities across all branches', () => {
    const rightSideRoot = parseMonkeyRiddle([
      'root: c + x',
      'c: 12',
      'x: twenty - humn',
      'twenty: 20',
      'humn: 1',
    ].join('\n'));
    expect(solveEqualityUnknown(rightSideRoot, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME)).toBe(8n);

    const multi = parseMonkeyRiddle([
      'root: lhs + rhs',
      'lhs: two * humn',
      'rhs: humn + five',
      'two: 2',
      'five: 5',
      'humn: 99',
    ].join('\n'));
    const affine = evaluateAllAffine(multi, 'lhs', DEFAULT_UNKNOWN_NAME);
    expect(affine.get('lhs')!.toString('humn')).toBe('2*humn');
    expect(solveEqualityUnknown(multi, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME)).toBe(5n);
  });

  it('rejects invalid equality configurations and unsolvable equations', () => {
    const litRoot = parseMonkeyRiddle('root: 5\nhumn: 1');
    expect(() => solveEqualityUnknown(litRoot, 'root', 'humn')).toThrow(Error);

    const sameName = parseMonkeyRiddle('root: a + b\na: 1\nb: 2');
    expect(() => solveEqualityUnknown(sameName, 'root', 'root')).toThrow(Error);

    const unaffected = parseMonkeyRiddle('root: a + b\na: 1\nb: 2\nhumn: 3');
    expect(() => solveEqualityUnknown(unaffected, 'root', 'humn')).toThrow(Error);

    const degenerate = parseMonkeyRiddle([
      'root: lhs + humn',
      'lhs: humn + one',
      'one: 1',
      'humn: 0',
    ].join('\n'));
    expect(() => solveEqualityUnknown(degenerate, 'root', 'humn')).toThrow(Error);

    const fractional = parseMonkeyRiddle('root: lhs + rhs\nlhs: two * humn\nrhs: 3\ntwo: 2\nhumn: 0');
    expect(() => solveEqualityUnknown(fractional, 'root', 'humn')).toThrow(RangeError);
  });
});
