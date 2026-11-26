import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../../shared/intcode';
import {
  GravityAssistMatch,
  PART2_MAX_INPUT,
  PART2_SEARCH_CONFIG,
  PART2_TARGET,
  findGravityAssistMatch,
} from './search';

function affineProgram(a: bigint, b: bigint, c: bigint) {
  return parseIntcodeProgram(
    [1n, 0n, 0n, 3n, 2n, 1n, 21n, 0n, 2n, 2n, 22n, 3n, 1n, 0n, 3n, 0n, 1n, 0n, 23n, 0n, 99n, a, b, c, 0n].join(','),
  );
}

function exampleProgram() {
  const zeros = new Array<string>(81).fill('0').join(',');
  return parseIntcodeProgram(
    `1,0,0,3,2,1,17,0,1,0,2,0,1,0,18,0,99,1000,19678718,${zeros}`,
  );
}

function fixedMisleadingProgram() {
  // mem[0] = noun^2 * verb + 10*noun + 5*verb; tangent at (0,0) predicts (2,2)=38 != 30, fallback finds (3,0).
  return parseIntcodeProgram(
    '1,0,0,3,2,1,1,31,2,31,2,31,2,1,29,32,2,2,30,33,1,31,32,0,1,0,33,0,99,10,5,0,0,0',
  );
}

function zeroVerbMisleadingProgram() {
  // mem[0] = noun^2 + 3*noun + verb*(verb - 1); at (0,0)=0, (1,0)=4, (0,1)=0 (B=0).
  return parseIntcodeProgram(
    '1,0,0,3,2,1,1,31,2,1,29,32,1,31,32,0,1,2,30,33,2,2,33,33,1,0,33,0,99,3,-1,0,0,0',
  );
}

