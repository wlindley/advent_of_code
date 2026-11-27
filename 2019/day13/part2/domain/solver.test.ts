import { describe, expect, it } from 'vitest';
import { solver } from './solver';

const BREAKOUT_ROM = [
  1, 0, 0, 231,
  104, 0, 104, 0, 104, 1, 104, 1, 104, 0, 104, 1, 104, 2, 104, 0, 104, 1, 104, 3, 104, 0, 104, 1, 104, 4, 104, 0, 104, 1,
  104, 0, 104, 1, 104, 1, 104, 4, 104, 1, 104, 1, 104, 0, 104, 2, 104, 1, 104, 4, 104, 2, 104, 1,
  104, 0, 104, 3, 104, 1, 104, 4, 104, 3, 104, 1, 104, 0, 104, 4, 104, 1, 104, 4, 104, 4, 104, 1,
  104, 1, 104, 1, 104, 2, 104, 3, 104, 1, 104, 2, 104, 1, 104, 4, 104, 3, 104, 3, 104, 2, 104, 4,
  1008, 231, 4, 232, 1006, 232, 230,
  3, 233, 1, 234, 233, 234, 1008, 234, 2, 232, 1006, 232, 230,
  104, 1, 104, 4, 104, 0, 4, 234, 104, 4, 104, 3, 104, 3, 104, 1, 104, 0, 104, 3, 104, 2, 104, 0, 104, 2, 104, 3, 104, 4, 104, -1, 104, 0, 104, 45,
  3, 233, 1, 234, 233, 234, 1008, 234, 2, 232, 1006, 232, 230,
  104, 2, 104, 3, 104, 0, 104, 1, 104, 2, 104, 4,
  3, 233, 1, 234, 233, 234, 1008, 234, 1, 232, 1006, 232, 230,
  104, 2, 104, 4, 104, 0, 4, 234, 104, 4, 104, 3, 104, 1, 104, 2, 104, 0, 104, 1, 104, 1, 104, 4, 104, -1, 104, 0, 104, 12345,
  99, 0, 0, 0, 1,
].join(',');

const STANDALONE_SCORE = '1,0,0,11,104,-1,104,0,104,12345,99,0';
const OVERWRITE_SCORE = '1,0,0,17,104,-1,104,0,104,45,104,-1,104,0,104,12345,99,0';
const RELATIVE_BASE_SCORE = '1,0,0,13,109,14,204,0,204,1,204,2,99,0,-1,0,98765';
const MINIMAL_HALT = '1,0,0,5,99,0';

interface OracleVm {
  mem: Map<number, number>;
  ip: number;
  rb: number;
  out: number[];
  paddleX: number | null;
  ballX: number | null;
  score: number;
}

function oracleMode(instr: number, pos: number): number {
  return Math.floor(instr / (pos === 1 ? 100 : pos === 2 ? 1000 : 10000)) % 10;
}

function oracleRead(vm: OracleVm, instr: number, pos: number): number {
  const raw = vm.mem.get(vm.ip + pos) ?? 0;
  const mode = oracleMode(instr, pos);
  return mode === 1 ? raw : vm.mem.get(mode === 2 ? vm.rb + raw : raw) ?? 0;
}

function oracleWrite(vm: OracleVm, instr: number, pos: number, val: number): void {
  const raw = vm.mem.get(vm.ip + pos) ?? 0;
  const addr = oracleMode(instr, pos) === 2 ? vm.rb + raw : raw;
  vm.mem.set(addr, val);
}

function oracleEmit(vm: OracleVm, val: number): void {
  vm.out.push(val);
  if (vm.out.length < 3) return;
  const [x, y, v] = vm.out as [number, number, number];
  vm.out.length = 0;
  if (x === -1 && y === 0) vm.score = v;
  else if (v === 3) vm.paddleX = x;
  else if (v === 4) vm.ballX = x;
}

