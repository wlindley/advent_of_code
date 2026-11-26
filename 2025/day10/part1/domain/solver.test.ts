import { describe, expect, it } from 'vitest';
import { bitCount } from '../../../../shared/core';
import { FactoryMachine, parseMachines } from '../../shared';
import {
  buildLightSystem, DEFAULT_MAX_TRACE_STEPS, solveFactoryLights,
  solveMachine, solver, traceFactoryLights,
} from './index';

const EXAMPLE = [
  '[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}',
  '[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}',
  '[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}',
].join('\n');

function bfsMinPresses(machine: FactoryMachine): number | null {
  const target = Number(machine.targetMask);
  const masks = machine.buttonMasks.map(Number);
  const dist = new Int32Array(1 << machine.lightCount).fill(-1);
  dist[0] = 0;
  const queue = [0];
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head]!;
    if (cur === target) return dist[cur]!;
    for (const bm of masks) {
      const nxt = cur ^ bm;
      if (dist[nxt] === -1) { dist[nxt] = dist[cur]! + 1; queue.push(nxt); }
    }
  }
  return null;
}

describe('day10 part1 domain solver', () => {
  it('solves the 3 official example machines (2 + 3 + 2 = 7)', () => {
    const machines = solver.parse(EXAMPLE);
    expect(machines.map((m, i) => bitCount(solveMachine(m, i).pressMask))).toEqual([2, 3, 2]);
    expect(solver.solve(machines)).toBe(7);
    expect(buildLightSystem(machines[0]!).equationCount).toBe(4);
  });

  it('handles all-off target (0 presses), empty machine list, and unreachable target', () => {
    expect(solveFactoryLights(parseMachines('[....] (0,1) (2,3) {0,0,0,0}'))).toBe(0);
    expect(solveFactoryLights([])).toBe(0);
    expect(traceFactoryLights([])).toEqual([]);
    expect(() => solveMachine(new FactoryMachine([true, false], [[0, 1]], [0, 0]))).toThrow(Error);
  });

  it('produces bounded trace frames and validates maxSteps', () => {
    const many = Array.from({ length: 10 }, () => parseMachines('[.#] (0) (1) {0,0}')[0]!);
    const full = solver.trace!(many);
    expect(full).toHaveLength(10);
    expect(full.slice(0, 9).every((f) => !f.isComplete)).toBe(true);
    expect([full[9]!.isComplete, full[9]!.cumulativePresses, full[9]!.totalMachines]).toEqual([true, 10, 10]);
    const one = traceFactoryLights(many, { maxSteps: 1 });
    expect([one.length, one[0]!.machineIndex, one[0]!.isComplete, one[0]!.cumulativePresses]).toEqual([1, 9, true, 10]);
    const sampled = traceFactoryLights(many, { maxSteps: 4 });
    expect(sampled.map((f) => f.machineIndex)).toEqual([0, 3, 6, 9]);
    expect(sampled[3]!.isComplete).toBe(true);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(() => traceFactoryLights(many, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceFactoryLights(many, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceFactoryLights(many, { maxSteps: 2.5 })).toThrow(RangeError);
  });

  it('matches an independent state-space BFS oracle across 50 seeded random machines', () => {
    let seed = 0x5eed2025;
    const nextInt = (n: number) => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) % n);
    for (let t = 0; t < 50; t += 1) {
      const L = 3 + nextInt(6);
      const B = 2 + nextInt(9);
      const lights = Array.from({ length: L }, () => nextInt(2) === 1);
      const buttons = Array.from({ length: B }, () => {
        const mask = 1 + nextInt((1 << L) - 1);
        return Array.from({ length: L }, (_, l) => l).filter((l) => (mask & (1 << l)) !== 0);
      });
      const m = new FactoryMachine(lights, buttons, Array<number>(L).fill(0));
      const expected = bfsMinPresses(m);
      if (expected === null) expect(() => solveMachine(m, t)).toThrow(Error);
      else {
        const sol = solveMachine(m, t);
        expect(bitCount(sol.pressMask)).toBe(expected);
        const lit = m.buttonMasks.reduce((acc, bm, b) => ((sol.pressMask & (1n << BigInt(b))) !== 0n ? acc ^ bm : acc), 0n);
        expect(lit).toBe(m.targetMask);
      }
    }
  });
});
