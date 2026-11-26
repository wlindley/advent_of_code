import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { THERMAL_RADIATOR_SYSTEM_ID, runDiagnostic } from '../../shared';
import { solver } from './index';

const LARGE_EXAMPLE =
  '3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99';

class SeededRng {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  nextInt(bound: number): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state % bound;
  }
}

function oracleRead(mem: readonly bigint[], ip: number, off: number, mode: bigint): bigint {
  return mode === 1n ? mem[ip + off]! : mem[Number(mem[ip + off]!)]!;
}

function oracleStep(mem: bigint[], ip: number, st: { usedInput: boolean; outputs: bigint[]; systemId: bigint }): number {
  const instr = mem[ip]!, op = instr % 100n, m1 = (instr / 100n) % 10n, m2 = (instr / 1000n) % 10n;
  if (op === 1n || op === 2n || op === 7n || op === 8n) {
    const a = oracleRead(mem, ip, 1, m1), b = oracleRead(mem, ip, 2, m2);
    mem[Number(mem[ip + 3]!)] = op === 1n ? a + b : op === 2n ? a * b : op === 7n ? (a < b ? 1n : 0n) : a === b ? 1n : 0n;
    return ip + 4;
  }
  if (op === 3n) {
    if (st.usedInput) throw new Error('Oracle out of input');
    st.usedInput = true;
    mem[Number(mem[ip + 1]!)] = st.systemId;
    return ip + 2;
  }
  if (op === 4n) { st.outputs.push(oracleRead(mem, ip, 1, m1)); return ip + 2; }
  if (op === 5n || op === 6n) return (op === 5n ? oracleRead(mem, ip, 1, m1) !== 0n : oracleRead(mem, ip, 1, m1) === 0n) ? Number(oracleRead(mem, ip, 2, m2)) : ip + 3;
  throw new Error(`Oracle unknown opcode ${op}`);
}

function oracleRunDiagnostic(raw: string, systemId: bigint) {
  const mem: bigint[] = [];
  for (const tok of raw.trim().split(',')) mem.push(BigInt(tok.trim()));
  const st = { usedInput: false, outputs: [] as bigint[], systemId };
  for (let ip = 0, steps = 0; mem[ip] !== 99n; steps += 1) {
    if (steps >= 5000 || ip < 0 || ip >= mem.length) throw new Error('Oracle guard triggered');
    ip = oracleStep(mem, ip, st);
  }
  return { diagnosticCode: st.outputs[st.outputs.length - 1]!, outputs: st.outputs };
}

function pickSeededBigInt(rng: SeededRng): bigint {
  const k = rng.nextInt(3);
  return k === 0 ? BigInt(rng.nextInt(41) - 20) : k === 1 ? (1n << 64n) + BigInt(rng.nextInt(10_000)) : -(1n << 63n) - BigInt(rng.nextInt(10_000));
}

function appendSeededOps(rng: SeededRng, cells: bigint[]) {
  const codeStarts: number[] = [], ph: { kind: string; base: number }[] = [];
  for (let i = 0, n = 6 + rng.nextInt(6); i < n; i += 1) {
    codeStarts.push(cells.length);
    const k = rng.nextInt(6), m1 = BigInt(rng.nextInt(2));
    ph.push({ kind: k < 4 ? 'bin' : 'jmp', base: cells.length });
    if (k < 4) cells.push(BigInt(rng.nextInt(2)) * 1000n + m1 * 100n + [1n, 2n, 7n, 8n][k]!, 0n, 0n, 0n);
    else cells.push(1000n + m1 * 100n + (k === 4 ? 5n : 6n), 0n, 0n);
  }
  return { codeStarts, ph };
}

function fillSeededPlaceholders(rng: SeededRng, cells: bigint[], phList: { kind: string; base: number }[], layout: { codeStarts: number[]; dataStart: number; dataSlots: number; finalOut: number; selfMod: number }): void {
  const { codeStarts, dataStart, dataSlots, finalOut, selfMod } = layout;
  for (const ph of phList) {
    const instr = cells[ph.base]!, m1 = (instr / 100n) % 10n, m2 = (instr / 1000n) % 10n;
    if (ph.kind === 'bin') {
      cells[ph.base + 1] = m1 === 1n ? BigInt(rng.nextInt(21) - 10) : BigInt(dataStart + rng.nextInt(dataSlots));
      cells[ph.base + 2] = m2 === 1n ? BigInt(rng.nextInt(21) - 10) : BigInt(dataStart + rng.nextInt(dataSlots));
      cells[ph.base + 3] = BigInt(dataStart + rng.nextInt(dataSlots));
      if (rng.nextInt(5) === 0) {
        cells[ph.base] = 1101n; cells[ph.base + 1] = BigInt(dataStart);
        cells[ph.base + 2] = BigInt(rng.nextInt(dataSlots)); cells[ph.base + 3] = BigInt(selfMod);
      }
    } else {
      cells[ph.base + 1] = m1 === 1n ? BigInt(rng.nextInt(3) - 1) : BigInt(dataStart + rng.nextInt(dataSlots));
      const later: number[] = [];
      for (const addr of codeStarts) if (addr > ph.base) later.push(addr);
      cells[ph.base + 2] = BigInt(later.length > 0 ? later[rng.nextInt(later.length)]! : finalOut);
    }
  }
}

