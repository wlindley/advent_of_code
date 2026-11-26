import { describe, expect, it } from 'vitest';
import { IntcodeMachine } from './machine';
import { CORE_OPCODES, createOpcodeRegistry } from './opcodes';
import { parseIntcodeProgram } from './program';

const REGISTRY = createOpcodeRegistry(CORE_OPCODES);

function runTape(raw: string, maxSteps: number): IntcodeMachine {
  const machine = IntcodeMachine.fromProgram(parseIntcodeProgram(raw), REGISTRY);
  machine.run(maxSteps);
  return machine;
}

describe('IntcodeMachine', () => {
  it('executes all five official AoC Day 2 example tapes accurately', () => {
    const ex1 = runTape('1,9,10,3,2,3,11,0,99,30,40,50', 20);
    expect(ex1.readMemory(0n)).toBe(3500n);
    expect(ex1.stepCount).toBe(3);
    expect(ex1.ip).toBe(8n);
    expect(ex1.status).toBe('halted');

    expect(runTape('1,0,0,0,99', 10).snapshotMemory()).toEqual([2n, 0n, 0n, 0n, 99n]);
    expect(runTape('2,3,0,3,99', 10).snapshotMemory()).toEqual([2n, 3n, 0n, 6n, 99n]);
    expect(runTape('2,4,4,5,99,0', 10).snapshotMemory()).toEqual([2n, 4n, 4n, 5n, 99n, 9801n]);
    expect(runTape('1,1,1,4,99,5,6,0,99', 10).snapshotMemory()).toEqual([
      30n, 1n, 1n, 4n, 2n, 5n, 6n, 0n, 99n,
    ]);
  });

  it('records step metadata with exact reads, previousValue, and halted transitions', () => {
    const machine = IntcodeMachine.fromProgram(parseIntcodeProgram('1,1,1,4,99,5,6,0,99'), REGISTRY);
    const step0 = machine.step();
    expect(step0).toEqual({
      stepIndex: 0,
      ipBefore: 0n,
      ipAfter: 4n,
      opcode: 1n,
      mnemonic: 'ADD',
      reads: [{ address: 1n, value: 1n }, { address: 1n, value: 1n }],
      write: { address: 4n, previousValue: 99n, value: 2n },
      halted: false,
    });
    const step1 = machine.step();
    expect(step1.opcode).toBe(2n);
    expect(step1.write).toEqual({ address: 0n, previousValue: 1n, value: 30n });
    const step2 = machine.step();
    expect(step2).toEqual({
      stepIndex: 2,
      ipBefore: 8n,
      ipAfter: 8n,
      opcode: 99n,
      mnemonic: 'HALT',
      reads: [],
      write: null,
      halted: true,
    });
  });

  it('handles immediate halt, negative operands, and > 2^53 BigInt arithmetic', () => {
    const haltOnly = IntcodeMachine.fromProgram(parseIntcodeProgram('99'), REGISTRY);
    const step = haltOnly.step();
    expect(step.halted).toBe(true);
    expect(haltOnly.ip).toBe(0n);
    expect(haltOnly.stepCount).toBe(1);

    const big = runTape('2,5,6,7,99,9007199254740993,-3,0', 10);
    expect(big.readMemory(7n)).toBe(-27021597764222979n);
  });

  it('rejects unknown opcodes, stepping after halt, and out-of-bounds pointers', () => {
    const badOp = IntcodeMachine.fromProgram(parseIntcodeProgram('77,0,0,0,99'), REGISTRY);
    expect(() => badOp.step()).toThrow(Error);

    const halted = runTape('99', 5);
    expect(() => halted.step()).toThrow(Error);

    const oobRead = IntcodeMachine.fromProgram(parseIntcodeProgram('1,99,0,0,99'), REGISTRY);
    expect(() => oobRead.step()).toThrow(RangeError);

    const oobWrite = IntcodeMachine.fromProgram(parseIntcodeProgram('1,0,0,99,99'), REGISTRY);
    expect(() => oobWrite.step()).toThrow(RangeError);

    const oobIp = IntcodeMachine.fromProgram(parseIntcodeProgram('1,0,0,0'), REGISTRY);
    oobIp.step();
    expect(() => oobIp.step()).toThrow(RangeError);
  });

  it('enforces maxSteps, rejects invalid limits, and is idempotent once halted', () => {
    const machine = IntcodeMachine.fromProgram(parseIntcodeProgram('1,0,0,0,1,0,0,0,99'), REGISTRY);
    expect(() => machine.run(0)).toThrow(RangeError);
    expect(() => machine.run(1.5)).toThrow(RangeError);
    expect(() => machine.run(2)).toThrow(RangeError);
    expect(machine.status).toBe('running');
    expect(machine.run(5)).toBe(3);
    expect(machine.status).toBe('halted');
    expect(machine.run(5)).toBe(3);
  });
});
