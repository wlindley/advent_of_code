import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { DEFAULT_MAX_VM_STEPS, IntcodeBeamOracle } from './beamProbe';

const BEAM_ROM =
  '3,59,3,60,107,-1,59,61,107,-1,60,62,102,6,60,63,102,7,59,64,1001,64,1,64,7,63,64,63,102,3,59,64,102,5,60,65,1001,65,1,65,7,64,65,64,2,61,62,61,2,61,63,61,2,61,64,61,4,61,99';

describe('IntcodeBeamOracle', () => {
  it('evaluates beam coordinates and caches repeated probes', () => {
    const oracle = new IntcodeBeamOracle(parseIntcodeProgram(BEAM_ROM));
    expect(DEFAULT_MAX_VM_STEPS).toBe(10_000);
    expect(oracle.probeCount).toBe(0);
    expect(oracle.probe(0, 0)).toBe(true);
    expect(oracle.probe(1, 0)).toBe(false);
    expect(oracle.probe(1, 1)).toBe(true);
    expect(oracle.probe(5, 3)).toBe(true);
    expect(oracle.probe(10, 1)).toBe(false);
    expect(oracle.probeCount).toBe(5);

    expect(oracle.probe(0, 0)).toBe(true);
    expect(oracle.probe(1, 0)).toBe(false);
    expect(oracle.probeCount).toBe(5);
  });

  it('rejects invalid maxVmSteps and invalid coordinates', () => {
    const program = parseIntcodeProgram(BEAM_ROM);
    expect(() => new IntcodeBeamOracle(program, 0)).toThrow(RangeError);
    expect(() => new IntcodeBeamOracle(program, -5)).toThrow(RangeError);
    expect(() => new IntcodeBeamOracle(program, 1.5)).toThrow(RangeError);

    const oracle = new IntcodeBeamOracle(program, 2_000);
    expect(() => oracle.probe(-1, 0)).toThrow(RangeError);
    expect(() => oracle.probe(0, -1)).toThrow(RangeError);
    expect(() => oracle.probe(1.2, 0)).toThrow(RangeError);
    expect(() => oracle.probe(0, Number.NaN)).toThrow(RangeError);
  });

  it('rejects non-halting, step-limit-exceeding, and malformed-output programs', () => {
    const waiting = new IntcodeBeamOracle(parseIntcodeProgram('3,0,3,1,3,2,99'));
    expect(() => waiting.probe(0, 0)).toThrow(/halt/i);

    const infinite = new IntcodeBeamOracle(parseIntcodeProgram('1105,1,0'), 50);
    expect(() => infinite.probe(0, 0)).toThrow(RangeError);

    const emptyOut = new IntcodeBeamOracle(parseIntcodeProgram('99'));
    expect(() => emptyOut.probe(0, 0)).toThrow(/exactly 1 output/i);

    const twoOut = new IntcodeBeamOracle(parseIntcodeProgram('104,0,104,1,99'));
    expect(() => twoOut.probe(0, 0)).toThrow(/exactly 1 output/i);

    const badVal = new IntcodeBeamOracle(parseIntcodeProgram('104,2,99'));
    expect(() => badVal.probe(0, 0)).toThrow(/0 or 1/);
  });
});
