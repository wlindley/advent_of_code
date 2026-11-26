import { describe, expect, it } from 'vitest';
import {
  START_LABEL,
  TARGET_LABEL,
  solveHauntedWastelandPart1,
  solver,
  traceHauntedWastelandPart1,
} from './solver';

const EXAMPLE_ONE = [
  'RL',
  '',
  'AAA = (BBB, CCC)',
  'BBB = (DDD, EEE)',
  'CCC = (ZZZ, GGG)',
  'DDD = (DDD, DDD)',
  'EEE = (EEE, EEE)',
  'GGG = (GGG, GGG)',
  'ZZZ = (ZZZ, ZZZ)',
].join('\n');

const EXAMPLE_TWO = [
  'LLR',
  '',
  'AAA = (BBB, BBB)',
  'BBB = (AAA, ZZZ)',
  'ZZZ = (ZZZ, ZZZ)',
].join('\n');

describe('2023 Day 8 Part 1 solver', () => {
  it('solves official example 1 in 2 steps and example 2 in 6 steps', () => {
    expect(START_LABEL).toBe('AAA');
    expect(TARGET_LABEL).toBe('ZZZ');
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.solve(solver.parse(EXAMPLE_ONE))).toBe(2);
    expect(solver.solve(solver.parse(EXAMPLE_TWO))).toBe(6);
  });

  it('produces traces for example 1, example 2, and custom maxSteps', () => {
    const net1 = solver.parse(EXAMPLE_ONE);
    const trace1 = traceHauntedWastelandPart1(net1);
    expect(trace1.map((f) => f.nodeLabel)).toEqual(['AAA', 'CCC', 'ZZZ']);
    expect(trace1[2]?.isGoal).toBe(true);

    const net2 = solver.parse(EXAMPLE_TWO);
    const trace2 = solver.trace!(net2, { maxSteps: 3 });
    expect(trace2).toHaveLength(3);
    expect(trace2[0]?.step).toBe(0);
    expect(trace2[0]?.nodeLabel).toBe('AAA');
    expect(trace2[2]?.step).toBe(6);
    expect(trace2[2]?.nodeLabel).toBe('ZZZ');
  });

  it('fails fast when AAA or ZZZ is missing upfront', () => {
    const missingStart = solver.parse('LR\n\nBBB = (ZZZ, ZZZ)\nZZZ = (ZZZ, ZZZ)');
    expect(() => solveHauntedWastelandPart1(missingStart)).toThrow(/AAA/);
    expect(() => traceHauntedWastelandPart1(missingStart)).toThrow(/AAA/);

    const missingTarget = solver.parse('LR\n\nAAA = (AAA, BBB)\nBBB = (AAA, BBB)');
    expect(() => solveHauntedWastelandPart1(missingTarget)).toThrow(/ZZZ/);
    expect(() => traceHauntedWastelandPart1(missingTarget)).toThrow(/ZZZ/);
  });

  it('rejects unreachable ZZZ cycles even when both AAA and ZZZ exist', () => {
    const unreachable = solver.parse(
      'LR\n\nAAA = (BBB, BBB)\nBBB = (AAA, AAA)\nZZZ = (ZZZ, ZZZ)',
    );
    expect(() => solveHauntedWastelandPart1(unreachable)).toThrow(/unreachable|cycle/i);
    expect(() => traceHauntedWastelandPart1(unreachable)).toThrow(/unreachable|cycle/i);
  });
});
