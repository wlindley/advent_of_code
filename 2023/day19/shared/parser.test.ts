import { describe, expect, it } from 'vitest';
import { parseAplentyInput, parseWorkflowSystem } from './parser';

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

describe('Day 19 parser', () => {
  it('parses the official example into a frozen WorkflowSystem and PartRatings', () => {
    const parsed = parseAplentyInput(OFFICIAL_EXAMPLE);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.parts)).toBe(true);
    expect(parsed.system.size).toBe(11);
    expect(parsed.parts).toHaveLength(5);

    const acceptedSum = parsed.parts
      .filter((part) => parsed.system.isAccepted(part))
      .reduce((sum, part) => sum + part.total, 0);
    expect(acceptedSum).toBe(19114);
  });

  it('normalizes CRLF line endings, trailing blank lines, and fallback-only workflows', () => {
    const raw = 'in{A}\r\n\r\n{x=1,m=2,a=3,s=4}\r\n\r\n';
    const parsed = parseAplentyInput(raw);
    expect(parsed.system.size).toBe(1);
    expect(parsed.parts[0]?.total).toBe(10);
  });

  it('rejects malformed section layouts, workflow lines, rules, and part ratings', () => {
    expect(() => parseAplentyInput('')).toThrow();
    expect(() => parseAplentyInput('in{A}')).toThrow();
    expect(() => parseAplentyInput('in{A}\n\n{x=1,m=1,a=1,s=1}\n\nextra')).toThrow();
    expect(() => parseWorkflowSystem('')).toThrow();
    expect(() => parseWorkflowSystem('Bad{A}')).toThrow();
    expect(() => parseWorkflowSystem('in{}')).toThrow();
    expect(() => parseWorkflowSystem('in{x=5:A,R}')).toThrow();
    expect(() => parseWorkflowSystem('in{x<0:A,R}')).toThrow();
    expect(() => parseWorkflowSystem('in{z<5:A,R}')).toThrow();
    expect(() => parseWorkflowSystem('in{x<5:A,Bad}')).toThrow();
    expect(() => parseWorkflowSystem('in{A}\nin{R}')).toThrow();
    expect(() => parseAplentyInput('in{A}\n\n{x=0,m=1,a=1,s=1}')).toThrow();
    expect(() => parseAplentyInput('in{A}\n\n{m=1,x=1,a=1,s=1}')).toThrow();
    expect(() => parseAplentyInput('in{A}\n\nnot-a-part')).toThrow();
  });
});