function generateSeededDiagnosticProgram(rng: SeededRng): string {
  const dataSlots = 10, cells: bigint[] = [3n, 0n];
  const { codeStarts, ph } = appendSeededOps(rng, cells);
  for (let z = 1 + rng.nextInt(3); z > 0; z -= 1) cells.push(104n, 0n);
  const finalOut = cells.length, selfMod = finalOut + 1;
  cells.push(4n, 0n, 99n);
  const dataStart = cells.length;
  for (let d = 0; d < dataSlots; d += 1) cells.push(pickSeededBigInt(rng));
  cells[1] = BigInt(dataStart); cells[selfMod] = BigInt(dataStart + rng.nextInt(dataSlots));
  fillSeededPlaceholders(rng, cells, ph, { codeStarts, dataStart, dataSlots, finalOut, selfMod });
  return cells.join(',');
}

describe('2019 Day 5 Part 2 solver', () => {
  it('solves all 6 small official examples for input 5n and alternate branches', () => {
    const cases: [string, bigint, bigint, bigint][] = [
      ['3,9,8,9,10,9,4,9,99,-1,8', 0n, 8n, 1n], ['3,9,7,9,10,9,4,9,99,-1,8', 1n, 8n, 0n],
      ['3,3,1108,-1,8,3,4,3,99', 0n, 8n, 1n], ['3,3,1107,-1,8,3,4,3,99', 1n, 8n, 0n],
      ['3,12,6,12,15,1,13,14,13,4,13,99,-1,0,1,9', 1n, 0n, 0n], ['3,3,1105,-1,9,1101,0,0,12,4,12,99,1', 1n, 0n, 0n],
    ];
    for (const [raw, ans5, altId, altAns] of cases) {
      expect(executeSolver(solver, raw).answer).toBe(ans5);
      expect(runDiagnostic(solver.parse(raw), altId).diagnosticCode).toBe(altAns);
    }
  });

  it('solves the 47-cell large comparison example and validates full & bounded traces', () => {
    expect(executeSolver(solver, LARGE_EXAMPLE).answer).toBe(999n);
    const program = solver.parse(LARGE_EXAMPLE);
    expect(runDiagnostic(program, 8n).diagnosticCode).toBe(1000n);
    expect(runDiagnostic(program, 9n).diagnosticCode).toBe(1001n);
    const full = solver.trace(program);
    expect(full.length).toBe(8);
    expect(full[7]!.outputs).toEqual([999n]);
    const bounded = solver.trace(program, { maxSteps: 4 });
    expect(bounded.length).toBeLessThanOrEqual(4);
    expect(bounded[0]!.step.stepIndex).toBe(0);
    expect(bounded[bounded.length - 1]!.step.halted).toBe(true);
  });

  it('supports self-modification, lazy param-2 untaken jump, indirect m2=0 jumps, and >2^64 / <-2^63 BigInts', () => {
    expect(executeSolver(solver, '3,10,1,10,6,6,1100,1,11,99,0,105,0,99999,104,77,99').answer).toBe(77n);
    const indirectBigInt = '7,15,16,18,8,16,17,19,8,15,16,20,5,18,21,-9223372036854775809,18446744073709551617,18446744073709551617,0,0,0,22,6,20,26,99,27,4,20,4,19,99';
    expect(executeSolver(solver, indirectBigInt).answer).toBe(1n);
  });

  it('matches flat-loop differential oracle across 30 seeded programs (seed 20190502)', () => {
    const rng = new SeededRng(20190502);
    for (let t = 0; t < 30; t += 1) {
      const raw = generateSeededDiagnosticProgram(rng);
      const expected = oracleRunDiagnostic(raw, THERMAL_RADIATOR_SYSTEM_ID);
      const program = solver.parse(raw);
      expect(solver.solve(program)).toBe(expected.diagnosticCode);
      const frames = solver.trace(program);
      expect(frames[frames.length - 1]!.outputs).toEqual(expected.outputs);
    }
  });

  it('rejects malformed, silent, failing, input-starved, invalid-mode, OOB-jump, and runaway programs', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('3,bad,99')).toThrow(Error);
    for (const bad of ['99', '104,0,104,7,104,42,99', '3,5,3,5,4,5,99', '10007,1,2,0,99', '1105,1,999,99']) {
      expect(() => solver.solve(solver.parse(bad))).toThrow(Error);
    }
    expect(() => runDiagnostic(solver.parse('1105,1,0'), THERMAL_RADIATOR_SYSTEM_ID, 25)).toThrow(RangeError);
  });
});
