import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solveHashSum, solver } from './index';

class FakeClock implements Clock {
  private index = 0;
  constructor(private readonly ticks: readonly number[]) {}
  nowMs(): number {
    const val = this.ticks[Math.min(this.index, this.ticks.length - 1)] ?? 0;
    this.index += 1;
    return val;
  }
}

class SeededRng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  nextInt(bound: number): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state % bound;
  }
}

const TOKEN_ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=-!@#$%^&*()_+[]:;./?~';

function bigIntPolynomialHashOracle(token: string): number {
  let sum = 0n;
  const len = token.length;
  for (let i = 0; i < len; i += 1) {
    sum += BigInt(token.charCodeAt(i)) * 17n ** BigInt(len - i);
  }
  return Number(sum % 256n);
}

function oracleSequenceSum(tokens: readonly string[]): number {
  let total = 0;
  for (const token of tokens) {
    total += bigIntPolynomialHashOracle(token);
  }
  return total;
}

function buildRandomToken(rng: SeededRng, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += TOKEN_ALPHABET[rng.nextInt(TOKEN_ALPHABET.length)]!;
  }
  return out;
}

describe('solver & solveHashSum', () => {
  it('solves the official 11-token example to 1320', () => {
    const raw = 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7';
    const parsed = solver.parse(raw);
    expect(solver.solve(parsed)).toBe(1320);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('returns 0 for an empty sequence', () => {
    expect(solveHashSum([])).toBe(0);
  });

  it('runs through executeSolver with a deterministic fake Clock', () => {
    const raw = 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7';
    const result = executeSolver(solver, raw, new FakeClock([12.5, 19.25]));
    expect(result).toEqual({ answer: 1320, elapsedMs: 6.75, runtime: 'main-thread' });
  });

  it('matches the BigInt Base-17 Polynomial Oracle on HASH, official tokens, and long tokens', () => {
    const official = 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7'.split(',');
    const rng = new SeededRng(202315);
    const longTokens = [32, 64, 128].map((len) => buildRandomToken(rng, len));
    const samples = ['HASH', ...official, ...longTokens];
    for (const token of samples) {
      expect(solveHashSum([token])).toBe(bigIntPolynomialHashOracle(token));
    }
    expect(solveHashSum(official)).toBe(oracleSequenceSum(official));
  });

  it('matches the BigInt Base-17 Polynomial Oracle across 120 seeded random ASCII sequences', () => {
    const rng = new SeededRng(133715);
    for (let trial = 0; trial < 120; trial += 1) {
      const count = 1 + rng.nextInt(24);
      const tokens = Array.from({ length: count }, () => buildRandomToken(rng, 1 + rng.nextInt(16)));
      const raw = tokens.join(',');
      expect(solver.solve(solver.parse(raw))).toBe(oracleSequenceSum(tokens));
    }
  });
});
