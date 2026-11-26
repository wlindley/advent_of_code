import { describe, expect, it } from 'vitest';
import { BufferedIoChannel } from './io';
import { IntcodeMachine } from './machine';
import { parseIntcodeProgram } from './program';

function oracleRun(cells: readonly bigint[], inputs: readonly bigint[]): { out: bigint[]; rb: bigint } {
  const mem = new Map<bigint, bigint>(cells.map((v, i) => [BigInt(i), v]));
  const rd = (a: bigint): bigint => mem.get(a) ?? 0n;
  const param = (ip: bigint, off: bigint, m: bigint, rb: bigint): bigint => {
    const raw = rd(ip + off);
    return m === 1n ? raw : rd(m === 2n ? rb + raw : raw);
  };
  const addr = (ip: bigint, off: bigint, m: bigint, rb: bigint): bigint =>
    (m === 2n ? rb : 0n) + rd(ip + off);
  let ip = 0n;
  let rb = 0n;
  let inIdx = 0;
  const out: bigint[] = [];
  for (let s = 0; s < 5000 && rd(ip) !== 99n; s += 1) {
    const instr = rd(ip);
    const op = instr % 100n;
    const m1 = (instr / 100n) % 10n;
    const m2 = (instr / 1000n) % 10n;
    const m3 = (instr / 10000n) % 10n;
    if (op === 1n || op === 2n || op === 7n || op === 8n) {
      const a = param(ip, 1n, m1, rb);
      const b = param(ip, 2n, m2, rb);
      const v = op === 1n ? a + b : op === 2n ? a * b : op === 7n ? (a < b ? 1n : 0n) : a === b ? 1n : 0n;
      mem.set(addr(ip, 3n, m3, rb), v);
      ip += 4n;
    } else if (op === 3n) {
      mem.set(addr(ip, 1n, m1, rb), inputs[inIdx++]!);
      ip += 2n;
    } else if (op === 4n) {
      out.push(param(ip, 1n, m1, rb));
      ip += 2n;
    } else if (op === 5n || op === 6n) {
      const c = param(ip, 1n, m1, rb);
      ip = (op === 5n ? c !== 0n : c === 0n) ? param(ip, 2n, m2, rb) : ip + 3n;
    } else {
      rb += param(ip, 1n, m1, rb);
      ip += 2n;
    }
  }
  return { out, rb };
}

function buildSeededProgram(seed: number): { raw: string; inputs: bigint[] } {
  let state = seed >>> 0;
  const next = (bound: number): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % bound;
  };
  const cells: bigint[] = [109n, 60n, 203n, 440n, 203n, 441n];
  let rb = 60n;
  for (let i = 0; i < 6; i += 1) {
    const delta = BigInt(next(121) - 80);
    if (rb + delta >= -40n && rb + delta <= 400n) {
      cells.push(109n, delta);
      rb += delta;
    }
    const op = [1n, 2n, 7n, 8n][next(4)]!;
    const m1 = BigInt(next(3));
    const m2 = BigInt(next(3));
    const m3 = next(2) === 0 ? 0n : 2n;
    const p1 = m1 === 1n ? BigInt(next(21) - 10) : m1 === 2n ? 500n - rb + BigInt(next(5)) : 500n + BigInt(next(5));
    const p2 = m2 === 1n ? BigInt(next(21) - 10) : m2 === 2n ? 500n - rb + BigInt(next(5)) : 500n + BigInt(next(5));
    const p3 = m3 === 2n ? 500n - rb + BigInt(next(5)) : 500n + BigInt(next(5));
    cells.push(m3 * 10000n + m2 * 1000n + m1 * 100n + op, p1, p2, p3);
  }
  cells.push(204n, 500n - rb, 4n, 501n, 109n, 10n, 209n, 500n - (rb + 10n), 99n);
  return {
    raw: cells.map((c) => c.toString()).join(','),
    inputs: [(1n << 62n) + BigInt(next(999)), -(1n << 61n) - BigInt(next(999))],
  };
}

