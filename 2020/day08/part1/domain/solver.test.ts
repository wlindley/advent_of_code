import { describe, expect, it } from 'vitest';
import { solver } from './index';

const EXAMPLE_INPUT = [
  'nop +0',
  'acc +1',
  'jmp +4',
  'acc +3',
  'jmp -3',
  'acc -99',
  'acc +1',
  'jmp -4',
  'acc +6',
].join('\n');

function independentLoopInterpreter(
  raw: string,
): { readonly loops: true; readonly acc: bigint } | { readonly loops: false } {
  const lines = raw.trim().split('\n');
  const seen = new Set<number>();
  let pc = 0;
  let acc = 0n;
  while (pc >= 0 && pc < lines.length) {
    if (seen.has(pc)) {
      return { loops: true, acc };
    }
    seen.add(pc);
    const [op, rawArg] = lines[pc]!.split(' ');
    const arg = Number(rawArg);
    if (op === 'acc') {
      acc += BigInt(arg);
      pc += 1;
    } else if (op === 'jmp') {
      pc += arg;
    } else {
      pc += 1;
    }
  }
  return { loops: false };
}

function makeSeededPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateRawProgram(rand: () => number, length: number): string {
  const lines: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const pick = rand();
    const op = pick < 0.4 ? 'acc' : pick < 0.75 ? 'jmp' : 'nop';
    const offset = Math.floor(rand() * (length * 2 + 1)) - length;
    lines.push(`${op} ${offset >= 0 ? `+${offset}` : `${offset}`}`);
  }
  return lines.join('\n');
}

describe('2020 Day 8 Part 1 solver', () => {
  it('solves the official example to 5n', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(5n);
  });

  it('produces a loop-detected trace ending at accumulator 5n', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const trace = solver.trace(parsed, { maxSteps: 5 });
    expect(trace).toHaveLength(5);
    expect(trace[4]!.phase).toBe('loop-detected');
    expect(trace[4]!.accumulator).toBe(5n);
  });

  it('matches an independent interpreter across 50 seeded PRNG programs', () => {
    const rand = makeSeededPrng(20200801);
    let loopCount = 0;
    let nonLoopCount = 0;

    for (let i = 0; i < 50; i += 1) {
      const raw = generateRawProgram(rand, 5 + (i % 16));
      const oracle = independentLoopInterpreter(raw);
      const parsed = solver.parse(raw);
      if (oracle.loops) {
        loopCount += 1;
        expect(solver.solve(parsed)).toBe(oracle.acc);
      } else {
        nonLoopCount += 1;
        expect(() => solver.solve(parsed)).toThrow(/loop-detected/i);
      }
    }

    expect(loopCount).toBeGreaterThan(0);
    expect(nonLoopCount).toBeGreaterThan(0);
  });
});
