import { describe, expect, it } from 'vitest';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '[({(<(())[]>[[{[]{<()<>>',
  '[(()[<>])]({[<{<<[]>>(',
  '{([(<{}[<>[]}>{[]{[(<()>',
  '(((({<>}<{<{<>}{[]{[]{}',
  '[[<[([]))<([[{}[[()]]]',
  '[{[{({}]{}}([{[{{{}}([]',
  '{<[[]]>}<{[{[{[]{()[[[]',
  '[<(<(<(<{}))><([]([]()',
  '<{([([[(<>()){}]>(<<{{',
  '<{([{{}}[<[[[<>{}]]]>[]]',
].join('\n');

const ORACLE_PTS: Record<string, bigint> = { '(': 1n, '[': 2n, '{': 3n, '<': 4n };
const BRACKETS = '()[]{}<>';
const OPENERS = '([{<';
const CLOSERS: Record<string, string> = { '(': ')', '[': ']', '{': '}', '<': '>' };

function nextRand(rng: { s: number }): number {
  rng.s = (Math.imul(rng.s, 1664525) + 1013904223) >>> 0;
  return rng.s / 0x100000000;
}

function reduceInnermostPairs(line: string): string {
  let cur = line;
  let next = cur.replace(/\(\)|\[\]|\{\}|<>/g, '');
  while (next !== cur) {
    cur = next;
    next = cur.replace(/\(\)|\[\]|\{\}|<>/g, '');
  }
  return cur;
}

function oracleMedian(lines: readonly string[]): bigint {
  const scores: bigint[] = [];
  for (const line of lines) {
    const reduced = reduceInnermostPairs(line);
    if (reduced.length === 0 || /[)\]}>]/.test(reduced)) continue;
    let score = 0n;
    for (let i = reduced.length - 1; i >= 0; i -= 1) {
      score = score * 5n + ORACLE_PTS[reduced[i]!]!;
    }
    scores.push(score);
  }
  if (scores.length === 0) throw new RangeError('No incomplete lines');
  scores.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return scores[Math.floor(scores.length / 2)]!;
}

function genCaseLines(rng: { s: number }): string[] {
  const lineCount = 3 + Math.floor(nextRand(rng) * 9);
  const lines: string[] = [];
  for (let i = 0; i < lineCount; i += 1) {
    const len = 2 + Math.floor(nextRand(rng) * 20);
    const stack: string[] = [];
    let out = '';
    for (let j = 0; j < len; j += 1) {
      const r = nextRand(rng);
      if (stack.length > 0 && r < 0.38) {
        out += CLOSERS[stack.pop()!]!;
      } else if (r < 0.88) {
        const op = OPENERS[Math.floor(nextRand(rng) * 4)]!;
        stack.push(op);
        out += op;
      } else {
        out += BRACKETS[Math.floor(nextRand(rng) * 8)]!;
      }
    }
    lines.push(out);
  }
  return lines;
}

describe('2021 Day 10 Part 2 solver', () => {
  it('solves the official 10-line example to 288957n with progressive AutocompleteScanFrames', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(parsed).toHaveLength(10);
    expect(solver.solve(parsed)).toBe(288957n);

    const frames = solver.trace(parsed);
    expect(frames).toHaveLength(5);
    expect(frames.map((f) => f.currentLine.autocompleteScore)).toEqual([
      288957n, 5566n, 1480781n, 995444n, 294n,
    ]);
    expect(frames.map((f) => f.runningMedianScore)).toEqual([
      288957n, 288957n, 288957n, 995444n, 288957n,
    ]);

    const bounded3 = solver.trace(parsed, { maxSteps: 3 });
    expect(bounded3).toHaveLength(3);
    expect(bounded3[2]!.inspectedCount).toBe(5);
    expect(bounded3[2]!.runningMedianScore).toBe(288957n);

    const bounded1 = solver.trace(parsed, { maxSteps: 1 });
    expect(bounded1).toHaveLength(1);
    expect(bounded1[0]!.inspectedCount).toBe(5);
    expect(bounded1[0]!.runningMedianScore).toBe(288957n);
  });

  it('preserves exact BigInt precision beyond 2^53 and 2^63 on deep stacks', () => {
    const deep = ['<'.repeat(25), '<'.repeat(30), '(' + '<'.repeat(29)];
    const median = solver.solve(deep);
    expect(median).toBe(5n ** 30n - 4n);
    expect(median).toBe(931322574615478515621n);
    expect(Number(5n ** 30n - 4n)).toBe(Number(5n ** 30n - 1n));
  });

  it('handles duplicate scores, even incomplete counts, and complete-line filtering', () => {
    expect(solver.solve(solver.parse('(\n(\n['))).toBe(1n);
    expect(solver.solve(solver.parse('(\n<'))).toBe(4n);
    expect(solver.solve(solver.parse('()\n([])\n(]\n<{\n[\n('))).toBe(2n);
  });

  it('throws RangeError or SyntaxError on invalid inputs, zero incomplete lines, and bad maxSteps', () => {
    const allCorrupted = solver.parse('(]\n{>');
    const allComplete = solver.parse('()\n[]');
    expect(() => solver.solve(allCorrupted)).toThrow(RangeError);
    expect(() => solver.trace(allCorrupted)).toThrow(RangeError);
    expect(() => solver.solve(allComplete)).toThrow(RangeError);
    expect(() => solver.trace(allComplete)).toThrow(RangeError);

    const valid = solver.parse('(');
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => solver.trace(valid, { maxSteps: bad })).toThrow(RangeError);
    }
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('(\n\n)')).toThrow(RangeError);
    expect(() => solver.parse('(X')).toThrow(SyntaxError);
  });

  it('matches an independent innermost-pair-reduction oracle across 35 seeded PRNG cases', () => {
    const rng = { s: 20211002 };
    for (let i = 0; i < 35; i += 1) {
      const lines = genCaseLines(rng);
      if (lines.every((l) => /[)\]}>]/.test(reduceInnermostPairs(l)) || reduceInnermostPairs(l) === '')) {
        lines.push('([{<');
      }
      const parsed = solver.parse(lines.join('\n'));
      expect(solver.solve(parsed)).toBe(oracleMedian(parsed));
    }
  });
});
