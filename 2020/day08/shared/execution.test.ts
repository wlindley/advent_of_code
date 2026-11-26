import { describe, expect, it } from 'vitest';
import { ExecutionRun, ExecutionStep, executeBootProgram } from './execution';
import { parseBootInstruction } from './instruction';
import { parseBootProgram } from './program';

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

describe('execution', () => {
  it('validates ExecutionStep and ExecutionRun invariants and derived getters', () => {
    const jmp = parseBootInstruction('jmp +2');
    const step = new ExecutionStep(0, 1, jmp, 10n);
    expect(Object.isFrozen(step)).toBe(true);
    expect(step.accAfter).toBe(10n);
    expect(step.nextPc).toBe(3);
    expect(step.isJump).toBe(true);

    expect(() => new ExecutionStep(-1, 0, jmp, 0n)).toThrow(RangeError);
    expect(() => new ExecutionStep(0, -1, jmp, 0n)).toThrow(RangeError);
    expect(() => new ExecutionStep(0.5, 0, jmp, 0n)).toThrow(RangeError);
    expect(() => new ExecutionStep(0, 1.5, jmp, 0n)).toThrow(RangeError);

    expect(() => new ExecutionRun('terminated', [])).toThrow(/at least one step/i);
  });

  it('detects loops and reports finalAccumulator and loopTargetPc', () => {
    const program = parseBootProgram(EXAMPLE_INPUT);
    const run = executeBootProgram(program);

    expect(Object.isFrozen(run)).toBe(true);
    expect(Object.isFrozen(run.steps)).toBe(true);
    expect(run.status).toBe('loop-detected');
    expect(run.stepCount).toBe(7);
    expect(run.finalAccumulator).toBe(5n);
    expect(run.finalPc).toBe(1);
    expect(run.loopTargetPc).toBe(1);
    expect(run.lastStep.pc).toBe(4);
  });

  it('terminates normally when pc reaches program.length', () => {
    const program = parseBootProgram('acc +2\njmp +2\nacc +99\nacc +6');
    const run = executeBootProgram(program);

    expect(run.status).toBe('terminated');
    expect(run.stepCount).toBe(3);
    expect(run.finalAccumulator).toBe(8n);
    expect(run.finalPc).toBe(4);
    expect(run.loopTargetPc).toBeNull();
  });

  it('detects out-of-bounds jumps below 0 and above program.length', () => {
    const negJump = executeBootProgram(parseBootProgram('acc +3\njmp -5'));
    expect(negJump.status).toBe('out-of-bounds');
    expect(negJump.finalPc).toBe(-4);
    expect(negJump.finalAccumulator).toBe(3n);
    expect(negJump.loopTargetPc).toBeNull();

    const overJump = executeBootProgram(parseBootProgram('jmp +3\nacc +1'));
    expect(overJump.status).toBe('out-of-bounds');
    expect(overJump.finalPc).toBe(3);
  });

  it('preserves exact bigint precision beyond Number.MAX_SAFE_INTEGER', () => {
    const program = parseBootProgram(
      'acc +9007199254740991\nacc +9007199254740991\nacc +3',
    );
    const run = executeBootProgram(program);
    expect(run.status).toBe('terminated');
    expect(run.finalAccumulator).toBe(18014398509481985n);
  });
});
