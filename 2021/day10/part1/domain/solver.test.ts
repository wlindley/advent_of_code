import { describe, expect, it } from 'vitest';
import { solver } from './solver';

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

describe('2021 Day 10 Part 1 solver', () => {
  it('solves the official 10-line example to 26397n with matching trace', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(parsed).toHaveLength(10);
    expect(solver.solve(parsed)).toBe(26397n);

    const frames = solver.trace(parsed);
    expect(frames).toHaveLength(10);
    expect(frames[9]!.runningCorruptionScore).toBe(26397n);
  });

  it('handles complete lines, empty-stack closers, and rejects invalid inputs', () => {
    expect(solver.solve(solver.parse('([])\n((('))).toBe(0n);
    expect(solver.solve(solver.parse(')\n()}'))).toBe(1200n);
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('(]X')).toThrow(SyntaxError);
  });
});
