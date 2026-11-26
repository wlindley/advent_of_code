import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, type NavigationTraceFrame } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = 'forward 5\ndown 5\nforward 8\nup 3\ndown 8\nforward 2';

type AimSegment = { readonly dh: bigint; readonly dd: bigint; readonly da: bigint };

class SeededRng {
  private state: bigint;
  constructor(seed: bigint) { this.state = seed & 0xffffffffffffffffn; }
  nextUint32(): number {
    this.state = (this.state * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn;
    return Number((this.state >> 32n) & 0xffffffffn);
  }
  nextInt(bound: number): number { return this.nextUint32() % bound; }
}

function fixedNowMs(): number { return 42; }
function fixedClock(): Clock { return { nowMs: fixedNowMs }; }
function parseRaw(raw: string): void { solver.parse(raw); }
function traceZeroSteps(): void { solver.trace!(solver.parse(EXAMPLE_INPUT), { maxSteps: 0 }); }
function getStepIndex(frame: NavigationTraceFrame): number { return frame.stepIndex; }

function composeAimSegments(left: AimSegment, right: AimSegment): AimSegment {
  return { dh: left.dh + right.dh, dd: left.dd + left.da * right.dh + right.dd, da: left.da + right.da };
}

function evalAimMonoidRange(lines: readonly string[], start: number, end: number): AimSegment {
  if (end - start === 1) {
    const [dir, rawUnits] = lines[start]!.split(' ');
    const units = BigInt(rawUnits!);
    if (dir === 'forward') return { dh: units, dd: 0n, da: 0n };
    return { dh: 0n, dd: 0n, da: dir === 'down' ? units : -units };
  }
  const mid = (start + end) >> 1;
  return composeAimSegments(evalAimMonoidRange(lines, start, mid), evalAimMonoidRange(lines, mid, end));
}

function oracleMonoidAimProduct(lines: readonly string[]): bigint {
  const seg = evalAimMonoidRange(lines, 0, lines.length);
  return seg.dh * seg.dd;
}

function oracleImperativeAimProduct(lines: readonly string[]): bigint {
  let horiz = 0n;
  let depth = 0n;
  let aim = 0n;
  for (const line of lines) {
    const [dir, rawUnits] = line.split(' ');
    const units = BigInt(rawUnits!);
    if (dir === 'forward') { horiz += units; depth += aim * units; }
    else aim += dir === 'down' ? units : -units;
  }
  return horiz * depth;
}

function generateFuzzLines(rng: SeededRng, length: number, includeHuge: boolean): string[] {
  const dirs = ['forward', 'down', 'up'] as const;
  const lines: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const small = BigInt(rng.nextInt(1000));
    const units = includeHuge && i % 5 === 0 ? (1n << 65n) + small : small;
    lines.push(`${dirs[rng.nextInt(3)]} ${units}`);
  }
  return lines;
}

function buildLongCourseRaw(count: number): string {
  const dirs = ['down', 'forward', 'up'] as const;
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) lines.push(`${dirs[i % 3]} ${(i % 9) + 1}`);
  return lines.join('\n');
}

describe('2021 Day 2 Part 2 solver', () => {
  it('solves the official example to 900n and freezes the solver object', () => {
    const answer = solver.solve(solver.parse(EXAMPLE_INPUT));
    expect(answer).toBe(900n);
    expect(String(answer)).toBe('900');
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('distinguishes command order because aim navigation is non-commutative', () => {
    expect(solver.solve(solver.parse('down 5\nforward 4'))).toBe(80n);
    expect(solver.solve(solver.parse('forward 4\ndown 5'))).toBe(0n);
  });

  it('handles single-command, zero-unit, negative-aim, and sign-recovery courses', () => {
    expect(solver.solve(solver.parse('forward 9'))).toBe(0n);
    expect(solver.solve(solver.parse('down 7'))).toBe(0n);
    expect(solver.solve(solver.parse('up 7'))).toBe(0n);
    expect(solver.solve(solver.parse('down 5\nforward 0'))).toBe(0n);
    expect(solver.solve(solver.parse('up 4\nforward 3'))).toBe(-36n);
    expect(solver.solve(solver.parse('up 3\nforward 2\ndown 8\nforward 3'))).toBe(45n);
  });

  it('preserves exact cubic BigInt precision above 2^63 with odd low bit', () => {
    const big = (1n << 22n) + 1n;
    const answer = solver.solve(solver.parse(`down ${big}\nforward ${big}`));
    expect(answer).toBe(big ** 3n);
  });

  it('produces default, bounded, and uniformly sampled trace frames', () => {
    const course = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace!(course);
    expect(full.length).toBe(6);
    expect([full[0]?.after.aim, full[0]?.after.product]).toEqual([0n, 0n]);
    expect([full[2]?.after.aim, full[2]?.after.product]).toEqual([5n, 520n]);
    expect([full[5]?.after.aim, full[5]?.after.product]).toEqual([10n, 900n]);
    expect(solver.trace!(course, { maxSteps: 2 }).map(getStepIndex)).toEqual([0, 5]);
    const large = solver.parse(buildLongCourseRaw(200));
    const sampled = solver.trace!(large);
    expect(sampled.length).toBe(DEFAULT_MAX_TRACE_STEPS);
    expect(sampled[0]?.stepIndex).toBe(0);
    expect(sampled[sampled.length - 1]?.stepIndex).toBe(199);
    expect(sampled[sampled.length - 1]?.after.product).toBe(solver.solve(large));
  });

  it('integrates with executeSolver using an injected fixed clock', () => {
    const result = executeSolver(solver, EXAMPLE_INPUT, fixedClock());
    expect(result).toEqual({ answer: 900n, elapsedMs: 0, runtime: 'main-thread' });
  });

  it('rejects empty input with RangeError', () => {
    expect(parseRaw.bind(null, '')).toThrow(RangeError);
  });

  it('rejects unknown direction with SyntaxError', () => {
    expect(parseRaw.bind(null, 'sideways 4')).toThrow(SyntaxError);
  });

  it('rejects negative units with SyntaxError', () => {
    expect(parseRaw.bind(null, 'forward -3')).toThrow(SyntaxError);
  });

  it('rejects extra tokens with SyntaxError', () => {
    expect(parseRaw.bind(null, 'forward 5 extra')).toThrow(SyntaxError);
  });

  it('rejects zero trace maxSteps with RangeError', () => {
    expect(traceZeroSteps).toThrow(RangeError);
  });

  it('matches imperative and divide-and-conquer monoid oracles across 50 fuzz trials', () => {
    const rng = new SeededRng(20210202n);
    for (let trial = 0; trial < 50; trial += 1) {
      const lines = generateFuzzLines(rng, 1 + rng.nextInt(40), trial % 2 === 0);
      const expected = oracleImperativeAimProduct(lines);
      expect(oracleMonoidAimProduct(lines)).toBe(expected);
      expect(solver.solve(solver.parse(lines.join('\n')))).toBe(expected);
    }
  });
});