describe('2019 Day 2 Part 2 search', () => {
  it('solves the Part 2 example input via affine inference and exposes dynamic getters', () => {
    const match = findGravityAssistMatch(exampleProgram(), PART2_SEARCH_CONFIG);
    expect(PART2_TARGET).toBe(19690720n);
    expect(PART2_MAX_INPUT).toBe(99n);
    expect(Object.isFrozen(PART2_SEARCH_CONFIG)).toBe(true);
    expect(match.inputs).toEqual({ noun: 12n, verb: 2n });
    expect(match.output).toBe(PART2_TARGET);
    expect(match.answerCode).toBe(1202n);
    expect(match.strategy).toBe('affine');
    expect(match.evaluatedCount).toBe(4);
    expect(match.intercept).toBe(19678718n);
    expect(match.nounSlope).toBe(1000n);
    expect(match.verbSlope).toBe(1n);
    expect(match.predictAffine({ noun: 12n, verb: 2n })).toBe(PART2_TARGET);
    expect(Object.isFrozen(match)).toBe(true);
    expect(Object.isFrozen(match.inputs)).toBe(true);
    expect(Object.isFrozen(match.basisProbes)).toBe(true);
    expect(Object.isFrozen(match.basisProbes[0])).toBe(true);
    expect(Object.isFrozen(match.basisProbes[0].inputs)).toBe(true);
  });

  it('reuses cached basis probes when (0,0), (1,0), or (0,1) wins (evaluatedCount === 3)', () => {
    const m00 = findGravityAssistMatch(affineProgram(5n, 3n, 100n), { target: 100n, maxInput: 5n });
    expect(m00.inputs).toEqual({ noun: 0n, verb: 0n });
    expect(m00.evaluatedCount).toBe(3);

    const m10 = findGravityAssistMatch(affineProgram(5n, 3n, 100n), { target: 105n, maxInput: 5n });
    expect(m10.inputs).toEqual({ noun: 1n, verb: 0n });
    expect(m10.evaluatedCount).toBe(3);

    const m01 = findGravityAssistMatch(affineProgram(5n, 3n, 100n), { target: 103n, maxInput: 5n });
    expect(m01.inputs).toEqual({ noun: 0n, verb: 1n });
    expect(m01.evaluatedCount).toBe(3);
  });

  it('finds boundary winners at (max, max), (0, max), and (max, 0)', () => {
    const prog = affineProgram(10n, 3n, 7n);
    expect(findGravityAssistMatch(prog, { target: 72n, maxInput: 5n }).inputs).toEqual({ noun: 5n, verb: 5n });
    expect(findGravityAssistMatch(prog, { target: 22n, maxInput: 5n }).inputs).toEqual({ noun: 0n, verb: 5n });
    expect(findGravityAssistMatch(prog, { target: 57n, maxInput: 5n }).inputs).toEqual({ noun: 5n, verb: 0n });
  });

  it('handles zero-slope and negative-slope affine matrices and out-of-range conditions', () => {
    const constProg = affineProgram(0n, 0n, 42n);
    expect(findGravityAssistMatch(constProg, { target: 42n, maxInput: 4n }).inputs).toEqual({ noun: 0n, verb: 0n });
    expect(() => findGravityAssistMatch(constProg, { target: 43n, maxInput: 4n })).toThrow(Error);

    const zeroVerbProg = affineProgram(4n, 0n, 10n);
    expect(findGravityAssistMatch(zeroVerbProg, { target: 22n, maxInput: 5n }).inputs).toEqual({ noun: 3n, verb: 0n });
    expect(() => findGravityAssistMatch(zeroVerbProg, { target: 21n, maxInput: 5n })).toThrow(Error);
    expect(() => findGravityAssistMatch(zeroVerbProg, { target: 6n, maxInput: 5n })).toThrow(Error);
    expect(() => findGravityAssistMatch(zeroVerbProg, { target: 34n, maxInput: 5n })).toThrow(Error);

    const zeroNounProg = affineProgram(0n, 3n, 10n);
    expect(findGravityAssistMatch(zeroNounProg, { target: 22n, maxInput: 5n }).inputs).toEqual({ noun: 0n, verb: 4n });

    const negProg = affineProgram(-5n, -2n, 50n);
    expect(findGravityAssistMatch(negProg, { target: 34n, maxInput: 5n }).inputs).toEqual({ noun: 2n, verb: 3n });

    const outOfRangeB = affineProgram(2n, 3n, 10n);
    expect(() => findGravityAssistMatch(outOfRangeB, { target: 5n, maxInput: 4n })).toThrow(Error);
    expect(() => findGravityAssistMatch(outOfRangeB, { target: 40n, maxInput: 4n })).toThrow(Error);
  });

  it('falls back to exhaustive search for bilinear and misleading-tangent non-affine programs', () => {
    const bilinear = parseIntcodeProgram('1,0,0,3,2,1,2,0,1,0,13,0,99,5');
    const biMatch = findGravityAssistMatch(bilinear, { target: 11n, maxInput: 5n });
    expect(biMatch.strategy).toBe('exhaustive');
    expect(biMatch.inputs).toEqual({ noun: 2n, verb: 3n });

    const misleadMatch = findGravityAssistMatch(fixedMisleadingProgram(), { target: 30n, maxInput: 3n });
    expect(misleadMatch.strategy).toBe('exhaustive');
    expect(misleadMatch.inputs).toEqual({ noun: 3n, verb: 0n });
    expect(misleadMatch.evaluatedCount).toBe(13);

    const zeroVerbMislead = findGravityAssistMatch(zeroVerbMisleadingProgram(), { target: 12n, maxInput: 3n });
    expect(zeroVerbMislead.strategy).toBe('exhaustive');
    expect(zeroVerbMislead.inputs).toEqual({ noun: 2n, verb: 2n });
  });

  it('validates config, match evaluatedCount, and fails fast on VM or tape errors', () => {
    const prog = affineProgram(1n, 1n, 0n);
    expect(() => findGravityAssistMatch(prog, { target: 0n, maxInput: 0n })).toThrow(RangeError);
    expect(() => findGravityAssistMatch(prog, { target: 0n, maxInput: -2n })).toThrow(RangeError);
    const probes = [
      { inputs: { noun: 0n, verb: 0n }, output: 0n },
      { inputs: { noun: 1n, verb: 0n }, output: 1n },
      { inputs: { noun: 0n, verb: 1n }, output: 1n },
    ] as const;
    expect(() => new GravityAssistMatch({ noun: 0n, verb: 0n }, 0n, 'affine', 0, probes)).toThrow(RangeError);
    expect(() => new GravityAssistMatch({ noun: 0n, verb: 0n }, 0n, 'affine', 1.5, probes)).toThrow(RangeError);
    expect(() => findGravityAssistMatch(parseIntcodeProgram('99'), { target: 0n, maxInput: 2n })).toThrow(RangeError);
    expect(() => findGravityAssistMatch(parseIntcodeProgram('77,0,0,0'), { target: 0n, maxInput: 2n })).toThrow(Error);
    const crashFallback = parseIntcodeProgram('1,0,0,3,2,1,2,12,1,12,13,12,99,99');
    expect(() => findGravityAssistMatch(crashFallback, { target: 999n, maxInput: 2n })).toThrow(Error);
  });
});
