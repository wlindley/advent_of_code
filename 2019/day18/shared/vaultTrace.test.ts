import { describe, expect, it } from 'vitest';
import { QUAD_ROBOT_POLICY, SINGLE_EXPLORER_POLICY } from './vaultPolicy';
import { DEFAULT_MAX_TRACE_STEPS, VaultSolver } from './vaultTrace';

describe('vaultPolicy and vaultTrace', () => {
  it('enforces entrance counts in SINGLE_EXPLORER_POLICY and QUAD_ROBOT_POLICY', () => {
    const single = new VaultSolver(SINGLE_EXPLORER_POLICY);
    const quad = new VaultSolver(QUAD_ROBOT_POLICY);

    expect(single.policy.id).toBe('part1-single');
    expect(quad.policy.id).toBe('part2-quad');

    const fourEntrances = '@.@\n.#.\n@a@';
    expect(() => single.parse(fourEntrances)).toThrow(/single entrance/);
    expect(quad.parse(fourEntrances).entrances.length).toBe(4);

    const splittable = [
      '#######',
      '#a...b#',
      '#..@..#',
      '#c...d#',
      '#######',
    ].join('\n');
    expect(quad.parse(splittable).entrances.length).toBe(4);

    expect(() => quad.parse('@.@\n...\n###')).toThrow(/1 or 4 entrances/);
  });

  it('produces bounded step-by-step traces with shared frozen trails and trailLengths', () => {
    const solver = new VaultSolver(SINGLE_EXPLORER_POLICY);
    const map = solver.parse('#########\n#b.A.@.a#\n#########');
    expect(solver.solve(map)).toBe(8);

    const frames = solver.trace(map);
    expect(frames.length).toBe(9);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.activeRobotIndex).toBe(-1);
    expect(frames[0]!.trailLengths).toEqual([1]);
    expect(frames[0]!.collectedMask).toBe(0);
    expect(frames[8]!.stepIndex).toBe(8);
    expect(frames[8]!.totalSteps).toBe(8);
    expect(frames[8]!.collectedMask).toBe(map.allKeysMask);
    expect(frames[8]!.trailLengths).toEqual([9]);
    expect(frames[0]!.robotTrails).toBe(frames[8]!.robotTrails);
    expect(Object.isFrozen(frames[0]!.robotTrails)).toBe(true);
  });

  it('samples traces to maxSteps and handles zero-key and multi-robot traces', () => {
    const solver = new VaultSolver(SINGLE_EXPLORER_POLICY);
    const map = solver.parse('#########\n#b.A.@.a#\n#########');

    const sampled = solver.trace(map, { maxSteps: 4 });
    expect(sampled.length).toBe(4);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[3]!.stepIndex).toBe(8);

    const singleFrame = solver.trace(map, { maxSteps: 1 });
    expect(singleFrame.length).toBe(1);
    expect(singleFrame[0]!.stepIndex).toBe(8);

    expect(() => solver.trace(map, { maxSteps: 0 })).toThrow(/maxSteps/);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);

    const zeroMap = solver.parse('###\n#@#\n###');
    const zeroFrames = solver.trace(zeroMap);
    expect(zeroFrames.length).toBe(1);
    expect(zeroFrames[0]!.totalSteps).toBe(0);

    const quadSolver = new VaultSolver(QUAD_ROBOT_POLICY);
    const quadMap = quadSolver.parse([
      '#######',
      '#a.#Cd#',
      '##...##',
      '#..@..#',
      '##...##',
      '#cB#Ab#',
      '#######',
    ].join('\n'));
    const quadFrames = quadSolver.trace(quadMap);
    const last = quadFrames[quadFrames.length - 1]!;
    expect(last.collectedMask).toBe(quadMap.allKeysMask);
    expect(last.trailLengths.reduce((sum, n) => sum + n - 1, 0)).toBe(last.totalSteps);
  });
});
