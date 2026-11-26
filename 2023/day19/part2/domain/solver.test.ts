import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_WORKFLOWS = [
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
].join('\n');

const OFFICIAL_PARTS = [
  '{x=787,m=2655,a=1222,s=2876}',
  '{x=1679,m=44,a=2067,s=496}',
  '{x=2036,m=264,a=79,s=2244}',
  '{x=2461,m=1339,a=466,s=291}',
  '{x=2127,m=1623,a=2188,s=1013}',
].join('\n');

const OFFICIAL_EXAMPLE = `${OFFICIAL_WORKFLOWS}\n\n${OFFICIAL_PARTS}`;

function createFakeClock(stepMs: number): Clock {
  let now = 10;
  return {
    nowMs() {
      now += stepMs;
      return now;
    },
  };
}

describe('Day 19 Part 2 solver', () => {
  it('solves the official example to 167409079868000n via executeSolver with fake Clock', () => {
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, createFakeClock(7));
    expect(result).toEqual({
      answer: 167409079868000n,
      elapsedMs: 7,
      runtime: 'main-thread',
    });
  });

  it('produces 167409079868000n for workflow-only input and 2-section CRLF input', () => {
    expect(solver.solve(solver.parse(OFFICIAL_WORKFLOWS))).toBe(167409079868000n);
    const crlf = OFFICIAL_EXAMPLE.replace(/\n/g, '\r\n');
    expect(solver.solve(solver.parse(crlf))).toBe(167409079868000n);
  });

  it.each([
    ['empty string', ''],
    ['blank lines only', '\n\n\n'],
    ['three sections', 'in{A}\n\n{x=1,m=1,a=1,s=1}\n\nextra'],
    ['malformed workflow', 'in{bad}'],
  ])('rejects invalid input (%s)', (_label, raw) => {
    expect(() => solver.parse(raw)).toThrow();
  });

  it.each([
    ['in{A}', 256000000000000n],
    ['in{R}', 0n],
    ['in{x<1:A,R}', 0n],
    ['in{x>4000:A,R}', 0n],
    ['in{x<2:A,R}', 64000000000n],
    ['in{x>3999:A,R}', 64000000000n],
    ['in{x<4001:A,R}', 256000000000000n],
    ['in{x<4001:R,A}', 0n],
    ['in{x<1001:R,x>2000:R,A}', 64000000000000n],
  ])('handles boundary workflow %s -> %s', (raw, expected) => {
    expect(solver.solve(solver.parse(raw))).toBe(expected);
  });

  it('produces box-split traces without and with TraceOptions', () => {
    const system = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace?.(system) ?? [];
    expect(full.length).toBeGreaterThan(5);
    expect(full[0]?.mode).toBe('box-split');
    expect(full[0]?.partIndex).toBeNull();
    expect(full[0]?.partTotal).toBeNull();
    expect(full[0]?.stepIndex).toBe(0);
    expect(full[full.length - 1]?.runningAcceptedCombinations).toBe(167409079868000n);

    const sampled = solver.trace?.(system, { maxSteps: 5 }) ?? [];
    expect(sampled).toHaveLength(5);
    expect(sampled[0]?.stepIndex).toBe(0);
    const last = sampled[4]!;
    expect(last.stepIndex).toBe(last.totalRawSteps - 1);
    expect(last.runningAcceptedCombinations).toBe(167409079868000n);
  });
});
