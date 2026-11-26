import { describe, expect, it } from 'vitest';
import { ChronospatialProgram, VmRegisters, type ThreeBitValue } from './types';
import { formatOutput, runProgram, traceProgram } from './vm';

describe('formatOutput', () => {
  it('joins 3-bit output values with commas', () => {
    expect(formatOutput([])).toBe('');
    expect(formatOutput([4, 6, 3, 5, 6, 3, 5, 2, 1, 0])).toBe('4,6,3,5,6,3,5,2,1,0');
  });
});

describe('runProgram', () => {
  it('executes the main Day 17 Part 1 example accurately', () => {
    const program = new ChronospatialProgram(
      new VmRegisters(729n, 0n, 0n),
      [0, 1, 5, 4, 3, 0],
    );
    const result = runProgram(program);
    expect(formatOutput(result.output)).toBe('4,6,3,5,6,3,5,2,1,0');
    expect(result.finalRegisters).toEqual(new VmRegisters(0n, 0n, 0n));
    expect(result.finalIp).toBe(6);
    expect(result.stepsExecuted).toBe(30);
  });

  it('halts cleanly on odd program length or odd-IP landing past end', () => {
    const singleByte = new ChronospatialProgram(new VmRegisters(1n, 0n, 0n), [0]);
    expect(runProgram(singleByte)).toEqual({
      finalRegisters: new VmRegisters(1n, 0n, 0n),
      finalIp: 0,
      stepsExecuted: 0,
      output: [],
    });

    // jnz 3 jumps to odd IP 3, executing (5, 4 -> out A) then halting at IP 5 (>= length - 1)
    const oddJump = new ChronospatialProgram(new VmRegisters(5n, 0n, 0n), [3, 3, 0, 5, 4, 7]);
    const result = runProgram(oddJump);
    expect(result.output).toEqual([5]);
    expect(result.finalIp).toBe(5);
    expect(result.stepsExecuted).toBe(2);
  });

  it('allows halting on exact maxSteps and throws RangeError when exceeding maxSteps', () => {
    const looper = new ChronospatialProgram(new VmRegisters(1n, 0n, 0n), [3, 0]);
    expect(() => runProgram(looper, { maxSteps: 5 })).toThrow(RangeError);
    expect(() => runProgram(looper, { maxSteps: 0 })).toThrow(RangeError);

    const exact = new ChronospatialProgram(new VmRegisters(2n, 0n, 0n), [0, 1, 3, 0]);
    const result = runProgram(exact, { maxSteps: 4 });
    expect(result.stepsExecuted).toBe(4);
  });
});

describe('traceProgram', () => {
  it('captures initial state and every step when within maxSteps, with frozen output snapshots', () => {
    const program = new ChronospatialProgram(
      new VmRegisters(729n, 0n, 0n),
      [0, 1, 5, 4, 3, 0],
    );
    const frames = traceProgram(program, { maxSteps: 40 });

    expect(frames).toHaveLength(31);
    expect(frames[0]!.step).toBe(0);
    expect(frames[0]!.ip).toBe(0);
    expect(frames[0]!.prevRegisters).toBeNull();
    expect(frames[0]!.lastAction).toBeNull();
    expect(frames[0]!.halted).toBe(false);
    expect(frames[0]!.output).toEqual([]);
    expect(Object.isFrozen(frames[0]!.output)).toBe(true);

    // Step 1: adv 1 -> A becomes 364
    expect(frames[1]!.step).toBe(1);
    expect(frames[1]!.registers).toEqual(new VmRegisters(364n, 0n, 0n));
    expect(frames[1]!.prevRegisters).toEqual(new VmRegisters(729n, 0n, 0n));
    expect(frames[1]!.lastAction?.mnemonic).toBe('adv');
    expect(frames[1]!.lastAction?.jumped).toBe(false);

    // Step 3: jnz 0 jumps back to 0
    expect(frames[3]!.ip).toBe(0);
    expect(frames[3]!.lastAction?.mnemonic).toBe('jnz');
    expect(frames[3]!.lastAction?.jumped).toBe(true);

    // Final frame is halted with complete output
    const last = frames.at(-1)!;
    expect(last.step).toBe(30);
    expect(last.halted).toBe(true);
    expect(last.output).toEqual([4, 6, 3, 5, 6, 3, 5, 2, 1, 0]);
    // Earlier snapshot was not mutated
    expect(frames[2]!.output).toEqual([4]);
  });

  it('bounds trace length to maxSteps while preserving start and end frames', () => {
    const program = new ChronospatialProgram(
      new VmRegisters(729n, 0n, 0n),
      [0, 1, 5, 4, 3, 0],
    );
    const bounded = traceProgram(program, { maxSteps: 4 });
    expect(bounded).toHaveLength(4);
    expect(bounded[0]!.step).toBe(0);
    expect(bounded.at(-1)!.step).toBe(30);
    expect(bounded.at(-1)!.halted).toBe(true);

    const single = traceProgram(program, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.step).toBe(30);
    expect(single[0]!.halted).toBe(true);
  });

  it('handles zero-step programs and invalid maxSteps', () => {
    const singleByte = new ChronospatialProgram(new VmRegisters(0n, 0n, 0n), [7 as ThreeBitValue]);
    const frames = traceProgram(singleByte);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.halted).toBe(true);
    expect(() => traceProgram(singleByte, { maxSteps: -2 })).toThrow(RangeError);
  });
});
