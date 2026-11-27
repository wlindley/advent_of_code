import { describe, expect, it } from 'vitest';
import { compileCnf } from './cnf';
import { parseMonsterMessages } from './parser';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LOOP_PATCHED_GRAMMAR_POLICY,
  RAW_GRAMMAR_POLICY,
} from './policies';
import { MonsterMessagesSolver } from './solver';
import { traceMessages } from './trace';

const EXAMPLE_INPUT = [
  '0: 4 1 5',
  '1: 2 3 | 3 2',
  '2: 4 4 | 5 5',
  '3: 4 5 | 5 4',
  '4: "a"',
  '5: "b"',
  '',
  'ababbb',
  'bababa',
  'abbbab',
  'aaabbb',
  'aaaabbb',
].join('\n');

describe('traceMessages and MonsterMessagesSolver', () => {
  it('traces all messages when within maxSteps and samples when exceeded', () => {
    const parsed = parseMonsterMessages(EXAMPLE_INPUT);
    const cnf = compileCnf(parsed.grammar);

    const full = traceMessages(cnf, parsed.messages, 10);
    expect(full.length).toBe(5);
    expect(full[0]!.stepIndex).toBe(0);
    expect(full[0]!.totalSteps).toBe(5);
    expect(full[0]!.messageIndex).toBe(0);
    expect(full[0]!.cumulativeMatches).toBe(1);
    expect(full[4]!.cumulativeMatches).toBe(2);
    expect(Object.isFrozen(full)).toBe(true);
    expect(Object.isFrozen(full[0])).toBe(true);

    const sampled = traceMessages(cnf, parsed.messages, 2);
    expect(sampled.length).toBe(2);
    expect(sampled.map((f) => f.messageIndex)).toEqual([0, 4]);
    expect(sampled[1]!.cumulativeMatches).toBe(2);
  });

  it('solves and traces via MonsterMessagesSolver with omitted and provided options', () => {
    const solver = new MonsterMessagesSolver(RAW_GRAMMAR_POLICY);
    expect(solver.policy.id).toBe('raw');
    expect(Object.isFrozen(solver)).toBe(true);

    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(2);

    const defaultTrace = solver.trace(parsed);
    expect(defaultTrace.length).toBe(5);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);

    const cappedTrace = solver.trace(parsed, { maxSteps: 3 });
    expect(cappedTrace.length).toBe(3);
    expect(cappedTrace.map((f) => f.messageIndex)).toEqual([0, 2, 4]);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow('positive integer');

    const patchedSolver = new MonsterMessagesSolver(LOOP_PATCHED_GRAMMAR_POLICY);
    expect(() => patchedSolver.solve(parsed)).toThrow('requires rule 8');
  });
});
