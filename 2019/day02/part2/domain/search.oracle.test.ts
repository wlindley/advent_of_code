import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../../shared/intcode';
import { findGravityAssistMatch } from './search';

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

function parseCellsFlat(raw: string): bigint[] {
  const parts = raw.trim().split(',');
  const cells: bigint[] = [];
  for (const token of parts) {
    cells.push(BigInt(token.trim()));
  }
  return cells;
}

function oracleExecute(baseCells: readonly bigint[], noun: bigint, verb: bigint): bigint {
  const mem = [...baseCells];
  mem[1] = noun;
  mem[2] = verb;
  let ip = 0;
  while (mem[ip] !== 99n) {
    if (ip >= mem.length) throw new Error('Oracle ran past tape');
    const op = mem[ip]!;
    const lhs = mem[Number(mem[ip + 1]!)]!;
    const rhs = mem[Number(mem[ip + 2]!)]!;
    const dest = Number(mem[ip + 3]!);
    mem[dest] = op === 1n ? lhs + rhs : lhs * rhs;
    ip += 4;
  }
  return mem[0]!;
}

function oracleFindMatch(raw: string, target: bigint, maxInput: bigint): bigint {
  const baseCells = parseCellsFlat(raw);
  for (let noun = 0n; noun <= maxInput; noun += 1n) {
    for (let verb = 0n; verb <= maxInput; verb += 1n) {
      if (oracleExecute(baseCells, noun, verb) === target) {
        return 100n * noun + verb;
      }
    }
  }
  throw new Error('Oracle found no match');
}

function pickSeededOperand(rng: SeededRng, totalLen: number, instrCount: number): bigint {
  const r = rng.nextInt(5);
  if (r === 0) return 1n;
  if (r === 1) return 2n;
  const dataStart = instrCount * 4 + 1;
  return BigInt(dataStart + rng.nextInt(totalLen - dataStart));
}

function buildSeededProgram(rng: SeededRng): string {
  const numInstr = 3 + rng.nextInt(5);
  const dataStart = numInstr * 4 + 1;
  const totalLen = dataStart + 4 + rng.nextInt(4);
  const cells = new Array<bigint>(totalLen).fill(0n);
  for (let i = dataStart; i < totalLen; i += 1) {
    cells[i] = BigInt(rng.nextInt(41) - 20);
  }
  cells[numInstr * 4] = 99n;
  for (let k = 0; k < numInstr; k += 1) {
    cells[k * 4] = rng.nextInt(2) === 0 ? 1n : 2n;
    cells[k * 4 + 1] = pickSeededOperand(rng, totalLen, numInstr);
    cells[k * 4 + 2] = pickSeededOperand(rng, totalLen, numInstr);
    cells[k * 4 + 3] = k === numInstr - 1 ? 0n : BigInt(dataStart + rng.nextInt(totalLen - dataStart));
  }
  const tokens: string[] = [];
  for (const cell of cells) tokens.push(cell.toString());
  return tokens.join(',');
}

describe('2019 Day 2 Part 2 search oracle', () => {
  it('matches an independent flat-loop brute-force oracle across 30 seeded programs', () => {
    const rng = new SeededRng(20190202);
    const maxInput = 8n;
    for (let trial = 0; trial < 30; trial += 1) {
      const raw = buildSeededProgram(rng);
      const baseCells = parseCellsFlat(raw);
      const pickNoun = BigInt(rng.nextInt(Number(maxInput) + 1));
      const pickVerb = BigInt(rng.nextInt(Number(maxInput) + 1));
      const target = oracleExecute(baseCells, pickNoun, pickVerb);
      const expectedCode = oracleFindMatch(raw, target, maxInput);
      const match = findGravityAssistMatch(parseIntcodeProgram(raw), { target, maxInput });
      expect(match.answerCode).toBe(expectedCode);
      expect(oracleExecute(baseCells, match.inputs.noun, match.inputs.verb)).toBe(target);
    }
  });
});
