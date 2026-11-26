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

interface OracleRun {
  readonly terminated: boolean;
  readonly acc: bigint;
}

type RepairOracleResult =
  | { readonly valid: true; readonly acc: bigint; readonly patchedIndex: number }
  | { readonly valid: false };

function runRawLines(lines: readonly string[]): OracleRun {
  const seen = new Set<number>();
  let pc = 0;
  let acc = 0n;
  while (pc >= 0 && pc < lines.length) {
    if (seen.has(pc)) return { terminated: false, acc };
    seen.add(pc);
    const [op, rawArg] = lines[pc]!.split(' ');
    const arg = Number(rawArg);
    if (op === 'acc') acc += BigInt(arg);
    pc += op === 'jmp' ? arg : 1;
  }
  return { terminated: pc === lines.length, acc };
}

function bruteForceRepairOracle(raw: string): RepairOracleResult {
  const lines = raw.trim().split('\n');
  if (runRawLines(lines).terminated) return { valid: false };
  const matches: Array<{ readonly acc: bigint; readonly patchedIndex: number }> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const [op, rawArg] = lines[i]!.split(' ');
    if (op === 'acc') continue;
    const patched = [...lines];
    patched[i] = `${op === 'jmp' ? 'nop' : 'jmp'} ${rawArg}`;
    const run = runRawLines(patched);
    if (run.terminated) matches.push({ acc: run.acc, patchedIndex: i });
  }
  return matches.length === 1 ? { valid: true, ...matches[0]! } : { valid: false };
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
    const op = pick < 0.35 ? 'acc' : pick < 0.7 ? 'jmp' : 'nop';
    const offset = Math.floor(rand() * (length * 2 + 1)) - length;
    lines.push(`${op} ${offset >= 0 ? `+${offset}` : `${offset}`}`);
  }
  return lines.join('\n');
}

describe('2020 Day 8 Part 2 solver', () => {
  it('repairs the official example to 8n with a 7-frame trace', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(8n);

    const trace = solver.trace(parsed);
    expect(trace).toHaveLength(7);
    expect(trace[0]!.patchedIndex).toBe(7);
    expect(trace[0]!.originalPatchedInstruction?.formatted).toBe('jmp -4');
    expect(trace[0]!.patchedInstruction?.formatted).toBe('nop -4');
    expect(trace[4]!.isPatchedStep).toBe(true);
    expect(trace[6]!.phase).toBe('terminated');
    expect(trace[6]!.activePc).toBe(9);
    expect(trace[6]!.accumulator).toBe(8n);
  });

  it('repairs out-of-bounds jumps at pc 0 in both directions', () => {
    for (const raw of ['jmp -5\nacc +7', 'jmp +99\nacc +7']) {
      const parsed = solver.parse(raw);
      expect(solver.solve(parsed)).toBe(7n);
      expect(solver.trace(parsed, { maxSteps: 1 })[0]!.patchedIndex).toBe(0);
    }
  });

  it('repairs a 1-instruction jmp +0 program and skips nop +0 traps', () => {
    const oneLine = solver.parse('jmp +0');
    expect(solver.solve(oneLine)).toBe(0n);
    const oneTrace = solver.trace(oneLine);
    expect(oneTrace[0]!.patchedIndex).toBe(0);
    expect(oneTrace[0]!.patchedInstruction?.formatted).toBe('nop +0');

    const trap = solver.parse('nop +0\nacc +5\njmp -2');
    expect(solver.solve(trap)).toBe(5n);
    expect(solver.trace(trap, { maxSteps: 1 })[0]!.patchedIndex).toBe(2);
  });

  it('preserves BigInt precision above Number.MAX_SAFE_INTEGER', () => {
    const parsed = solver.parse('acc +9007199254740991\nacc +2\njmp +0');
    expect(solver.solve(parsed)).toBe(9007199254740993n);
  });

  it('supports bounded trace sampling at maxSteps 4 and 1', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const sampled = solver.trace(parsed, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect(sampled.some((frame) => frame.isPatchedStep)).toBe(true);
    expect(sampled[3]!.phase).toBe('terminated');
    expect(sampled[3]!.accumulator).toBe(8n);

    const terminalOnly = solver.trace(parsed, { maxSteps: 1 });
    expect(terminalOnly).toHaveLength(1);
    expect(terminalOnly[0]!.phase).toBe('terminated');
    expect(terminalOnly[0]!.activePc).toBe(9);
    expect(terminalOnly[0]!.accumulator).toBe(8n);
    expect(terminalOnly[0]!.visitedCount).toBe(6);
    expect(terminalOnly[0]!.patchedIndex).toBe(7);
  });

  it('rejects already-terminating, unrepairable, and ambiguous programs', () => {
    expect(() => solver.solve(solver.parse('acc +1\nacc +2'))).toThrow(/already terminates/i);
    expect(() => solver.solve(solver.parse('jmp +0\njmp +0'))).toThrow(/no single-instruction repair/i);
    expect(() => solver.solve(solver.parse('nop +3\nnop +2\njmp -2'))).toThrow(/multiple repair/i);
  });

  it('rejects malformed boot-code inputs during parse', () => {
    for (const bad of ['', 'foo +1', 'acc 5', 'acc +1\n\nacc +2']) {
      expect(() => solver.parse(bad)).toThrow();
    }
  });

  it('matches an O(N^2) brute-force oracle across 40 seeded PRNG programs', () => {
    const rand = makeSeededPrng(20200802);
    let validCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < 40; i += 1) {
      const raw = generateRawProgram(rand, 4 + (i % 10));
      const oracle = bruteForceRepairOracle(raw);
      const parsed = solver.parse(raw);
      if (oracle.valid) {
        validCount += 1;
        expect(solver.solve(parsed)).toBe(oracle.acc);
        expect(solver.trace(parsed, { maxSteps: 1 })[0]!.patchedIndex).toBe(oracle.patchedIndex);
      } else {
        rejectedCount += 1;
        expect(() => solver.solve(parsed)).toThrow();
      }
    }

    expect(validCount).toBeGreaterThan(0);
    expect(rejectedCount).toBeGreaterThan(0);
  });
});
