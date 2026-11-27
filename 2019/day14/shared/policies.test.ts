import { describe, expect, it } from 'vitest';
import {
  MAX_FUEL_FOR_TRILLION_ORE_POLICY,
  ORE_FOR_ONE_FUEL_POLICY,
  TRILLION_ORE,
  createMaxFuelPolicy,
  createOreForFuelPolicy,
} from './policies';
import { StoichiometrySolver } from './solver';

const SAMPLE_RAW = [
  '10 ORE => 10 A',
  '1 ORE => 1 B',
  '7 A, 1 B => 1 C',
  '7 A, 1 C => 1 D',
  '7 A, 1 D => 1 E',
  '7 A, 1 E => 1 FUEL',
].join('\n');

describe('day14 shared policies and solver', () => {
  it('executes ORE_FOR_ONE_FUEL_POLICY and custom fuel policies via StoichiometrySolver', () => {
    const solver1 = new StoichiometrySolver(ORE_FOR_ONE_FUEL_POLICY);
    expect(Object.isFrozen(solver1)).toBe(true);
    expect(solver1.policy.id).toBe('ore-for-1-fuel');
    expect(solver1.policy.label).toContain('1 FUEL');

    const net = solver1.parse(SAMPLE_RAW);
    expect(solver1.solve(net)).toBe(31n);
    const fullTrace = solver1.trace(net);
    expect(fullTrace).toHaveLength(7);
    expect(solver1.policy.formatFrameAnswer(fullTrace[fullTrace.length - 1]!)).toBe('31');

    const bounded = solver1.trace(net, { maxSteps: 3 });
    expect(bounded).toHaveLength(3);

    const policy2 = createOreForFuelPolicy(2n);
    const solver2 = new StoichiometrySolver(policy2);
    expect(solver2.solve(net)).toBe(62n);
    expect(() => createOreForFuelPolicy(0n)).toThrow(RangeError);
  });

  it('executes MAX_FUEL_FOR_TRILLION_ORE_POLICY and custom budget policies', () => {
    expect(TRILLION_ORE).toBe(1_000_000_000_000n);
    const solverMax = new StoichiometrySolver(MAX_FUEL_FOR_TRILLION_ORE_POLICY);
    expect(solverMax.policy.id).toBe(`max-fuel-for-${TRILLION_ORE}`);

    const net = solverMax.parse(SAMPLE_RAW);
    expect(solverMax.solve(net)).toBeGreaterThan(0n);
    const frames = solverMax.trace(net, { maxSteps: 5 });
    expect(frames).toHaveLength(5);
    expect(solverMax.policy.formatFrameAnswer(frames[frames.length - 1]!)).toBe(
      String(solverMax.solve(net)),
    );

    const smallPolicy = createMaxFuelPolicy(100n);
    const smallSolver = new StoichiometrySolver(smallPolicy);
    expect(smallSolver.solve(net)).toBe(3n);
    expect(() => createMaxFuelPolicy(-1n)).toThrow(RangeError);
  });
});