function oracleStep(vm: OracleVm): boolean {
  const instr = vm.mem.get(vm.ip) ?? 0;
  const op = instr % 100;
  if (op === 99) return false;
  if (op === 3) {
    const tilt = vm.ballX === null || vm.paddleX === null || vm.ballX === vm.paddleX ? 0 : vm.ballX > vm.paddleX ? 1 : -1;
    oracleWrite(vm, instr, 1, tilt);
    vm.ip += 2;
  } else if (op === 4) {
    oracleEmit(vm, oracleRead(vm, instr, 1));
    vm.ip += 2;
  } else if (op === 9) {
    vm.rb += oracleRead(vm, instr, 1);
    vm.ip += 2;
  } else if (op === 5 || op === 6) {
    const cond = oracleRead(vm, instr, 1) !== 0;
    vm.ip = (op === 5 ? cond : !cond) ? oracleRead(vm, instr, 2) : vm.ip + 3;
  } else {
    const a = oracleRead(vm, instr, 1);
    const b = oracleRead(vm, instr, 2);
    const res = op === 1 ? a + b : op === 2 ? a * b : op === 7 ? (a < b ? 1 : 0) : a === b ? 1 : 0;
    oracleWrite(vm, instr, 3, res);
    vm.ip += 4;
  }
  return true;
}

function runOracle(raw: string): number {
  const mem = new Map<number, number>();
  const nums = raw.trim().split(',');
  for (let i = 0; i < nums.length; i += 1) mem.set(i, Number(nums[i]));
  mem.set(0, 2);
  const vm: OracleVm = { mem, ip: 0, rb: 0, out: [], paddleX: null, ballX: null, score: 0 };
  for (let steps = 0; steps < 100_000; steps += 1) {
    if (!oracleStep(vm)) return vm.score;
  }
  throw new Error('Oracle step limit exceeded');
}

describe('2019 Day 13 Part 2 solver', () => {
  it('solves and traces BREAKOUT_ROM across play turns and bounded frames', () => {
    const program = solver.parse(BREAKOUT_ROM);
    expect(solver.solve(program)).toBe(12345);

    const frames = solver.trace(program);
    expect(frames).toHaveLength(4);
    expect(frames.map((f) => f.phase)).toEqual(['play', 'play', 'play', 'play']);
    expect(frames.map((f) => f.lastTilt)).toEqual([null, 1, 0, -1]);
    expect(frames.map((f) => f.score)).toEqual([0, 45, 45, 12345]);
    expect(frames.map((f) => f.ballTrail.length)).toEqual([1, 2, 3, 4]);
    const finalBlocks = [...frames[3]!.tiles.values()].filter((t) => t.id === 2);
    expect(finalBlocks).toHaveLength(0);

    const bounded = solver.trace(program, { maxSteps: 2 });
    expect(bounded).toHaveLength(2);
    expect(bounded.map((f) => f.stepIndex)).toEqual([0, 3]);
  });

  it('handles standalone, overwritten, relative-base segment displays, and minimal halt', () => {
    expect(solver.solve(solver.parse(STANDALONE_SCORE))).toBe(12345);
    expect(solver.solve(solver.parse(OVERWRITE_SCORE))).toBe(12345);
    expect(solver.solve(solver.parse(RELATIVE_BASE_SCORE))).toBe(98765);

    const minimal = solver.parse(MINIMAL_HALT);
    expect(solver.solve(minimal)).toBe(0);
    const frames = solver.trace(minimal);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.phase).toBe('draw');
    expect(frames[0]!.tiles.size).toBe(0);
  });

  it('matches the independent flat-loop Intcode differential oracle', () => {
    for (const tape of [BREAKOUT_ROM, STANDALONE_SCORE, OVERWRITE_SCORE, RELATIVE_BASE_SCORE]) {
      expect(solver.solve(solver.parse(tape))).toBe(runOracle(tape));
    }
  });

  it('rejects invalid inputs, invalid trace options, and invalid output triples', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1,2,bad')).toThrow();
    expect(() => solver.trace(solver.parse(MINIMAL_HALT), { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('1,0,0,9,104,1,104,2,99,0'))).toThrow();
    expect(() => solver.solve(solver.parse('1,0,0,11,104,1,104,2,104,9,99,0'))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('1,0,0,11,104,-1,104,0,104,-5,99,0'))).toThrow(RangeError);
  });
});
