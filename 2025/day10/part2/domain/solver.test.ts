import { describe, expect, it } from 'vitest';
import { FactoryMachine, parseMachines } from '../../shared';
import { solveFactoryJoltages, solveMachineJoltage, solver, tightenBounds, totalPresses, traceFactoryJoltages } from './index';

const OFFICIAL = [
  '[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}',
  '[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}',
  '[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}',
].join('\n');
const mk = (buttons: number[][], joltages: number[]) => new FactoryMachine(joltages.map(() => false), buttons, joltages);

describe('Day 10 Part 2 solver', () => {
  it('solves the official three-machine example (10 + 12 + 11 = 33)', () => {
    const machines = solver.parse(OFFICIAL);
    expect(machines.map((m, i) => totalPresses(solveMachineJoltage(m, i).presses))).toEqual([10, 12, 11]);
    expect(solver.solve(machines)).toBe(33);
    expect(solveFactoryJoltages([])).toBe(0);
  });

  it('handles nullity=0 feasible, fractional/negative infeasible, and Q-inconsistent machines', () => {
    const ok = solveMachineJoltage(mk([[0], [1]], [2, 5]));
    expect(ok.presses).toEqual([2, 5]);
    expect(Object.isFrozen(ok)).toBe(true);
    expect(() => solveMachineJoltage(mk([[0, 1], [0, 2], [1, 2]], [2, 1, 2]))).toThrow(Error);
    expect(() => solveMachineJoltage(mk([[0], [0, 1]], [1, 3]))).toThrow(Error);
    expect(() => solveMachineJoltage(mk([[0, 1]], [2, 5]))).toThrow(Error);
  });

  it('handles nullity=1 scans (w<0 with mod-skip, w>0, w===0), leaf failure, and tightenBounds zero coeff', () => {
    expect(tightenBounds(0n, 5n, 0n, -1n)).toEqual([1n, 0n]);
    expect(tightenBounds(0n, 5n, 0n, 2n)).toEqual([0n, 5n]);
    expect(totalPresses(solveMachineJoltage(mk([[0, 1], [0, 2], [1, 2], [0, 1, 2]], [6, 5, 5])).presses)).toBe(6);
    expect(totalPresses(solveMachineJoltage(mk([[0, 1], [0, 2], [1, 2], [0]], [5, 5, 5])).presses)).toBe(8);
    expect(totalPresses(solveMachineJoltage(mk([[0], [0, 1], [1, 2], [2]], [1, 4, 4])).presses)).toBe(5);
    expect(totalPresses(solveMachineJoltage(mk([[0], [0, 1], [1, 2], [2, 3], [3]], [1, 3, 3, 1])).presses)).toBe(4);
    expect(() => solveMachineJoltage(mk([[0, 1], [0, 2], [1, 2], [0, 1, 2]], [1, 0, 0]))).toThrow(Error);
  });

  it('handles nullity 2 & 3 with negative pivot coeffs, incumbent pruning, and zero targets', () => {
    expect(totalPresses(solveMachineJoltage(mk([[0], [0, 1], [1, 2], [2, 3], [3], [0, 3]], [2, 5, 5, 2])).presses)).toBe(7);
    expect(totalPresses(solveMachineJoltage(mk([[0], [1], [0, 1], [0, 2], [1, 2], [2]], [4, 5, 6])).presses)).toBe(8);
    expect(solveMachineJoltage(mk([[0, 1], [1]], [0, 0])).presses).toEqual([0, 0]);
    expect(solveMachineJoltage(mk([[0, 1], [1]], [0, 3])).presses).toEqual([0, 3]);
  });

  it('traces machines with downsampling and validates maxSteps', () => {
    const machines = parseMachines(OFFICIAL);
    expect(traceFactoryJoltages([])).toEqual([]);
    expect(traceFactoryJoltages(machines).map((f) => [f.machineIndex, f.cumulativePresses, f.isComplete])).toEqual([[0, 10, false], [1, 22, false], [2, 33, true]]);
    expect(traceFactoryJoltages(machines, { maxSteps: 1 }).map((f) => f.cumulativePresses)).toEqual([33]);
    expect(traceFactoryJoltages(machines, { maxSteps: 2 }).map((f) => f.machineIndex)).toEqual([0, 2]);
    expect(() => traceFactoryJoltages(machines, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceFactoryJoltages(machines, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
