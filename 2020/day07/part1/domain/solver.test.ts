import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { ANCESTOR_COLORS_POLICY, DEFAULT_TARGET_COLOR, HaversackSolver } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = [
  'light red bags contain 1 bright white bag, 2 muted yellow bags.',
  'dark orange bags contain 3 bright white bags, 4 muted yellow bags.',
  'bright white bags contain 1 shiny gold bag.',
  'muted yellow bags contain 2 shiny gold bags, 9 faded blue bags.',
  'shiny gold bags contain 1 dark olive bag, 2 vibrant plum bags.',
  'dark olive bags contain 3 faded blue bags, 4 dotted black bags.',
  'vibrant plum bags contain 5 faded blue bags, 6 dotted black bags.',
  'faded blue bags contain no other bags.',
  'dotted black bags contain no other bags.',
].join('\n');

describe('2020 Day 7 Part 1 solver', () => {
  it('solves the official 9-rule example via executeSolver', () => {
    expect(solver.policy).toBe(ANCESTOR_COLORS_POLICY);
    expect(solver.targetColor).toBe(DEFAULT_TARGET_COLOR);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(4n);
  });

  it('produces progressive trace frames when trace options are omitted or bounded', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace(parsed);
    expect(full.length).toBe(3);
    expect(full[0]!.runningTotal).toBe(0n);
    expect(full[2]!.runningTotal).toBe(4n);

    const bounded = solver.trace(parsed, { maxSteps: 2 });
    expect(bounded.length).toBe(2);
    expect(bounded[1]!.runningTotal).toBe(4n);
  });

  it('rejects invalid target color and propagates parse errors', () => {
    expect(() => new HaversackSolver(ANCESTOR_COLORS_POLICY, 'BAD')).toThrow(RangeError);
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('not a valid rule')).toThrow(SyntaxError);
  });
});
