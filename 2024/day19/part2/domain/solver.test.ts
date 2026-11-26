import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { LinenLayout, STRIPE_COLORS } from '../../shared';
import { solvePart2, solver } from './index';

const EXAMPLE_INPUT =
  'r, wr, b, g, bwu, rb, gb, br\n\nbrwrr\nbggr\ngbbr\nrrbgbr\nubwu\nbwurrg\nbrgr\nbbrgwb';

class FakeClock implements Clock {
  private ticks = 100;
  nowMs(): number {
    this.ticks += 12;
    return this.ticks;
  }
}

class LcgRng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  nextInt(bound: number): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return Math.floor((this.state / 0x100000000) * bound);
  }
  nextSeq(len: number, alpha: number): string {
    let out = '';
    for (let i = 0; i < len; i += 1) out += STRIPE_COLORS[this.nextInt(alpha)]!;
    return out;
  }
}

function oracleCountFrom(patterns: readonly string[], design: string, pos: number, memo: Map<number, bigint>): bigint {
  if (pos === design.length) return 1n;
  const cached = memo.get(pos);
  if (cached !== undefined) return cached;
  let ways = 0n;
  for (const pat of patterns) {
    if (design.startsWith(pat, pos)) ways += oracleCountFrom(patterns, design, pos + pat.length, memo);
  }
  memo.set(pos, ways);
  return ways;
}

function oracleTotal(layout: LinenLayout): bigint {
  let total = 0n;
  for (const design of layout.designs) total += oracleCountFrom(layout.patterns, design, 0, new Map());
  return total;
}

function countPartitionsFrom(patterns: readonly string[], design: string, pos: number): bigint {
  if (pos === design.length) return 1n;
  let total = 0n;
  for (const pat of patterns) {
    if (design.startsWith(pat, pos)) total += countPartitionsFrom(patterns, design, pos + pat.length);
  }
  return total;
}

function makeRandomLayout(rng: LcgRng, designLenMin: number, designLenSpan: number): LinenLayout {
  const alpha = 2 + rng.nextInt(4);
  const patSet = new Set<string>();
  const patTarget = 4 + rng.nextInt(10);
  while (patSet.size < patTarget) patSet.add(rng.nextSeq(1 + rng.nextInt(4), alpha));
  const designs: string[] = [];
  for (let d = 0; d < 6; d += 1) designs.push(rng.nextSeq(designLenMin + rng.nextInt(designLenSpan), alpha));
  return new LinenLayout([...patSet], designs);
}

describe('Day 19 Part 2 solver', () => {
  it('solves the official example via executeSolver and solvePart2', () => {
    const result = executeSolver(solver, EXAMPLE_INPUT, new FakeClock());
    expect(typeof result.answer).toBe('bigint');
    expect(result.answer).toBe(16n);
    expect(result.elapsedMs).toBe(12);
    expect(result.runtime).toBe('main-thread');
    expect(solvePart2(solver.parse(EXAMPLE_INPUT))).toBe(16n);
  });

  it('preserves exact multi-design BigInt precision beyond 64-bit signed integer range', () => {
    const layout = solver.parse(`w, ww, u\n\n${'w'.repeat(95)}\nu`);
    const sum = solvePart2(layout);
    expect(sum).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
    expect(sum).toBeGreaterThan((1n << 63n) - 1n);
    expect(sum & 1n).toBe(1n);
    expect(sum).toBe(oracleTotal(layout));
  });

  it('handles duplicate designs, duplicate patterns, and all-impossible layouts', () => {
    expect(solvePart2(solver.parse('r, wr, b, br\n\nbrwrr\nbrwrr'))).toBe(4n);
    expect(solvePart2(solver.parse('r, r, wr, b, br, br\n\nbrwrr'))).toBe(2n);
    expect(solvePart2(solver.parse('r, g\n\nubwu\nbbrgwb'))).toBe(0n);
  });

  it('matches startsWith BigInt oracle on example and 20 seeded random layouts', () => {
    const example = solver.parse(EXAMPLE_INPUT);
    expect(solvePart2(example)).toBe(oracleTotal(example));
    const rng = new LcgRng(20241219);
    for (let trial = 0; trial < 20; trial += 1) {
      const layout = makeRandomLayout(rng, 4, 14);
      expect(solvePart2(layout)).toBe(oracleTotal(layout));
    }
  });

  it('matches exhaustive backtracking partition counter on short designs (L <= 10)', () => {
    const rng = new LcgRng(19022024);
    for (let trial = 0; trial < 10; trial += 1) {
      const layout = makeRandomLayout(rng, 1, 10);
      let expected = 0n;
      for (const design of layout.designs) expected += countPartitionsFrom(layout.patterns, design, 0);
      expect(solvePart2(layout)).toBe(expected);
    }
  });

  it('produces uncapped and capped traces with exact cumulativeArrangements', () => {
    const layout = solver.parse(EXAMPLE_INPUT);
    const fullTrace = solver.trace!(layout);
    expect(fullTrace.length).toBe(8);
    expect(fullTrace.map((f) => f.analysis.wayCount)).toEqual([2n, 1n, 4n, 6n, 0n, 1n, 2n, 0n]);
    expect(fullTrace[7]!.cumulativeArrangements).toBe(16n);
    const capped = solver.trace!(layout, { maxSteps: 3 });
    expect(capped.length).toBe(3);
    expect(capped[2]!.designIndex).toBe(7);
    expect(capped[2]!.cumulativeArrangements).toBe(16n);
  });

  it('rejects empty input', () => { expect(() => solver.parse('')).toThrow(Error); });
  it('rejects missing blank separator', () => { expect(() => solver.parse('r, wr\nbrwrr')).toThrow(Error); });
  it('rejects invalid color in pattern', () => { expect(() => solver.parse('r, x\n\nbrwrr')).toThrow(RangeError); });
  it('rejects invalid color in design', () => { expect(() => solver.parse('r, wr\n\nbrxrr')).toThrow(RangeError); });
  it('rejects empty pattern token', () => { expect(() => solver.parse('r, , wr\n\nbrwrr')).toThrow(RangeError); });
});
