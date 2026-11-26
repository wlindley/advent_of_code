import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextUint32(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state;
  }

  nextInt(bound: number): number {
    return this.nextUint32() % bound;
  }
}

function oracleSolve1202(raw: string): bigint {
  const mem = raw.trim().split(',').map((token) => BigInt(token.trim()));
  mem[1] = 12n;
  mem[2] = 2n;
  let ip = 0;
  while (mem[ip] !== 99n) {
    if (ip >= mem.length) throw new Error('Oracle ran past end of tape');
    const op = mem[ip]!;
    const lhs = mem[Number(mem[ip + 1]!)]!;
    const rhs = mem[Number(mem[ip + 2]!)]!;
    const dest = Number(mem[ip + 3]!);
    mem[dest] = op === 1n ? lhs + rhs : lhs * rhs;
    ip += 4;
  }
  return mem[0]!;
}

function pickSeededCell(rng: SeededRng): bigint {
  const kind = rng.nextInt(3);
  if (kind === 0) return BigInt(rng.nextInt(41) - 20);
  if (kind === 1) return (1n << 64n) + BigInt(rng.nextInt(10_000));
  return -(1n << 63n) - BigInt(rng.nextInt(10_000));
}

function pickSafeDest(rng: SeededRng, instrIdx: number, numInstr: number, totalLen: number): number {
  if (rng.nextInt(4) === 0) return 0;
  if (rng.nextInt(3) === 0) {
    return rng.nextInt((instrIdx + 1) * 4);
  }
  const dataStart = numInstr * 4 + 1;
  return dataStart + rng.nextInt(totalLen - dataStart);
}

function generateSeededProgram(rng: SeededRng): string {
  const numInstr = 3 + rng.nextInt(7);
  const dataStart = numInstr * 4 + 1;
  const totalLen = dataStart + 4 + rng.nextInt(6);
  const cells = new Array<bigint>(totalLen).fill(0n);

  for (let i = dataStart; i < totalLen; i += 1) {
    cells[i] = pickSeededCell(rng);
  }
  cells[numInstr * 4] = 99n;
  for (let k = 0; k < numInstr; k += 1) {
    cells[k * 4] = rng.nextInt(2) === 0 ? 1n : 2n;
    cells[k * 4 + 1] = BigInt(rng.nextInt(totalLen));
    cells[k * 4 + 2] = BigInt(rng.nextInt(totalLen));
    cells[k * 4 + 3] = BigInt(pickSafeDest(rng, k, numInstr, totalLen));
  }
  return cells.map((value) => value.toString()).join(',');
}

describe('2019 Day 2 Part 1 solver', () => {
  it('solves the Day 2 Part 1 example input via executeSolver', () => {
    const execution = executeSolver(solver, '1,0,0,3,2,3,11,0,99,30,40,50,68');
    expect(execution.answer).toBe(3500n);
  });

  it('matches independent flat-loop oracle across 30 seeded programs with BigInts and self-modification', () => {
    const rng = new SeededRng(20190201);
    for (let trial = 0; trial < 30; trial += 1) {
      const raw = generateSeededProgram(rng);
      const expected = oracleSolve1202(raw);
      const program = solver.parse(raw);
      expect(solver.solve(program)).toBe(expected);
      const frames = solver.trace(program);
      expect(frames[frames.length - 1]!.memory[0]).toBe(expected);
    }
  });

  it('rejects invalid input and short tapes lacking addresses 1 and 2', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('1,bad,99')).toThrow(Error);
    expect(() => solver.solve(solver.parse('99'))).toThrow(RangeError);
    expect(() => solver.trace(solver.parse('99'))).toThrow(RangeError);
  });
});
