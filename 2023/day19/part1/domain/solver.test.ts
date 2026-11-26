import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'px{a<2006:qkq,m>2090:A,rfg}',
  'pv{a>1716:R,A}',
  'lnx{m>1548:A,A}',
  'rfg{s<537:gd,x>2440:R,A}',
  'qs{s>3448:A,lnx}',
  'qkq{x<1416:A,crn}',
  'crn{x>2662:A,R}',
  'in{s<1351:px,qqz}',
  'qqz{s>2770:qs,m<1801:hdj,R}',
  'gd{a>3333:R,R}',
  'hdj{m>838:A,pv}',
  '',
  '{x=787,m=2655,a=1222,s=2876}',
  '{x=1679,m=44,a=2067,s=496}',
  '{x=2036,m=264,a=79,s=2244}',
  '{x=2461,m=1339,a=466,s=291}',
  '{x=2127,m=1623,a=2188,s=1013}',
].join('\n');

describe('Day 19 Part 1 solver', () => {
  it('solves the official example to 19114 via executeSolver with fake Clock', () => {
    let now = 10;
    const fakeClock: Clock = { nowMs: () => (now += 4) };
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result).toEqual({ answer: 19114, elapsedMs: 4, runtime: 'main-thread' });
  });

  it('returns 0 when all parts are rejected and enforces strict threshold boundaries', () => {
    const raw = [
      'in{x<100:A,x>100:A,R}',
      '',
      '{x=100,m=50,a=50,s=50}',
    ].join('\n');
    expect(solver.solve(solver.parse(raw))).toBe(0);
  });

  it('produces bounded traces with and without TraceOptions', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const fullTrace = solver.trace?.(parsed) ?? [];
    expect(fullTrace.length).toBeGreaterThan(5);
    expect(fullTrace[fullTrace.length - 1]?.runningAcceptedSum).toBe(19114);

    const sampled = solver.trace?.(parsed, { maxSteps: 5 }) ?? [];
    expect(sampled).toHaveLength(5);
    expect(sampled[0]?.stepIndex).toBe(0);
    expect(sampled[4]?.runningAcceptedSum).toBe(19114);
  });
});
