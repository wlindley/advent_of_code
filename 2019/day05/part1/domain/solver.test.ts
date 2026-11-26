import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

class SeededRng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  nextInt(bound: number): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state % bound;
  }
}

function oracleRead(mem: readonly bigint[], ip: number, offset: number, mode: bigint): bigint {
  const param = mem[ip + offset]!;
  return mode === 1n ? param : mem[Number(param)]!;
}

function oracleRunDiagnostic(raw: string, systemId: bigint) {
  const mem = raw.trim().split(',').map((token) => BigInt(token.trim()));
  let ip = 0;
  let usedInput = false;
  const outputs: bigint[] = [];
  let steps = 0;

  while (mem[ip] !== 99n) {
    if (steps >= 5000 || ip < 0 || ip >= mem.length) throw new Error('Oracle guard triggered');
    steps += 1;
    const rawInstr = mem[ip]!;
    const op = rawInstr % 100n;
    const m1 = (rawInstr / 100n) % 10n;
    const m2 = (rawInstr / 1000n) % 10n;
    if (op === 1n || op === 2n || op === 7n || op === 8n) {
      const a = oracleRead(mem, ip, 1, m1);
      const b = oracleRead(mem, ip, 2, m2);
      const dest = Number(mem[ip + 3]!);
      mem[dest] = op === 1n ? a + b : op === 2n ? a * b : op === 7n ? (a < b ? 1n : 0n) : a === b ? 1n : 0n;
      ip += 4;
    } else if (op === 3n) {
      if (usedInput) throw new Error('Oracle out of input');
      usedInput = true;
      mem[Number(mem[ip + 1]!)] = systemId;
      ip += 2;
    } else if (op === 4n) {
      outputs.push(oracleRead(mem, ip, 1, m1));
      ip += 2;
    } else if (op === 5n || op === 6n) {
      const cond = oracleRead(mem, ip, 1, m1);
      ip = (op === 5n ? cond !== 0n : cond === 0n) ? Number(oracleRead(mem, ip, 2, m2)) : ip + 3;
    } else {
      throw new Error(`Oracle unknown opcode ${op}`);
    }
  }
  return { diagnosticCode: outputs[outputs.length - 1]!, outputs };
}

function pickSeededBigInt(rng: SeededRng): bigint {
  const kind = rng.nextInt(3);
  if (kind === 0) return BigInt(rng.nextInt(41) - 20);
  if (kind === 1) return (1n << 64n) + BigInt(rng.nextInt(10_000));
  return -(1n << 63n) - BigInt(rng.nextInt(10_000));
}

function generateSeededDiagnosticProgram(rng: SeededRng): string {
  const dataSlots = 10;
  const cells: bigint[] = [3n, 0n];
  const codeStartAddrs: number[] = [];
  const placeholders: { kind: string; base: number }[] = [];
  const instrCount = 6 + rng.nextInt(6);

  for (let i = 0; i < instrCount; i += 1) {
    codeStartAddrs.push(cells.length);
    const kind = rng.nextInt(5);
    const m1 = BigInt(rng.nextInt(2));
    if (kind < 4) {
      const op = [1n, 2n, 7n, 8n][kind]!;
      const m2 = BigInt(rng.nextInt(2));
      placeholders.push({ kind: 'bin', base: cells.length });
      cells.push(m2 * 1000n + m1 * 100n + op, 0n, 0n, 0n);
    } else {
      const op = rng.nextInt(2) === 0 ? 5n : 6n;
      placeholders.push({ kind: 'jmp', base: cells.length });
      cells.push(1000n + m1 * 100n + op, 0n, 0n);
    }
  }

  const zeroCount = 1 + rng.nextInt(3);
  for (let z = 0; z < zeroCount; z += 1) cells.push(104n, 0n);
  const finalOutAddr = cells.length;
  cells.push(4n, 0n, 99n);
  const selfModTarget = finalOutAddr + 1;
  const dataStart = cells.length;
  for (let d = 0; d < dataSlots; d += 1) cells.push(pickSeededBigInt(rng));

  cells[1] = BigInt(dataStart);
  cells[selfModTarget] = BigInt(dataStart + rng.nextInt(dataSlots));
  for (const ph of placeholders) {
    const instr = cells[ph.base]!;
    const m1 = (instr / 100n) % 10n;
    if (ph.kind === 'bin') {
      const m2 = (instr / 1000n) % 10n;
      cells[ph.base + 1] = m1 === 1n ? BigInt(rng.nextInt(21) - 10) : BigInt(dataStart + rng.nextInt(dataSlots));
      cells[ph.base + 2] = m2 === 1n ? BigInt(rng.nextInt(21) - 10) : BigInt(dataStart + rng.nextInt(dataSlots));
      if (rng.nextInt(5) === 0) {
        cells[ph.base] = 1101n;
        cells[ph.base + 1] = BigInt(dataStart);
        cells[ph.base + 2] = BigInt(rng.nextInt(dataSlots));
        cells[ph.base + 3] = BigInt(selfModTarget);
      } else {
        cells[ph.base + 3] = BigInt(dataStart + rng.nextInt(dataSlots));
      }
    } else {
      cells[ph.base + 1] = m1 === 1n ? BigInt(rng.nextInt(3) - 1) : BigInt(dataStart + rng.nextInt(dataSlots));
      const laterTargets = codeStartAddrs.filter((a) => a > ph.base);
      cells[ph.base + 2] = BigInt(laterTargets.length > 0 ? laterTargets[rng.nextInt(laterTargets.length)]! : finalOutAddr);
    }
  }
  return cells.map((v) => v.toString()).join(',');
}

describe('2019 Day 5 Part 1 solver', () => {
  it('solves the official Day 5 Part 1 example and mode/negative fixtures via executeSolver', () => {
    expect(executeSolver(solver, '3,0,4,0,99').answer).toBe(1n);
    expect(executeSolver(solver, '3,15,1002,15,3,15,1101,-3,3,16,4,16,4,15,99,0,0').answer).toBe(3n);
    expect(executeSolver(solver, '3,15,1101,0,0,16,4,16,1101,10,-50,16,4,16,99,0,0').answer).toBe(-40n);
  });

  it('matches independent flat-loop oracle across 40 seeded programs with modes 0/1, opcodes 1..8, BigInts, and self-modification', () => {
    const rng = new SeededRng(20190501);
    for (let trial = 0; trial < 40; trial += 1) {
      const raw = generateSeededDiagnosticProgram(rng);
      const expected = oracleRunDiagnostic(raw, 1n);
      const program = solver.parse(raw);
      expect(solver.solve(program)).toBe(expected.diagnosticCode);
      const frames = solver.trace(program);
      expect(frames[frames.length - 1]!.outputs).toEqual(expected.outputs);
    }
  });

  it('rejects invalid input, silent programs, and failing non-zero diagnostic prefixes', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('3,bad,99')).toThrow(Error);
    expect(() => solver.solve(solver.parse('99'))).toThrow(Error);
    expect(() => solver.solve(solver.parse('104,0,104,9,104,42,99'))).toThrow(Error);
  });
});
