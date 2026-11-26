import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = 'forward 5\ndown 5\nforward 8\nup 3\ndown 8\nforward 2';

class SeededRng {
  private state: bigint;

  constructor(seed: bigint) {
    this.state = seed & 0xffffffffffffffffn;
  }

  nextUint32(): number {
    this.state = (this.state * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn;
    return Number((this.state >> 32n) & 0xffffffffn);
  }

  nextInt(bound: number): number {
    return this.nextUint32() % bound;
  }
}

function oracleVectorProduct(lines: readonly string[]): bigint {
  let horiz = 0n;
  let depth = 0n;
  for (const line of lines) {
    const [dir, rawUnits] = line.split(' ');
    const units = BigInt(rawUnits!);
    if (dir === 'forward') horiz += units;
    else if (dir === 'down') depth += units;
    else depth -= units;
  }
  return horiz * depth;
}

function generateFuzzLines(rng: SeededRng, length: number, includeHuge: boolean): string[] {
  const dirs = ['forward', 'down', 'up'] as const;
  const lines: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const dir = dirs[rng.nextInt(3)]!;
    const small = BigInt(rng.nextInt(1000));
    const units = includeHuge && i % 5 === 0 ? (1n << 65n) + small : small;
    lines.push(`${dir} ${units}`);
  }
  return lines;
}

function shuffleLines(lines: readonly string[], rng: SeededRng): string[] {
  const copy = [...lines];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(i + 1);
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

describe('2021 Day 2 Part 1 solver', () => {
  it('solves the official example to 150n', () => {
    const course = solver.parse(EXAMPLE_INPUT);
    const answer = solver.solve(course);
    expect(answer).toBe(150n);
    expect(String(answer)).toBe('150');
  });

  it('handles single-command, zero-unit, and negative-depth edge cases', () => {
    expect(solver.solve(solver.parse('forward 9'))).toBe(0n);
    expect(solver.solve(solver.parse('down 7'))).toBe(0n);
    expect(solver.solve(solver.parse('forward 0\ndown 12'))).toBe(0n);
    expect(solver.solve(solver.parse('up 5\nforward 4'))).toBe(-20n);
  });

  it('integrates with executeSolver and propagates parser errors', () => {
    const fakeClock: Clock = { nowMs: () => 42 };
    const result = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(result.answer).toBe(150n);
    expect(result.elapsedMs).toBe(0);
    expect(result.runtime).toBe('main-thread');

    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('sideways 4')).toThrow(SyntaxError);
  });

  it('produces default and bounded trace frames', () => {
    const course = solver.parse(EXAMPLE_INPUT);
    const fullTrace = solver.trace!(course);
    expect(fullTrace.length).toBe(6);
    expect(fullTrace[0]?.after.horizontal).toBe(5n);
    expect(fullTrace[5]?.after.product).toBe(150n);

    const bounded = solver.trace!(course, { maxSteps: 2 });
    expect(bounded.map((frame) => frame.stepIndex)).toEqual([0, 5]);
  });

  it('matches commutative vector-sum oracle and permutation invariance across 50 PRNG fuzz courses', () => {
    const rng = new SeededRng(20210201n);
    for (let trial = 0; trial < 50; trial += 1) {
      const length = 1 + rng.nextInt(40);
      const lines = generateFuzzLines(rng, length, trial % 2 === 0);
      const shuffled = shuffleLines(lines, rng);

      const expected = oracleVectorProduct(lines);
      const actual = solver.solve(solver.parse(lines.join('\n')));
      const permuted = solver.solve(solver.parse(shuffled.join('\n')));

      expect(actual).toBe(expected);
      expect(permuted).toBe(expected);
    }
  });
});
