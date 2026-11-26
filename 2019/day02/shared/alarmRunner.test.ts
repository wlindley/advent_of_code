import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import {
  ALARM_1202_INPUTS,
  DEFAULT_MAX_MACHINE_STEPS,
  DEFAULT_MAX_TRACE_STEPS,
  createAlarmSolver,
  patchProgramInputs,
  runGravityAssist,
  traceGravityAssist,
} from './alarmRunner';

function buildMultiStepTape(instructionCount: number): string {
  const cells: string[] = [];
  for (let i = 0; i < instructionCount; i += 1) {
    cells.push('1', '0', '0', '0');
  }
  cells.push('99');
  return cells.join(',');
}

describe('patchProgramInputs & runGravityAssist', () => {
  it('exposes frozen 1202 constants and patches addresses 1 and 2 without mutating source', () => {
    expect(Object.isFrozen(ALARM_1202_INPUTS)).toBe(true);
    expect(ALARM_1202_INPUTS).toEqual({ noun: 12n, verb: 2n });
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(DEFAULT_MAX_MACHINE_STEPS).toBe(100_000);

    const source = parseIntcodeProgram('1,0,0,3,99');
    const patched = patchProgramInputs(source, { noun: 12n, verb: 2n });
    expect(patched.cells).toEqual([1n, 12n, 2n, 3n, 99n]);
    expect(source.cells).toEqual([1n, 0n, 0n, 3n, 99n]);
  });

  it('rejects short programs that lack noun/verb slots at addresses 1 and 2', () => {
    expect(() => patchProgramInputs(parseIntcodeProgram('99'), ALARM_1202_INPUTS)).toThrow(RangeError);
    expect(() => patchProgramInputs(parseIntcodeProgram('1,2'), ALARM_1202_INPUTS)).toThrow(RangeError);
  });

  it('runs patched program and returns cell 0 value', () => {
    const program = parseIntcodeProgram('1,0,0,3,2,3,11,0,99,30,40,50,68');
    expect(runGravityAssist(program, { noun: 9n, verb: 10n })).toBe(3500n);
  });
});

describe('traceGravityAssist', () => {
  it('captures all steps with memory snapshots when totalSteps <= maxSteps', () => {
    const program = parseIntcodeProgram('1,0,0,3,2,3,11,0,99,30,40,50,68');
    const frames = traceGravityAssist(program, { noun: 9n, verb: 10n });
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames.length).toBe(3);
    expect(frames[0]!.step.stepIndex).toBe(0);
    expect(frames[0]!.totalSteps).toBe(3);
    expect(frames[0]!.memory[1]).toBe(9n);
    expect(frames[0]!.memory[2]).toBe(10n);
    expect(frames[2]!.step.halted).toBe(true);
    expect(frames[2]!.memory[0]).toBe(3500n);
  });

  it('samples large traces to maxSteps while preserving final halted memory state', () => {
    const program = parseIntcodeProgram(buildMultiStepTape(150));
    const expected = runGravityAssist(program, { noun: 0n, verb: 0n });
    const frames = traceGravityAssist(program, { noun: 0n, verb: 0n }, { maxSteps: 10 });
    expect(frames.length).toBe(10);
    expect(frames[0]!.step.stepIndex).toBe(0);
    expect(frames[9]!.step.stepIndex).toBe(150);
    expect(frames[9]!.totalSteps).toBe(151);
    expect(frames[9]!.memory[0]).toBe(expected);
    expect(() => traceGravityAssist(program, ALARM_1202_INPUTS, { maxSteps: 0 })).toThrow(RangeError);
  });
});

describe('createAlarmSolver', () => {
  it('builds a frozen PuzzleSolver bound to fixed noun/verb inputs', () => {
    const solver = createAlarmSolver({ noun: 9n, verb: 10n });
    expect(Object.isFrozen(solver)).toBe(true);
    const program = solver.parse('1,0,0,3,2,3,11,0,99,30,40,50,68');
    expect(solver.solve(program)).toBe(3500n);
    const frames = solver.trace(program, { maxSteps: 2 });
    expect(frames.length).toBe(2);
    expect(frames[0]!.step.stepIndex).toBe(0);
    expect(frames[1]!.step.stepIndex).toBe(2);
  });
});
