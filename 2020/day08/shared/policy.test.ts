import { describe, expect, it } from 'vitest';
import { executeBootProgram } from './execution';
import {
  BootDiagnosis,
  LOOP_ACCUMULATOR_POLICY,
  REPAIR_BOOT_POLICY,
} from './policy';
import { parseBootProgram, type BootProgram } from './program';

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

function bruteForceRepair(
  program: BootProgram,
): { readonly ok: true; readonly answer: bigint; readonly patchedIndex: number } | { readonly ok: false } {
  if (executeBootProgram(program).status === 'terminated') {
    return { ok: false };
  }
  const matches: number[] = [];
  for (let i = 0; i < program.length; i += 1) {
    if (!program.at(i).isToggleable) continue;
    const candidate = executeBootProgram(program.withToggledAt(i));
    if (candidate.status === 'terminated') {
      matches.push(i);
    }
  }
  if (matches.length !== 1) {
    return { ok: false };
  }
  const patchedIndex = matches[0]!;
  return {
    ok: true,
    patchedIndex,
    answer: executeBootProgram(program.withToggledAt(patchedIndex)).finalAccumulator,
  };
}

function makeSeededPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function generateProgram(rand: () => number, length: number): BootProgram {
  const lines: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const pick = rand();
    const opcode = pick < 0.35 ? 'acc' : pick < 0.7 ? 'jmp' : 'nop';
    const offset = Math.floor(rand() * (length * 2 + 3)) - length - 1;
    const signed = offset >= 0 ? `+${offset}` : `${offset}`;
    lines.push(`${opcode} ${signed}`);
  }
  return parseBootProgram(lines.join('\n'));
}

describe('policy', () => {
  it('validates BootDiagnosis invariants and involution getters', () => {
    const program = parseBootProgram(EXAMPLE_INPUT);
    const run = executeBootProgram(program);
    const unpatched = new BootDiagnosis('loop-accumulator', program, run, null);

    expect(Object.isFrozen(unpatched)).toBe(true);
    expect(unpatched.answer).toBe(5n);
    expect(unpatched.patchedInstruction).toBeNull();
    expect(unpatched.originalPatchedInstruction).toBeNull();

    expect(() => new BootDiagnosis('repair-boot', program, run, 1)).toThrow(/not toggleable/i);
    expect(() => new BootDiagnosis('repair-boot', program, run, 99)).toThrow(RangeError);
  });

  it('LOOP_ACCUMULATOR_POLICY solves the official example and rejects non-looping runs', () => {
    const diagnosis = LOOP_ACCUMULATOR_POLICY.diagnose(parseBootProgram(EXAMPLE_INPUT));
    expect(diagnosis.answer).toBe(5n);
    expect(diagnosis.patchedIndex).toBeNull();

    expect(() => LOOP_ACCUMULATOR_POLICY.diagnose(parseBootProgram('acc +1\nacc +2'))).toThrow(
      /loop-detected/i,
    );
    expect(() => LOOP_ACCUMULATOR_POLICY.diagnose(parseBootProgram('jmp -2'))).toThrow(
      /loop-detected/i,
    );
  });

  it('REPAIR_BOOT_POLICY repairs looping and OOB-initial programs and rejects invalid repair sets', () => {
    const diagnosis = REPAIR_BOOT_POLICY.diagnose(parseBootProgram(EXAMPLE_INPUT));
    expect(diagnosis.answer).toBe(8n);
    expect(diagnosis.patchedIndex).toBe(7);
    expect(diagnosis.patchedInstruction!.formatted).toBe('nop -4');
    expect(diagnosis.originalPatchedInstruction!.formatted).toBe('jmp -4');

    const oobRepair = REPAIR_BOOT_POLICY.diagnose(parseBootProgram('acc +4\njmp +5\nacc +2'));
    expect(oobRepair.answer).toBe(6n);
    expect(oobRepair.patchedIndex).toBe(1);

    const negAltTarget = REPAIR_BOOT_POLICY.diagnose(parseBootProgram('nop -5\njmp +0'));
    expect(negAltTarget.patchedIndex).toBe(1);

    expect(() => REPAIR_BOOT_POLICY.diagnose(parseBootProgram('acc +1'))).toThrow(/already terminates/i);
    expect(() => REPAIR_BOOT_POLICY.diagnose(parseBootProgram('jmp +0\njmp +0'))).toThrow(
      /no single-instruction repair/i,
    );
    expect(() => REPAIR_BOOT_POLICY.diagnose(parseBootProgram('nop +3\nnop +2\njmp -2'))).toThrow(
      /multiple/i,
    );
  });

  it('matches an O(N^2) brute-force oracle across 50 seeded PRNG programs', () => {
    const rand = makeSeededPrng(20201208);
    let validCount = 0;
    let rejectedCount = 0;

    for (let i = 0; i < 50; i += 1) {
      const program = generateProgram(rand, 6 + (i % 15));
      const oracle = bruteForceRepair(program);
      if (oracle.ok) {
        validCount += 1;
        const diagnosis = REPAIR_BOOT_POLICY.diagnose(program);
        expect(diagnosis.answer).toBe(oracle.answer);
        expect(diagnosis.patchedIndex).toBe(oracle.patchedIndex);
      } else {
        rejectedCount += 1;
        expect(() => REPAIR_BOOT_POLICY.diagnose(program)).toThrow();
      }
    }

    expect(validCount).toBeGreaterThan(0);
    expect(rejectedCount).toBeGreaterThan(0);
  });
});
