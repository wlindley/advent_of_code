import { describe, expect, it } from 'vitest';
import { ChronospatialProgram, VmRegisters, type ThreeBitValue } from './types';
import { formatOutput, runProgram } from './vm';

interface OracleResult {
  readonly a: bigint;
  readonly b: bigint;
  readonly c: bigint;
  readonly ip: number;
  readonly steps: number;
  readonly output: readonly ThreeBitValue[];
}

// Independent textbook switch-based Day 17 VM oracle using integer division & Euclidean mod 8.
function runTextbookOracle(program: ChronospatialProgram, maxSteps = 500): OracleResult {
  const code = program.instructions;
  let a = program.initialRegisters.a;
  let b = program.initialRegisters.b;
  let c = program.initialRegisters.c;
  let ip = 0;
  let steps = 0;
  const output: ThreeBitValue[] = [];

  const combo = (op: ThreeBitValue): bigint => {
    switch (op) {
      case 0:
      case 1:
      case 2:
      case 3:
        return BigInt(op);
      case 4:
        return a;
      case 5:
        return b;
      case 6:
        return c;
      default:
        throw new RangeError('Reserved combo operand 7');
    }
  };

  while (ip + 1 < code.length) {
    if (steps >= maxSteps) throw new RangeError('Oracle max steps exceeded');
    const opcode = code[ip]!;
    const operand = code[ip + 1]!;
    switch (opcode) {
      case 0:
        a = a / (1n << combo(operand));
        ip += 2;
        break;
      case 1:
        b = b ^ BigInt(operand);
        ip += 2;
        break;
      case 2:
        b = ((combo(operand) % 8n) + 8n) % 8n;
        ip += 2;
        break;
      case 3:
        ip = a === 0n ? ip + 2 : operand;
        break;
      case 4:
        b = b ^ c;
        ip += 2;
        break;
      case 5:
        output.push(Number(((combo(operand) % 8n) + 8n) % 8n) as ThreeBitValue);
        ip += 2;
        break;
      case 6:
        b = a / (1n << combo(operand));
        ip += 2;
        break;
      case 7:
        c = a / (1n << combo(operand));
        ip += 2;
        break;
    }
    steps += 1;
  }

  return { a, b, c, ip, steps, output };
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state;
  };
}

describe('VM differential oracle tests', () => {
  it('matches all 5 official short examples and the main Day 17 example', () => {
    const ex1 = new ChronospatialProgram(new VmRegisters(0n, 0n, 9n), [2, 6]);
    expect(runProgram(ex1).finalRegisters.b).toBe(1n);
    expect(runTextbookOracle(ex1).b).toBe(1n);

    const ex2 = new ChronospatialProgram(new VmRegisters(10n, 0n, 0n), [5, 0, 5, 1, 5, 4]);
    expect(formatOutput(runProgram(ex2).output)).toBe('0,1,2');
    expect(runProgram(ex2).output).toEqual(runTextbookOracle(ex2).output);

    const ex3 = new ChronospatialProgram(new VmRegisters(2024n, 0n, 0n), [0, 1, 5, 4, 3, 0]);
    const r3 = runProgram(ex3);
    expect(formatOutput(r3.output)).toBe('4,2,5,6,7,7,7,7,3,1,0');
    expect(r3.finalRegisters.a).toBe(0n);
    expect(r3.output).toEqual(runTextbookOracle(ex3).output);

    const ex4 = new ChronospatialProgram(new VmRegisters(0n, 29n, 0n), [1, 7]);
    expect(runProgram(ex4).finalRegisters.b).toBe(26n);
    expect(runTextbookOracle(ex4).b).toBe(26n);

    const ex5 = new ChronospatialProgram(new VmRegisters(0n, 2024n, 43690n), [4, 0]);
    expect(runProgram(ex5).finalRegisters.b).toBe(44354n);
    expect(runTextbookOracle(ex5).b).toBe(44354n);

    const main = new ChronospatialProgram(new VmRegisters(729n, 0n, 0n), [0, 1, 5, 4, 3, 0]);
    const rm = runProgram(main);
    expect(formatOutput(rm.output)).toBe('4,6,3,5,6,3,5,2,1,0');
    expect(rm.output).toEqual(runTextbookOracle(main).output);
  });

  it('matches oracle on 64-bit BigInt registers and odd-IP jnz jumps', () => {
    const bigA = (1n << 62n) + 987654321012345n;
    const bigProgram = new ChronospatialProgram(
      new VmRegisters(bigA, 1234567890123456789n, 9876543210987654321n),
      [4, 0, 5, 5, 0, 3, 6, 2, 7, 1, 5, 4, 3, 4],
    );
    const actualBig = runProgram(bigProgram, { maxSteps: 500 });
    const expectedBig = runTextbookOracle(bigProgram, 500);
    expect(actualBig.finalRegisters).toEqual(
      new VmRegisters(expectedBig.a, expectedBig.b, expectedBig.c),
    );
    expect(actualBig.output).toEqual(expectedBig.output);
    expect(actualBig.stepsExecuted).toBe(expectedBig.steps);

    // Odd-IP jnz jumps to index 3, executing (0, 3) -> adv 3, (5, 4) -> out A, (3, 3) -> jnz 3
    const oddIpProgram = new ChronospatialProgram(
      new VmRegisters(127n, 0n, 0n),
      [3, 3, 0, 0, 3, 5, 4, 3, 3],
    );
    const actualOdd = runProgram(oddIpProgram, { maxSteps: 500 });
    const expectedOdd = runTextbookOracle(oddIpProgram, 500);
    expect(actualOdd.output).toEqual(expectedOdd.output);
    expect(actualOdd.finalIp).toBe(expectedOdd.ip);
  });

  it('matches oracle across 100 seeded deterministic synthetic programs', () => {
    const nextRand = createRng(20241217);
    for (let i = 0; i < 100; i += 1) {
      const len = 2 + (nextRand() % 11);
      const instructions: ThreeBitValue[] = [];
      for (let k = 0; k < len; k += 1) {
        instructions.push((nextRand() % 8) as ThreeBitValue);
      }
      const regs = new VmRegisters(
        BigInt(nextRand() % 500),
        BigInt(nextRand() % 64),
        BigInt(nextRand() % 64),
      );
      const program = new ChronospatialProgram(regs, instructions);

      let actualError: unknown = null;
      let oracleError: unknown = null;
      let actualResult;
      let oracleResult;

      try {
        actualResult = runProgram(program, { maxSteps: 300 });
      } catch (err) {
        actualError = err;
      }

      try {
        oracleResult = runTextbookOracle(program, 300);
      } catch (err) {
        oracleError = err;
      }

      expect(actualError === null).toBe(oracleError === null);
      if (actualResult && oracleResult) {
        expect(actualResult.finalRegisters).toEqual(
          new VmRegisters(oracleResult.a, oracleResult.b, oracleResult.c),
        );
        expect(actualResult.finalIp).toBe(oracleResult.ip);
        expect(actualResult.stepsExecuted).toBe(oracleResult.steps);
        expect(actualResult.output).toEqual(oracleResult.output);
      }
    }
  });
});
