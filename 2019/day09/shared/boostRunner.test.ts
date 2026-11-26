import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { BOOST_SENSOR_MODE, BOOST_TEST_MODE } from './boostModels';
import { BoostSolver, runBoost, solveBoost, traceBoost } from './boostRunner';

const QUINE = '109,1,204,-1,1001,100,1,100,1008,100,16,101,1006,101,0,99';

function buildMultiStepTape(steps: number): string {
  const cells = ['109', '1000', '203', '0'];
  for (let i = 0; i < steps; i += 1) {
    cells.push('22101', '1', '0', '0');
  }
  cells.push('204', '0', '99');
  return cells.join(',');
}

describe('runBoost & solveBoost', () => {
  it('runs official Quine and sparse relative programs into frozen BoostReport', () => {
    const quineReport = runBoost(parseIntcodeProgram(QUINE), BOOST_TEST_MODE);
    expect(quineReport.outputs).toEqual(QUINE.split(',').map((s) => BigInt(s)));
    expect(quineReport.hasDiagnosticErrors).toBe(true);
    expect(quineReport.sparseEntryCount).toBeGreaterThan(0);

    const ioProgram = parseIntcodeProgram('109,20,203,5,204,5,99');
    expect(solveBoost(ioProgram, BOOST_TEST_MODE)).toBe(1n);
    expect(solveBoost(ioProgram, BOOST_SENSOR_MODE)).toBe(2n);
  });

  it('rejects multi-output malfunctioning runs in solveBoost and invalid/stalled runs in runBoost', () => {
    const failing = parseIntcodeProgram('104,203,104,204,104,999,99');
    expect(() => solveBoost(failing, BOOST_TEST_MODE)).toThrow(/203, 204/);

    expect(() => runBoost(parseIntcodeProgram('3,0,3,0,4,0,99'), BOOST_TEST_MODE)).toThrow(Error);
    expect(() => runBoost(parseIntcodeProgram('99'), BOOST_TEST_MODE)).toThrow(Error);
    expect(() => runBoost(parseIntcodeProgram(buildMultiStepTape(10)), BOOST_TEST_MODE, 3)).toThrow(
      RangeError,
    );
  });
});

describe('traceBoost & BoostSolver', () => {
  it('captures full frames with relativeBaseBefore/After and sparseEntries', () => {
    const prog = parseIntcodeProgram('109,50,203,5,204,5,99');
    const frames = traceBoost(prog, BOOST_TEST_MODE);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames.length).toBe(4);

    expect(frames[0]!.relativeBaseBefore).toBe(0n);
    expect(frames[0]!.relativeBaseAfter).toBe(50n);
    expect(frames[0]!.pendingInputs).toEqual([1n]);

    expect(frames[1]!.relativeBaseBefore).toBe(50n);
    expect(frames[1]!.relativeBaseAfter).toBe(50n);
    expect(frames[1]!.pendingInputs).toEqual([]);
    expect(frames[1]!.sparseEntries).toEqual([{ address: 55n, value: 1n }]);

    expect(frames[2]!.outputs).toEqual([1n]);
    expect(frames[3]!.step.halted).toBe(true);
    expect(frames[3]!.totalSteps).toBe(4);
  });

  it('samples large traces cleanly and rejects silent or waiting programs', () => {
    const sampled = traceBoost(parseIntcodeProgram(buildMultiStepTape(200)), BOOST_SENSOR_MODE, {
      maxSteps: 12,
    });
    expect(sampled.length).toBe(12);
    expect(sampled[0]!.step.stepIndex).toBe(0);
    expect(sampled[11]!.step.halted).toBe(true);
    expect(sampled[11]!.outputs).toEqual([202n]);

    expect(() => traceBoost(parseIntcodeProgram('99'), BOOST_TEST_MODE)).toThrow(Error);
    expect(() => traceBoost(parseIntcodeProgram('3,0,3,0,4,0,99'), BOOST_TEST_MODE)).toThrow(Error);
  });

  it('exposes frozen BoostSolver implementing parse, solve, and trace', () => {
    const solver = new BoostSolver(BOOST_TEST_MODE);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.mode).toBe(BOOST_TEST_MODE);

    const program = solver.parse('109,10,203,0,204,0,99');
    expect(solver.solve(program)).toBe(1n);
    expect(solver.trace(program).length).toBe(4);
    expect(solver.trace(program, { maxSteps: 2 }).length).toBe(2);
  });
});
