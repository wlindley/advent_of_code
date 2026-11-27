import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

function nextRand(rng: { seed: number }): number {
  rng.seed = (Math.imul(rng.seed, 1664525) + 1013904223) >>> 0;
  return rng.seed;
}

function memRead(mem: Map<bigint, bigint>, addr: bigint): bigint {
  return mem.get(addr) ?? 0n;
}

function readParam(
  mem: Map<bigint, bigint>,
  ip: bigint,
  rb: bigint,
  ins: bigint,
  pos: number,
): bigint {
  const mode = Number((ins / 10n ** BigInt(pos + 1)) % 10n);
  const raw = memRead(mem, ip + BigInt(pos));
  if (mode === 1) return raw;
  return memRead(mem, mode === 2 ? rb + raw : raw);
}

function writeAddr(
  mem: Map<bigint, bigint>,
  ip: bigint,
  rb: bigint,
  ins: bigint,
  pos: number,
): bigint {
  const mode = Number((ins / 10n ** BigInt(pos + 1)) % 10n);
  const raw = memRead(mem, ip + BigInt(pos));
  return mode === 2 ? rb + raw : raw;
}

function runOracleIntcode(tape: readonly bigint[], input: bigint): readonly bigint[] {
  const mem = new Map<bigint, bigint>(tape.map((v, i) => [BigInt(i), v]));
  const outs: bigint[] = [];
  let ip = 0n;
  let rb = 0n;
  let consumed = false;
  while (true) {
    const ins = memRead(mem, ip);
    const op = Number(ins % 100n);
    if (op === 99) return outs;
    if (op === 3) {
      mem.set(writeAddr(mem, ip, rb, ins, 1), consumed ? 0n : input);
      consumed = true;
      ip += 2n;
      continue;
    }
    const a = readParam(mem, ip, rb, ins, 1);
    if (op === 4) { outs.push(a); ip += 2n; continue; }
    if (op === 9) { rb += a; ip += 2n; continue; }
    const b = readParam(mem, ip, rb, ins, 2);
    if (op === 5 || op === 6) { ip = (op === 5 ? a !== 0n : a === 0n) ? b : ip + 3n; continue; }
    const dst = writeAddr(mem, ip, rb, ins, 3);
    if (op === 1) mem.set(dst, a + b);
    else if (op === 2) mem.set(dst, a * b);
    else mem.set(dst, (op === 7 ? a < b : a === b) ? 1n : 0n);
    ip += 4n;
  }
}

function buildSeededProgram(rng: { seed: number }, index: number): readonly bigint[] {
  const rbBase =
    index % 4 === 0
      ? 9007199254740993n + BigInt(nextRand(rng) % 500)
      : BigInt(100 + (nextRand(rng) % 900));
  const k1 = BigInt((nextRand(rng) % 2000) - 1000);
  const k2 = (1n << 63n) + BigInt(nextRand(rng) % 100000);
  const sign = nextRand(rng) % 2 === 0 ? 1n : -1n;
  const k3 = sign * BigInt((nextRand(rng) % 5000) + 1);
  const cmpOp = nextRand(rng) % 2 === 0 ? 21207n : 21208n;
  const iters = BigInt(2 + (nextRand(rng) % 6));
  return [
    109n, rbBase, 203n, 0n, 22101n, k1, 0n, 1n, 21202n, 1n, k3, 2n, cmpOp, 2n, k2, 3n,
    1205n, 3n, 22n, 1106n, 0n, 26n, 21101n, 0n, k2, 2n, 109n, 10n, 21101n, 0n, iters, 0n,
    22101n, -1n, 0n, 0n, 21208n, 0n, 0n, 1n, 1206n, 1n, 32n, 21101n, 0n, -10n, 4n, 209n, 4n,
    22001n, 0n, 2n, 5n, 204n, 5n, 99n,
  ];
}

describe('2019 Day 9 Part 2 solver', () => {
  it('dispatches sensor-mode signal 2n via executeSolver and solver.solve', () => {
    const raw = '109,500,203,0,21208,0,2,1,1205,1,14,104,-1,99,21202,0,1000000000000,2,204,2,99';
    expect(executeSolver(solver, raw).answer).toBe(2000000000000n);
    expect(solver.solve(solver.parse('109,20,203,5,204,5,99'))).toBe(2n);
  });

  it('tracks 109 and 209 relative-base progression in trace frames', () => {
    const frames = solver.trace(solver.parse('109,10,209,2,203,5,204,5,99,0,0,0,7'));
    expect(frames.map((f) => [f.relativeBaseBefore, f.relativeBaseAfter])).toEqual([
      [0n, 10n],
      [10n, 17n],
      [17n, 17n],
      [17n, 17n],
      [17n, 17n],
    ]);
    expect(frames[2]!.sparseEntries).toEqual([{ address: 22n, value: 2n }]);
    expect(frames[4]!.outputs).toEqual([2n]);
  });

  it('preserves odd-low-bit >2^63 and negative BigInt coordinate outputs', () => {
    expect(solver.solve(solver.parse('104,9223372036854775809,99'))).toBe(9223372036854775809n);
    expect(solver.solve(solver.parse('104,-9223372036854775809,99'))).toBe(-9223372036854775809n);
  });

  it('reads and writes sparse addresses beyond 2^53', () => {
    const program = solver.parse('109,9007199254740993,203,2,204,2,99');
    expect(solver.solve(program)).toBe(2n);
    const frames = solver.trace(program);
    expect(frames[1]!.sparseEntries).toEqual([{ address: 9007199254740995n, value: 2n }]);
  });

  it('bounds >100-step loops with maxSteps: 12 while keeping final state', () => {
    const loopProgram = solver.parse('109,100,203,0,22101,1,0,0,21207,0,40,1,1205,1,4,204,0,99');
    const frames = solver.trace(loopProgram, { maxSteps: 12 });
    expect(frames.length).toBe(12);
    expect(frames[11]!.totalSteps).toBeGreaterThan(100);
    expect(frames[11]!.step.halted).toBe(true);
    expect(frames[11]!.outputs).toEqual([40n]);
  });

  it('enforces separate parse, execution, and negative-RB error boundaries', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('1,bad,99')).toThrow(Error);
    expect(() => solver.solve(solver.parse('99'))).toThrow(Error);
    expect(() => solver.solve(solver.parse('104,203,104,999,99'))).toThrow(/203/);
    expect(() => solver.solve(solver.parse('3,0,3,0,4,0,99'))).toThrow(Error);
    expect(() => solver.solve(solver.parse('109,-5,204,0,99'))).toThrow(RangeError);
  });

  it('matches an independent 20-case seeded flat-loop complete Intcode oracle', () => {
    const rng = { seed: 20190902 };
    for (let i = 0; i < 20; i += 1) {
      const tape = buildSeededProgram(rng, i);
      const expected = runOracleIntcode(tape, 2n);
      expect(expected.length).toBe(1);
      const program = solver.parse(tape.join(','));
      expect(solver.solve(program)).toBe(expected[0]);
    }
  });
});
