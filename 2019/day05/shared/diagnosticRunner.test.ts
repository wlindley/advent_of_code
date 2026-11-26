import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import {
  AIR_CONDITIONER_SYSTEM_ID,
  DEFAULT_MAX_MACHINE_STEPS,
  DEFAULT_MAX_TRACE_STEPS,
  DiagnosticReport,
  THERMAL_RADIATOR_SYSTEM_ID,
  createDiagnosticSolver,
  runDiagnostic,
  solveDiagnostic,
  traceDiagnostic,
} from './diagnosticRunner';

function buildMultiOutputTape(addSteps: number): string {
  const cells = ['3', '0'];
  for (let i = 0; i < addSteps; i += 1) {
    cells.push('1101', '0', String(i), '0');
  }
  cells.push('104', '0', '4', '0', '99');
  return cells.join(',');
}

describe('DiagnosticReport & constants', () => {
  it('exposes Day 5 constants and frozen report with derived getters', () => {
    expect(AIR_CONDITIONER_SYSTEM_ID).toBe(1n);
    expect(THERMAL_RADIATOR_SYSTEM_ID).toBe(5n);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(160);
    expect(DEFAULT_MAX_MACHINE_STEPS).toBe(100_000);

    const pass = new DiagnosticReport(1n, [0n, 0n, 987654n], 12);
    expect(Object.isFrozen(pass)).toBe(true);
    expect(Object.isFrozen(pass.outputs)).toBe(true);
    expect(pass.systemId).toBe(1n);
    expect(pass.stepCount).toBe(12);
    expect(pass.testOutputs).toEqual([0n, 0n]);
    expect(pass.diagnosticCode).toBe(987654n);
    expect(pass.allTestsPassed).toBe(true);

    const fail = new DiagnosticReport(5n, [0n, 3n, 999n], 8);
    expect(fail.testOutputs).toEqual([0n, 3n]);
    expect(fail.diagnosticCode).toBe(999n);
    expect(fail.allTestsPassed).toBe(false);

    expect(() => new DiagnosticReport(1n, [], 1)).toThrow(Error);
  });
});

describe('runDiagnostic & solveDiagnostic', () => {
  it('runs a multi-test diagnostic tape and validates passing vs failing prefixes', () => {
    const passing = parseIntcodeProgram('3,9,104,0,104,0,4,9,99,0');
    const report = runDiagnostic(passing, 1n);
    expect(report.outputs).toEqual([0n, 0n, 1n]);
    expect(report.allTestsPassed).toBe(true);
    expect(solveDiagnostic(passing, 1n)).toBe(1n);

    const failing = parseIntcodeProgram('3,9,104,0,104,7,4,9,99,0');
    const failReport = runDiagnostic(failing, 1n, 20);
    expect(failReport.allTestsPassed).toBe(false);
    expect(failReport.diagnosticCode).toBe(1n);
    expect(() => solveDiagnostic(failing, 1n)).toThrow(Error);
  });

  it('rejects programs that stall waiting for input, emit no output, or exceed maxSteps', () => {
    const needsTwoInputs = parseIntcodeProgram('3,0,3,0,4,0,99');
    expect(() => runDiagnostic(needsTwoInputs, 1n)).toThrow(Error);

    const silent = parseIntcodeProgram('99');
    expect(() => runDiagnostic(silent, 1n)).toThrow(Error);

    const longTape = parseIntcodeProgram(buildMultiOutputTape(10));
    expect(() => runDiagnostic(longTape, 1n, 3)).toThrow(RangeError);
  });
});

describe('traceDiagnostic & createDiagnosticSolver', () => {
  it('captures full or sampled frames including non-zero failing diagnostic outputs', () => {
    const failing = parseIntcodeProgram('3,9,104,42,4,9,99,0,0,0');
    const fullFrames = traceDiagnostic(failing, 1n);
    expect(Object.isFrozen(fullFrames)).toBe(true);
    expect(fullFrames.length).toBe(4);
    expect(fullFrames[0]!.pendingInputs).toEqual([]);
    expect(fullFrames[1]!.outputs).toEqual([42n]);
    expect(fullFrames[3]!.outputs).toEqual([42n, 1n]);
    expect(fullFrames[3]!.step.halted).toBe(true);

    const longTape = parseIntcodeProgram(buildMultiOutputTape(200));
    const sampled = traceDiagnostic(longTape, 1n, { maxSteps: 12 });
    expect(sampled.length).toBe(12);
    expect(sampled[0]!.step.stepIndex).toBe(0);
    expect(sampled[11]!.step.halted).toBe(true);
    expect(sampled[11]!.outputs).toEqual([0n, 199n]);
  });

  it('rejects waiting-input or silent programs in traceDiagnostic and exposes frozen DiagnosticSolver', () => {
    expect(() => traceDiagnostic(parseIntcodeProgram('3,0,3,0,4,0,99'), 1n)).toThrow(Error);
    expect(() => traceDiagnostic(parseIntcodeProgram('99'), 1n)).toThrow(Error);

    const solver = createDiagnosticSolver(AIR_CONDITIONER_SYSTEM_ID);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.systemId).toBe(1n);
    const program = solver.parse('3,0,4,0,99');
    expect(solver.solve(program)).toBe(1n);
    expect(solver.trace(program).length).toBe(3);
    expect(solver.trace(program, { maxSteps: 2 }).length).toBe(2);
  });
});
