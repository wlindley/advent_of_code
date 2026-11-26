import { describe, expect, it } from 'vitest';
import { BufferedIoChannel } from './io';
import { IntcodeMachine } from './machine';
import { CORE_MODES, createModeRegistry } from './modes';
import { STANDARD_OPCODES, createOpcodeRegistry } from './opcodes';
import { parseIntcodeProgram } from './program';

const STD_REGISTRY = createOpcodeRegistry(STANDARD_OPCODES);

function runWithInput(raw: string, inputs: readonly bigint[]): readonly bigint[] {
  const io = new BufferedIoChannel(inputs);
  const machine = IntcodeMachine.fromProgram(parseIntcodeProgram(raw), STD_REGISTRY, { io });
  machine.run(200);
  expect(machine.status).toBe('halted');
  return machine.snapshotOutputs();
}

describe('IntcodeMachine parameter modes, I/O, jumps, and comparisons', () => {
  it('executes immediate mode arithmetic and Day 5 Part 1 official examples', () => {
    const m1 = IntcodeMachine.fromProgram(parseIntcodeProgram('1002,4,3,4,33'), STD_REGISTRY);
    const s0 = m1.step();
    expect(s0.reads).toEqual([
      { address: 4n, rawParam: 4n, value: 33n, mode: 'position' },
      { address: 2n, rawParam: 3n, value: 3n, mode: 'immediate' },
    ]);
    expect(s0.write).toEqual({ address: 4n, previousValue: 33n, value: 99n });
    m1.run(5);
    expect(m1.readMemory(4n)).toBe(99n);

    const m2 = IntcodeMachine.fromProgram(parseIntcodeProgram('1101,100,-1,4,0'), STD_REGISTRY);
    m2.run(5);
    expect(m2.readMemory(4n)).toBe(99n);
    expect(runWithInput('3,0,4,0,99', [77n])).toEqual([77n]);
  });

  it('executes all Day 5 Part 2 comparison and jump examples accurately', () => {
    expect(runWithInput('3,9,8,9,10,9,4,9,99,-1,8', [8n])).toEqual([1n]);
    expect(runWithInput('3,9,8,9,10,9,4,9,99,-1,8', [7n])).toEqual([0n]);
    expect(runWithInput('3,9,7,9,10,9,4,9,99,-1,8', [7n])).toEqual([1n]);
    expect(runWithInput('3,9,7,9,10,9,4,9,99,-1,8', [8n])).toEqual([0n]);
    expect(runWithInput('3,3,1108,-1,8,3,4,3,99', [8n])).toEqual([1n]);
    expect(runWithInput('3,3,1108,-1,8,3,4,3,99', [9n])).toEqual([0n]);
    expect(runWithInput('3,3,1107,-1,8,3,4,3,99', [7n])).toEqual([1n]);
    expect(runWithInput('3,3,1107,-1,8,3,4,3,99', [8n])).toEqual([0n]);

    const jumpPos = '3,12,6,12,15,1,13,14,13,4,13,99,-1,0,1,9';
    expect(runWithInput(jumpPos, [0n])).toEqual([0n]);
    expect(runWithInput(jumpPos, [-4n])).toEqual([1n]);

    const jumpImm = '3,3,1105,-1,9,1101,0,0,12,4,12,99,1';
    expect(runWithInput(jumpImm, [0n])).toEqual([0n]);
    expect(runWithInput(jumpImm, [5n])).toEqual([1n]);

    const larger =
      '3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,' +
      '1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,' +
      '999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99';
    expect(runWithInput(larger, [7n])).toEqual([999n]);
    expect(runWithInput(larger, [8n])).toEqual([1000n]);
    expect(runWithInput(larger, [9n])).toEqual([1001n]);
  });

  it('evaluates jump target lazily and rejects invalid immediate/unknown modes', () => {
    const jnzUntaken = IntcodeMachine.fromProgram(parseIntcodeProgram('105,0,99999,99'), STD_REGISTRY);
    expect(jnzUntaken.run(5)).toBe(2);
    expect(jnzUntaken.status).toBe('halted');

    const jzUntaken = IntcodeMachine.fromProgram(parseIntcodeProgram('106,1,99999,99'), STD_REGISTRY);
    expect(jzUntaken.run(5)).toBe(2);
    expect(jzUntaken.status).toBe('halted');

    expect(() => IntcodeMachine.fromProgram(parseIntcodeProgram('105,1,99999,99'), STD_REGISTRY).step()).toThrow(RangeError);
    expect(() => IntcodeMachine.fromProgram(parseIntcodeProgram('103,0,99'), STD_REGISTRY).step()).toThrow(Error);

    const immInWithData = IntcodeMachine.fromProgram(parseIntcodeProgram('103,0,99'), STD_REGISTRY, {
      io: new BufferedIoChannel([1n]),
    });
    expect(() => immInWithData.step()).toThrow(Error);
    expect(immInWithData.pendingInputCount).toBe(1);

    expect(() => IntcodeMachine.fromProgram(parseIntcodeProgram('201,0,0,0,99'), STD_REGISTRY).step()).toThrow(Error);
    expect(() => IntcodeMachine.fromProgram(parseIntcodeProgram('203,0,99'), STD_REGISTRY).step()).toThrow(Error);
  });

  it('supports waiting-input pause, throw on step, pushInput resume, and all options forms', () => {
    const machine = IntcodeMachine.fromProgram(parseIntcodeProgram('3,5,4,5,99,0'), STD_REGISTRY, {});
    expect(machine.pendingInputCount).toBe(0);
    expect(machine.outputCount).toBe(0);
    expect(machine.snapshotInputs()).toEqual([]);

    const waitStep = machine.step();
    expect(waitStep.waitingForInput).toBe(true);
    expect(waitStep.ipBefore).toBe(0n);
    expect(waitStep.ipAfter).toBe(0n);
    expect(waitStep.inputConsumed).toBeNull();
    expect(waitStep.write).toBeNull();
    expect(machine.status).toBe('waiting-input');
    expect(machine.ip).toBe(0n);
    expect(machine.stepCount).toBe(0);
    expect(() => machine.step()).toThrow(Error);

    machine.pushInput(55n);
    expect(machine.status).toBe('running');
    expect(machine.pendingInputCount).toBe(1);
    expect(machine.snapshotInputs()).toEqual([55n]);

    const inStep = machine.step();
    expect(inStep.waitingForInput).toBe(false);
    expect(inStep.inputConsumed).toBe(55n);
    expect(inStep.write).toEqual({ address: 5n, previousValue: 0n, value: 55n });

    expect(machine.step().outputEmitted).toBe(55n);
    expect(machine.outputCount).toBe(1);
    expect(machine.snapshotOutputs()).toEqual([55n]);

    const mRunWait = IntcodeMachine.fromProgram(parseIntcodeProgram('3,0,99'), STD_REGISTRY);
    expect(mRunWait.run(10)).toBe(0);
    expect(mRunWait.status).toBe('waiting-input');

    const modes = createModeRegistry(CORE_MODES);
    const customModesOnly = IntcodeMachine.fromProgram(parseIntcodeProgram('1101,2,3,5,99,0'), STD_REGISTRY, { modes });
    expect(customModesOnly.run(5)).toBe(2);
    expect(customModesOnly.readMemory(5n)).toBe(5n);

    const io = new BufferedIoChannel([9n]);
    const bothOptions = IntcodeMachine.fromProgram(parseIntcodeProgram('3,3,99,0'), STD_REGISTRY, { modes, io });
    bothOptions.pushInput(12n);
    expect(bothOptions.run(5)).toBe(2);
    expect(bothOptions.readMemory(3n)).toBe(9n);
    expect(bothOptions.snapshotInputs()).toEqual([12n]);
  });
});