describe('IntcodeMachine complete Day 9 VM', () => {
  it('runs all three official AoC 2019 Day 9 examples', () => {
    const quine = '109,1,204,-1,1001,100,1,100,1008,100,16,101,1006,101,0,99';
    const qm = IntcodeMachine.fromCompleteProgram(parseIntcodeProgram(quine));
    qm.run(200);
    expect(qm.snapshotOutputs()).toEqual(quine.split(',').map((s) => BigInt(s)));

    const sixteen = IntcodeMachine.fromCompleteProgram(parseIntcodeProgram('1102,34915192,34915192,7,4,7,99,0'));
    sixteen.run(20);
    expect(sixteen.snapshotOutputs()).toEqual([1219070632396864n]);

    const large = IntcodeMachine.fromCompleteProgram(parseIntcodeProgram('104,1125899906842624,99'));
    large.run(10);
    expect(large.snapshotOutputs()).toEqual([1125899906842624n]);
  });

  it('supports relative base adjustment, negative RB valid effective addresses, and sparse code execution', () => {
    const negRb = IntcodeMachine.fromCompleteProgram(
      parseIntcodeProgram('109,-10,204,15,21101,40,2,16,4,6,99,0'),
    );
    negRb.run(20);
    expect(negRb.relativeBase).toBe(-10n);
    expect(negRb.snapshotOutputs()).toEqual([40n, 42n]);

    const rboOldRb = IntcodeMachine.fromCompleteProgram(parseIntcodeProgram('109,4,209,1,99,10'));
    rboOldRb.run(10);
    expect(rboOldRb.relativeBase).toBe(14n);

    const sparseCode = IntcodeMachine.fromCompleteProgram(
      parseIntcodeProgram('1101,104,0,500,1101,777,0,501,1101,99,0,502,1105,1,500'),
    );
    sparseCode.run(20);
    expect(sparseCode.snapshotOutputs()).toEqual([777n]);
  });

  it('handles 203 relative input, preserves relativeBase across pause/resume, and validates negative 203 before I/O', () => {
    const io = new BufferedIoChannel([]);
    const pauseVm = IntcodeMachine.fromCompleteProgram(
      parseIntcodeProgram('109,5,203,2,204,2,99,0'),
      { io },
    );
    expect(pauseVm.relativeBase).toBe(0n);
    pauseVm.run(10);
    expect(pauseVm.status).toBe('waiting-input');
    expect(pauseVm.relativeBase).toBe(5n);
    pauseVm.pushInput(88n);
    pauseVm.run(10);
    expect(pauseVm.status).toBe('halted');
    expect(pauseVm.relativeBase).toBe(5n);
    expect(pauseVm.snapshotOutputs()).toEqual([88n]);

    const badWithInput = IntcodeMachine.fromCompleteProgram(
      parseIntcodeProgram('109,-10,203,5,99'),
      { io: new BufferedIoChannel([55n]) },
    );
    badWithInput.step();
    expect(() => badWithInput.step()).toThrow(RangeError);
    expect(badWithInput.pendingInputCount).toBe(1);
    expect(badWithInput.status).toBe('running');

    const badEmpty = IntcodeMachine.fromCompleteProgram(parseIntcodeProgram('109,-10,203,5,99'));
    badEmpty.step();
    expect(() => badEmpty.step()).toThrow(RangeError);
    expect(badEmpty.status).toBe('running');
  });

  it('matches an independent flat-loop oracle across 25 seeded complete Intcode programs', () => {
    for (let trial = 0; trial < 25; trial += 1) {
      const { raw, inputs } = buildSeededProgram(20190901 + trial);
      const program = parseIntcodeProgram(raw);
      const expected = oracleRun(program.cells, inputs);
      const vm = IntcodeMachine.fromCompleteProgram(program, { io: new BufferedIoChannel(inputs) });
      vm.run(5000);
      expect(vm.status).toBe('halted');
      expect(vm.snapshotOutputs()).toEqual(expected.out);
      expect(vm.relativeBase).toBe(expected.rb);
    }
  });
});
