import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

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

describe('2022 Day 21 Part 1 solver', () => {
  it('solves the official example via executeSolver with a fake Clock', () => {
    let tick = 10;
    const fakeClock: Clock = { nowMs: () => (tick += 5) };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);

    expect(exec.answer).toBe(152n);
    expect(exec.elapsedMs).toBe(5);
    expect(exec.runtime).toBe('main-thread');
  });

  it('produces trace frames with omitted options and explicit maxSteps', () => {
    const riddle = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(riddle);
    expect(full).toHaveLength(16);
    expect(full[full.length - 1]!.answerText).toBe('152');

    const capped = solver.trace(riddle, { maxSteps: 4 });
    expect(capped).toHaveLength(4);
    expect(capped[3]!.finalAnswerText).toBe('152');
  });

  it('rejects invalid input at parse boundary', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('root: bad line')).toThrow(SyntaxError);
  });
});
