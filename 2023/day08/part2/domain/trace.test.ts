import { describe, expect, it } from 'vitest';
import { parseWastelandNetwork } from '../../shared';
import { analyzeGhostConvergence } from './convergence';
import {
  DEFAULT_MAX_TRACE_STEPS,
  GhostConvergenceFrame,
  traceHauntedWastelandPart2,
} from './trace';

const OFFICIAL_PART2_EXAMPLE = [
  'LR',
  '',
  '11A = (11B, XXX)',
  '11B = (XXX, 11Z)',
  '11Z = (11B, XXX)',
  '22A = (22B, XXX)',
  '22B = (22C, 22C)',
  '22C = (22Z, 22Z)',
  '22Z = (22B, 22B)',
  'XXX = (XXX, XXX)',
].join('\n');

describe('GhostConvergenceFrame & traceHauntedWastelandPart2', () => {
  it('emits discovery, merge, and converged frames with lockstep timeline for small answers', () => {
    const net = parseWastelandNetwork(OFFICIAL_PART2_EXAMPLE);
    const frames = traceHauntedWastelandPart2(net);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(64);
    expect(frames).toHaveLength(4);
    expect(Object.isFrozen(frames)).toBe(true);

    const [discovery, m1, m2, converged] = frames;
    expect(discovery!.stage).toBe('discovery');
    expect(discovery!.ghostCount).toBe(2);
    expect(discovery!.maxPrefixLength).toBe(1);
    expect(discovery!.minSteadyStep).toBe(1n);
    expect(discovery!.activeGhost).toBeUndefined();
    expect(discovery!.runningStep).toBe(0n);
    expect(discovery!.runningModulus).toBe(1n);
    expect(discovery!.isConverged).toBe(false);
    expect(discovery!.log2ScaleRatio).toBe(0);
    expect(discovery!.lockstepTimeline).toHaveLength(7);
    expect(discovery!.lockstepTimeline[6]!.allTargets).toBe(true);

    expect(m1!.stage).toBe('merge');
    expect(m1!.activeGhost?.startLabel).toBe('11A');
    expect(m1!.runningModulus).toBe(2n);
    expect(m2!.stage).toBe('merge');
    expect(m2!.runningStep).toBe(6n);

    expect(converged!.stage).toBe('converged');
    expect(converged!.isConverged).toBe(true);
    expect(converged!.runningStep).toBe(6n);
    expect(converged!.runningModulus).toBe(6n);
    expect(converged!.log2ScaleRatio).toBeCloseTo(1, 8);
  });

  it('guards log2ScaleRatio for answer === 1n and omits lockstepTimeline when answer > 24n', () => {
    const oneStep = parseWastelandNetwork('L\n\n11A = (11Z, 11Z)\n11Z = (11A, 11A)');
    const oneFrames = traceHauntedWastelandPart2(oneStep);
    expect(oneFrames[0]!.log2ScaleRatio).toBe(0);
    expect(oneFrames[1]!.log2ScaleRatio).toBe(1);
    expect(oneFrames[2]!.log2ScaleRatio).toBe(1);

    const alignedLarge = parseWastelandNetwork([
      'L',
      '',
      '11A = (11B, 11B)',
      '11B = (11C, 11C)',
      '11C = (11D, 11D)',
      '11D = (11E, 11E)',
      '11E = (11Z, 11Z)',
      '11Z = (11B, 11B)',
      '22A = (22B, 22B)',
      '22B = (22C, 22C)',
      '22C = (22D, 22D)',
      '22D = (22E, 22E)',
      '22E = (22F, 22F)',
      '22F = (22Z, 22Z)',
      '22Z = (22B, 22B)',
    ].join('\n'));
    const largeFrames = traceHauntedWastelandPart2(alignedLarge);
    expect(largeFrames[0]!.lockstepTimeline).toHaveLength(0);
    expect(largeFrames.at(-1)!.runningStep).toBe(30n);
  });

  it('handles pre-cycle trace frames, maxSteps sampling, and invalid maxSteps', () => {
    const preNet = parseWastelandNetwork([
      'L',
      '',
      '11A = (11Z, 11Z)',
      '11Z = (11X, 11X)',
      '11X = (11X, 11X)',
    ].join('\n'));
    const preFrames = traceHauntedWastelandPart2(preNet);
    expect(preFrames.map((f) => f.stage)).toEqual(['discovery', 'converged']);
    expect(preFrames[1]!.runningModulus).toBe(1n);

    const net = parseWastelandNetwork(OFFICIAL_PART2_EXAMPLE);
    const one = traceHauntedWastelandPart2(net, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.stage).toBe('converged');

    const two = traceHauntedWastelandPart2(net, { maxSteps: 2 });
    expect(two.map((f) => f.stage)).toEqual(['discovery', 'converged']);

    expect(() => traceHauntedWastelandPart2(net, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('enforces GhostConvergenceFrame constructor invariants', () => {
    const net = parseWastelandNetwork(OFFICIAL_PART2_EXAMPLE);
    const plan = analyzeGhostConvergence(net);
    expect(() => new GhostConvergenceFrame(-1, 1, 'discovery', plan, undefined, [])).toThrow(RangeError);
    expect(() => new GhostConvergenceFrame(1, 1, 'discovery', plan, undefined, [])).toThrow(RangeError);
    expect(() => new GhostConvergenceFrame(0, 1, 'merge', plan, undefined, [])).toThrow(Error);
    expect(
      () => new GhostConvergenceFrame(0, 1, 'discovery', plan, plan.mergeSteps[0], []),
    ).toThrow(Error);
  });
});
