import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { manifest } from '../index';
import { CANONICAL_GLYPHS, solvePart2, solver, tracePart2 } from './index';

function encodeWordProgram(word: string): string {
  const byLetter = new Map(CANONICAL_GLYPHS.map((g) => [g.letter, g.rows]));
  const rows = Array.from({ length: 6 }, (_, r) =>
    [...word].map((ch) => byLetter.get(ch)![r]!).join(''),
  );
  const targets: number[] = [];
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 40; col += 2) {
      const pair = rows[row]!.slice(col, col + 2);
      if (pair === '..') targets.push(-2);
      else if (pair === '##') targets.push(col === 0 && row === 0 ? 1 : col);
      else if (pair === '#.') targets.push(col - 1);
      else targets.push(col + 2);
    }
  }
  return targets
    .map((x, i) => `addx ${(i + 1 < targets.length ? targets[i + 1]! : x) - x}`)
    .join('\n');
}

const ELFCLOCK_PROGRAM = encodeWordProgram('ELFCLOCK');

const STRIPED_PROGRAM = [
  'addx 15', 'addx -11', 'addx 6', 'addx -3', 'addx 5', 'addx -1', 'addx -8', 'addx 13',
  'addx 4', 'noop', 'addx -1', 'addx 5', 'addx -1', 'addx 5', 'addx -1', 'addx 5',
  'addx -1', 'addx 5', 'addx -1', 'addx -35', 'addx 1', 'addx 24', 'addx -19', 'addx 1',
  'addx 16', 'addx -11', 'noop', 'noop', 'addx 21', 'addx -15', 'noop', 'noop',
  'addx -3', 'addx 9', 'addx 1', 'addx -3', 'addx 8', 'addx 1', 'addx 5', 'noop',
  'noop', 'noop', 'noop', 'noop', 'addx -36', 'noop', 'addx 1', 'addx 7',
  'noop', 'noop', 'noop', 'addx 2', 'addx 6', 'noop', 'noop', 'noop',
  'noop', 'noop', 'addx 1', 'noop', 'noop', 'addx 7', 'addx 1', 'noop',
  'addx -13', 'addx 13', 'addx 7', 'noop', 'addx 1', 'addx -33', 'noop', 'noop',
  'noop', 'addx 2', 'noop', 'noop', 'noop', 'addx 8', 'noop', 'addx -1',
  'addx 2', 'addx 1', 'noop', 'addx 17', 'addx -9', 'addx 1', 'addx 1', 'addx -3',
  'addx 11', 'noop', 'noop', 'addx 1', 'noop', 'addx 1', 'noop', 'noop',
  'addx -13', 'addx -19', 'addx 1', 'addx 3', 'addx 26', 'addx -30', 'addx 12', 'addx -1',
  'addx 3', 'addx 1', 'noop', 'noop', 'noop', 'addx -9', 'addx 18', 'addx 1',
  'addx 2', 'noop', 'noop', 'addx 9', 'noop', 'noop', 'noop', 'addx -1',
  'addx 2', 'addx -37', 'addx 1', 'addx 3', 'noop', 'addx 15', 'addx -21', 'addx 22',
  'addx -6', 'addx 1', 'noop', 'addx 2', 'addx 1', 'noop', 'addx -10', 'noop',
  'noop', 'addx 20', 'addx 1', 'addx 2', 'addx 2', 'addx -6', 'addx -11', 'noop',
  'noop', 'noop',
].join('\n');

describe('Day 10 Part 2 solver', () => {
  it('exposes a frozen PuzzleSolver and solves ELFCLOCK constructively', () => {
    expect(Object.isFrozen(solver)).toBe(true);
    expect(manifest.exampleAnswer).toBe('ELFCLOCK');
    expect(solver.solve(solver.parse(manifest.exampleInput))).toBe('ELFCLOCK');
    const program = solver.parse(ELFCLOCK_PROGRAM);
    expect(solver.solve(program)).toBe('ELFCLOCK');
    expect(solvePart2(program)).toBe('ELFCLOCK');

    const ticks = [10, 15];
    const clock: Clock = { nowMs: () => ticks.shift()! };
    const result = executeSolver(solver, ELFCLOCK_PROGRAM, clock);
    expect(result.answer).toBe('ELFCLOCK');
    expect(result.elapsedMs).toBe(5);
  });

  it('progressively reveals decoded letters in tracePart2 and solver.trace', () => {
    const program = solver.parse(ELFCLOCK_PROGRAM);
    const frames = solver.trace!(program);
    expect(frames).toHaveLength(240);
    expect(frames[203]!.decodedText).toBe('________');
    expect(frames[204]!.decodedText).toBe('E_______');
    expect(frames[209]!.decodedText).toBe('EL______');
    expect(frames[239]!.decodedText).toBe('ELFCLOCK');
    expect(tracePart2(program, { maxSteps: 5 })).toHaveLength(5);
  });

  it('rejects short programs in solve while tracing the striped example cleanly', () => {
    const shortProgram = solver.parse('noop\naddx 3\naddx -5');
    expect(() => solver.solve(shortProgram)).toThrow(/240/);

    const striped = solver.parse(STRIPED_PROGRAM);
    const trace = solver.trace!(striped);
    expect(trace).toHaveLength(240);
    expect(trace[239]!.decodedText).toBe('????????');
    expect(() => solver.solve(striped)).toThrow(/slot 1/i);
  });
});
