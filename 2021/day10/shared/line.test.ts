import { describe, expect, it } from 'vitest';
import {
  classifySyntaxLine,
  CompleteLineResult,
  CorruptedLineResult,
  IncompleteLineResult,
  validateBracketText,
} from './line';

function reduceInnermostPairs(text: string): string {
  let prev = '';
  let curr = text;
  while (curr !== prev) {
    prev = curr;
    curr = curr.replaceAll(/\(\)|\[\]|\{\}|<>/g, '');
  }
  return curr;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('validateBracketText', () => {
  it('accepts valid bracket strings and rejects empty or invalid strings', () => {
    expect(() => validateBracketText('()[]{}<>')).not.toThrow();
    expect(() => validateBracketText('')).toThrow(RangeError);
    expect(() => validateBracketText('(]X')).toThrow(SyntaxError);
  });
});

describe('SyntaxLineResult value objects', () => {
  it('constructs frozen CorruptedLineResult for stacked mismatch and empty-stack closer', () => {
    const stacked = new CorruptedLineResult(2, '({[}])', 3, [0, 1, 2]);
    expect(Object.isFrozen(stacked)).toBe(true);
    expect(stacked.status).toBe('corrupted');
    expect(stacked.found).toBe('}');
    expect(stacked.expectedOpenIndex).toBe(2);
    expect(stacked.expected).toBe(']');
    expect(stacked.corruptionScore).toBe(1197n);
    expect(stacked.openStack).toEqual(['(', '{', '[']);
    expect(stacked.charRoles).toEqual(['unclosed', 'unclosed', 'unclosed', 'clash', 'unscanned', 'unscanned']);

    const matchedBeforeClash = new CorruptedLineResult(0, '()(]', 3, [2]);
    expect(matchedBeforeClash.charRoles).toEqual(['matched', 'matched', 'unclosed', 'clash']);

    const emptyStack = new CorruptedLineResult(0, '()}' , 2, []);
    expect(emptyStack.expectedOpenIndex).toBeNull();
    expect(emptyStack.expected).toBeNull();
    expect(emptyStack.corruptionScore).toBe(1197n);
    expect(emptyStack.openStack).toEqual([]);
    expect(emptyStack.charRoles).toEqual(['matched', 'matched', 'clash']);
  });

  it('validates CorruptedLineResult invariants', () => {
    expect(() => new CorruptedLineResult(-1, '()', 1, [0])).toThrow(RangeError);
    expect(() => new CorruptedLineResult(1.5, '()', 1, [0])).toThrow(RangeError);
    expect(() => new CorruptedLineResult(0, '(]', -1, [])).toThrow(RangeError);
    expect(() => new CorruptedLineResult(0, '(]', 2, [])).toThrow(RangeError);
    expect(() => new CorruptedLineResult(0, '((', 1, [0])).toThrow(SyntaxError);
    expect(() => new CorruptedLineResult(0, '()', 1, [0])).toThrow(RangeError);
    expect(() => new CorruptedLineResult(0, '(]', 1, [1])).toThrow(RangeError);
    expect(() => new CorruptedLineResult(0, '((]', 2, [1, 0])).toThrow(RangeError);
    expect(() => new CorruptedLineResult(0, '()]', 2, [1])).toThrow(SyntaxError);
  });

  it('constructs frozen IncompleteLineResult with exact BigInt base-5 steps and validates invariants', () => {
    const inc = new IncompleteLineResult(1, '[({(<(())[]>[[{[]{<()<>>', [0, 1, 2, 3, 12, 13, 14, 17]);
    expect(Object.isFrozen(inc)).toBe(true);
    expect(inc.status).toBe('incomplete');
    expect(inc.openStack).toEqual(['[', '(', '{', '(', '[', '[', '{', '{']);
    expect(inc.completionText).toBe('}}]])})]');
    expect(inc.completion).toEqual(['}', '}', ']', ']', ')', '}', ')', ']']);
    expect(inc.autocompleteScore).toBe(288957n);
    expect(inc.autocompleteSteps[0]).toEqual({ closer: '}', points: 3n, runningScore: 3n });
    expect(inc.autocompleteSteps[7]).toEqual({ closer: ']', points: 2n, runningScore: 288957n });
    expect(inc.charRoles.slice(0, 5)).toEqual(['unclosed', 'unclosed', 'unclosed', 'unclosed', 'matched']);

    expect(() => new IncompleteLineResult(0, '()', [])).toThrow(RangeError);
  });

  it('constructs frozen CompleteLineResult', () => {
    const complete = new CompleteLineResult(0, '([])');
    expect(Object.isFrozen(complete)).toBe(true);
    expect(complete.status).toBe('complete');
    expect(complete.openStack).toEqual([]);
    expect(complete.charRoles).toEqual(['matched', 'matched', 'matched', 'matched']);
  });
});

describe('classifySyntaxLine', () => {
  it('handles complete, incomplete, empty-stack closers, trailing garbage, and deep BigInt stacks', () => {
    expect(classifySyntaxLine(0, '([])').status).toBe('complete');
    expect(classifySyntaxLine(0, ')')).toMatchObject({ status: 'corrupted', errorIndex: 0, found: ')', expected: null, corruptionScore: 3n });
    expect(classifySyntaxLine(0, '()}')).toMatchObject({ status: 'corrupted', errorIndex: 2, found: '}', expected: null, corruptionScore: 1197n });
    expect(() => classifySyntaxLine(0, '(]X')).toThrow(SyntaxError);

    const deep25 = classifySyntaxLine(0, '<'.repeat(25)) as IncompleteLineResult;
    expect(deep25.autocompleteScore).toBe(5n ** 25n - 1n);

    const deep30 = classifySyntaxLine(0, '<'.repeat(30)) as IncompleteLineResult;
    expect(deep30.autocompleteScore).toBe(5n ** 30n - 1n);
    expect(deep30.autocompleteScore > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(deep30.autocompleteScore > (1n << 63n)).toBe(true);
  });

  it('matches an independent innermost-pair reduction oracle across 50 seeded PRNG cases', () => {
    const rng = createRng(202110);
    const alphabet = '()[]{}<>';
    for (let trial = 0; trial < 50; trial += 1) {
      const len = 1 + Math.floor(rng() * 32);
      let line = '';
      for (let i = 0; i < len; i += 1) line += alphabet[Math.floor(rng() * alphabet.length)];

      const result = classifySyntaxLine(trial, line);
      const reduced = reduceInnermostPairs(line);
      const firstCloser = reduced.search(/[)\]}>]/);

      if (reduced.length === 0) expect(result.status).toBe('complete');
      else if (firstCloser === -1) {
        expect(result.status).toBe('incomplete');
        expect((result as IncompleteLineResult).openStack.join('')).toBe(reduced);
      } else {
        expect(result.status).toBe('corrupted');
        expect((result as CorruptedLineResult).found).toBe(reduced[firstCloser]);
      }
    }
  });
});
