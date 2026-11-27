import { describe, expect, it } from 'vitest';
import {
  Grammar,
  MonsterMessagesInput,
  type GrammarRule,
} from './grammar';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LOOP_PATCHED_GRAMMAR_POLICY,
  RAW_GRAMMAR_POLICY,
} from './policies';

const SAMPLE_RULES: readonly GrammarRule[] = [
  { kind: 'sequence', id: 0, alternatives: [[4, 1, 5]] },
  { kind: 'terminal', id: 4, symbol: 'a' },
  { kind: 'terminal', id: 5, symbol: 'b' },
  { kind: 'sequence', id: 1, alternatives: [[2, 3], [3, 2]] },
  { kind: 'sequence', id: 2, alternatives: [[4, 4], [5, 5]] },
  { kind: 'sequence', id: 3, alternatives: [[4, 5], [5, 4]] },
];

describe('Grammar and MonsterMessagesInput', () => {
  it('sorts rules by id, exposes getters and lookups, and freezes state', () => {
    const grammar = new Grammar(SAMPLE_RULES);
    expect(grammar.ruleCount).toBe(6);
    expect(grammar.rules.map((r) => r.id)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(grammar.hasRule(3)).toBe(true);
    expect(grammar.hasRule(99)).toBe(false);
    expect(grammar.ruleOf(4)).toEqual({ kind: 'terminal', id: 4, symbol: 'a' });
    expect(() => grammar.ruleOf(99)).toThrow('Unknown rule id 99');
    expect(Object.isFrozen(grammar)).toBe(true);
    expect(Object.isFrozen(grammar.rules)).toBe(true);
  });

  it('validates rule ids, uniqueness, terminals, sequences, rule 0, and references', () => {
    expect(() => new Grammar([{ kind: 'terminal', id: -1, symbol: 'a' }])).toThrow('non-negative integer');
    expect(() => new Grammar([{ kind: 'terminal', id: 1.5, symbol: 'a' }])).toThrow('non-negative integer');
    expect(() => new Grammar([
      { kind: 'terminal', id: 0, symbol: 'a' },
      { kind: 'terminal', id: 0, symbol: 'b' },
    ])).toThrow('Duplicate rule id 0');
    expect(() => new Grammar([{ kind: 'terminal', id: 0, symbol: 'ab' }])).toThrow('Invalid terminal symbol');
    expect(() => new Grammar([{ kind: 'sequence', id: 0, alternatives: [] }])).toThrow('at least one alternative');
    expect(() => new Grammar([{ kind: 'sequence', id: 0, alternatives: [[]] }])).toThrow('cannot be empty');
    expect(() => new Grammar([{ kind: 'terminal', id: 1, symbol: 'a' }])).toThrow('Rule 0 is required');
    expect(() => new Grammar([{ kind: 'sequence', id: 0, alternatives: [[1]] }])).toThrow('missing rule 1');
  });

  it('supports immutable overrides via withOverrides', () => {
    const base = new Grammar(SAMPLE_RULES);
    const updated = base.withOverrides([
      { kind: 'sequence', id: 0, alternatives: [[4, 5]] },
      { kind: 'terminal', id: 6, symbol: 'a' },
    ]);
    expect(base.ruleOf(0)).toEqual({ kind: 'sequence', id: 0, alternatives: [[4, 1, 5]] });
    expect(updated.ruleCount).toBe(7);
    expect(updated.ruleOf(0)).toEqual({ kind: 'sequence', id: 0, alternatives: [[4, 5]] });
    expect(updated.hasRule(6)).toBe(true);
  });

  it('validates MonsterMessagesInput messages and exposes messageCount', () => {
    const grammar = new Grammar(SAMPLE_RULES);
    const input = new MonsterMessagesInput(grammar, ['ababbb', 'abbbab']);
    expect(input.messageCount).toBe(2);
    expect(input.messages).toEqual(['ababbb', 'abbbab']);
    expect(Object.isFrozen(input)).toBe(true);
    expect(() => new MonsterMessagesInput(grammar, [])).toThrow('At least one message');
    expect(() => new MonsterMessagesInput(grammar, ['ab1'])).toThrow('Invalid message');
  });
});

describe('GrammarPolicy', () => {
  it('leaves grammar unchanged under RAW_GRAMMAR_POLICY', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const grammar = new Grammar(SAMPLE_RULES);
    expect(RAW_GRAMMAR_POLICY.id).toBe('raw');
    expect(RAW_GRAMMAR_POLICY.apply(grammar)).toBe(grammar);
  });

  it('patches rules 8 and 11 under LOOP_PATCHED_GRAMMAR_POLICY and requires 8, 11, 42, 31', () => {
    const incomplete = new Grammar(SAMPLE_RULES);
    expect(() => LOOP_PATCHED_GRAMMAR_POLICY.apply(incomplete)).toThrow('requires rule 8');

    const full = incomplete.withOverrides([
      { kind: 'terminal', id: 42, symbol: 'a' },
      { kind: 'terminal', id: 31, symbol: 'b' },
      { kind: 'sequence', id: 8, alternatives: [[42]] },
      { kind: 'sequence', id: 11, alternatives: [[42, 31]] },
    ]);
    const patched = LOOP_PATCHED_GRAMMAR_POLICY.apply(full);
    expect(LOOP_PATCHED_GRAMMAR_POLICY.id).toBe('loop-patched');
    expect(patched.ruleOf(8)).toEqual({ kind: 'sequence', id: 8, alternatives: [[42], [42, 8]] });
    expect(patched.ruleOf(11)).toEqual({
      kind: 'sequence',
      id: 11,
      alternatives: [[42, 31], [42, 11, 31]],
    });
  });
});
