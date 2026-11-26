import { describe, expect, it } from 'vitest';
import {
  ChronospatialProgram,
  parseChronospatialInput,
  runProgram,
  VmRegisters,
  type ThreeBitValue,
} from '../../shared';
import { searchLowestQuine } from './quineSearch';

const PART2_EXAMPLE = [
  'Register A: 2024',
  'Register B: 0',
  'Register C: 0',
  '',
  'Program: 0,3,5,4,3,0',
].join('\n');

function matchesSuffix(output: readonly ThreeBitValue[], target: readonly ThreeBitValue[], pos: number): boolean {
  if (output.length !== target.length - pos) return false;
  return output.every((val, idx) => val === target[pos + idx]);
}

/** Independent non-recursive backward-octal-BFS oracle collecting ALL valid quines. */
function findAllQuinesViaBfs(program: ChronospatialProgram): bigint[] {
  let prefixes: bigint[] = [0n];
  for (let pos = program.instructions.length - 1; pos >= 0; pos -= 1) {
    const next: bigint[] = [];
    for (const prefix of prefixes) {
      const start = prefix === 0n ? 1 : 0;
      for (let d = start; d <= 7; d += 1) {
        const candidate = (prefix << 3n) | BigInt(d);
        const { output } = runProgram(program.withRegisterA(candidate));
        if (matchesSuffix(output, program.instructions, pos)) next.push(candidate);
      }
    }
    prefixes = next;
  }
  return prefixes;
}

describe('quineSearch minimality and all-quines BFS oracle', () => {
  it('proves by brute force that no 1 <= a < 117440 is a quine for 0,3,5,4,3,0', () => {
    const program = parseChronospatialInput(PART2_EXAMPLE);
    const target = program.instructions;
    for (let a = 1n; a < 117440n; a += 1n) {
      const { output } = runProgram(program.withRegisterA(a));
      const isQuine = output.length === target.length && output.every((v, i) => v === target[i]);
      expect(isQuine).toBe(false);
    }
  });

  it('matches min(allQuines) from backward-octal-BFS on 0,3,5,4,3,0 (8 quines 117440n..117447n)', () => {
    const program = parseChronospatialInput(PART2_EXAMPLE);
    const allQuines = findAllQuinesViaBfs(program);
    expect(allQuines).toEqual([117440n, 117441n, 117442n, 117443n, 117444n, 117445n, 117446n, 117447n]);
    expect(searchLowestQuine(program).registerA).toBe(allQuines[0]);
  });

  it('matches min(allQuines) across multi-branching synthetic bst/bxl/cdv/bxc/adv3/out/jnz0 programs', () => {
    const tokensList: ThreeBitValue[][] = [
      [2, 4, 1, 0, 7, 5, 1, 4, 4, 5, 5, 5, 0, 3, 3, 0],
      [2, 4, 1, 1, 7, 5, 1, 5, 4, 5, 5, 5, 0, 3, 3, 0],
      [2, 4, 1, 3, 7, 5, 1, 5, 4, 5, 5, 5, 0, 3, 3, 0],
    ];
    for (const tokens of tokensList) {
      const program = new ChronospatialProgram(new VmRegisters(0n, 0n, 0n), tokens);
      const allQuines = findAllQuinesViaBfs(program);
      expect(allQuines.length).toBeGreaterThan(0);
      const minQuine = allQuines.reduce((min, val) => (val < min ? val : min));
      const result = searchLowestQuine(program);
      expect(result.registerA).toBe(minQuine);
      expect(runProgram(program.withRegisterA(result.registerA)).output).toEqual(tokens);
    }
  });
});
