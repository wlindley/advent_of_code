import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { Blueprint, DEFAULT_TRACE_MAX_STEPS, optimizeBlueprints, simulatePlan } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'Blueprint 1: Each ore robot costs 4 ore. Each clay robot costs 2 ore. Each obsidian robot costs 3 ore and 14 clay. Each geode robot costs 2 ore and 7 obsidian.',
  'Blueprint 2: Each ore robot costs 2 ore. Each clay robot costs 3 ore. Each obsidian robot costs 3 ore and 8 clay. Each geode robot costs 3 ore and 12 obsidian.',
].join('\n');

function makeBp(id: number, baseCost: number, obsidianRobotClayCost: number): Blueprint {
  return new Blueprint({
    id,
    oreRobotOreCost: baseCost,
    clayRobotOreCost: baseCost,
    obsidianRobotOreCost: baseCost,
    obsidianRobotClayCost,
    geodeRobotOreCost: baseCost,
    geodeRobotObsidianCost: baseCost,
  });
}

function makeFakeClock(stepMs: number): Clock {
  let tick = 100;
  return { nowMs: () => (tick += stepMs) };
}

describe('2022 Day 19 Part 2 solver', () => {
  it('solves the official example via executeSolver with a fake Clock', () => {
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, makeFakeClock(15));
    expect(exec.answer).toBe(3472);
    expect(exec.elapsedMs).toBe(15);
    expect(exec.runtime).toBe('main-thread');
  });

  it('replays optimal 32-minute plans exactly with simulatePlan', () => {
    const bps = solver.parse(OFFICIAL_EXAMPLE);
    const results = optimizeBlueprints(bps, 32);
    expect(results.map((r) => r.maxGeodes)).toEqual([56, 62]);
    for (const res of results) {
      const snapshots = simulatePlan(res.blueprint, res.plan, 32);
      expect(snapshots).toHaveLength(33);
      expect(snapshots[32]!.resources.geode).toBe(res.maxGeodes);
    }
  });

  it('slices to the first 3 blueprints in solve and trace', () => {
    const firstThree = [makeBp(1, 2, 2), makeBp(2, 2, 3), makeBp(3, 2, 4)];
    const fourBps = [...firstThree, makeBp(4, 10, 99)];
    const expected = solver.solve(firstThree);
    expect(expected).toBeGreaterThan(0);
    expect(solver.solve(fourBps)).toBe(expected);
    const frames = solver.trace!(fourBps);
    expect(frames[0]!.results.map((r) => r.blueprint.id)).toEqual([1, 2, 3]);
  });

  it('solves and traces a 1-blueprint input over 33 frames', () => {
    const [bp1] = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve([bp1!])).toBe(56);
    const frames = solver.trace!([bp1!]);
    expect(frames).toHaveLength(33);
    expect(frames[0]!.runningAggregate).toBe(0);
    expect(frames[32]!.runningAggregate).toBe(56);
    expect(frames[32]!.finalAggregate).toBe(56);
  });

  it('returns 0 when any evaluated blueprint produces 0 geodes', () => {
    expect(solver.solve([makeBp(1, 2, 2), makeBp(2, 10, 99)])).toBe(0);
  });

  it('produces bounded geode-product trace frames with default cap and explicit maxSteps', () => {
    const bps = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace!(bps);
    expect(full).toHaveLength(DEFAULT_TRACE_MAX_STEPS);
    expect(full[0]!.mode).toBe('geode-product');
    expect(full[0]!.timeLimit).toBe(32);
    expect(full[0]!.activeSnapshot.minute).toBe(0);
    expect(full[0]!.runningAggregate).toBe(0);
    const last = full[full.length - 1]!;
    expect(last.activeBlueprintIndex).toBe(1);
    expect(last.activeSnapshot.minute).toBe(32);
    expect(last.runningAggregate).toBe(3472);
    expect(last.finalAggregate).toBe(3472);
    const sampled = solver.trace!(bps, { maxSteps: 10 });
    expect(sampled).toHaveLength(10);
    expect(sampled[9]!.finalAggregate).toBe(3472);
  });

  it('rejects empty input with SyntaxError', () => {
    expect(() => solver.parse('   ')).toThrow(SyntaxError);
  });

  it('rejects malformed blueprint text with SyntaxError', () => {
    expect(() => solver.parse('not a blueprint')).toThrow(SyntaxError);
  });

  it('rejects duplicate blueprint IDs with RangeError', () => {
    const dup = `${OFFICIAL_EXAMPLE}\nBlueprint 1: Each ore robot costs 2 ore. Each clay robot costs 2 ore. Each obsidian robot costs 2 ore and 2 clay. Each geode robot costs 2 ore and 2 obsidian.`;
    expect(() => solver.parse(dup)).toThrow(RangeError);
  });

  it('rejects empty blueprint list in trace with RangeError', () => {
    expect(() => solver.trace!([])).toThrow(RangeError);
  });
});
