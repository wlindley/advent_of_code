import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { MemorySpace, parseMemorySpace } from '../../shared';
import { buildBlockingByteTrace, createRamRunPart2Solver, solvePart2, solver } from './index';

const EXAMPLE_INPUT = [
  '5,4', '4,2', '4,5', '3,0', '2,1',
  '6,3', '2,4', '1,5', '0,6', '3,3',
  '2,6', '5,1', '1,2', '5,5', '2,5',
  '6,5', '1,4', '0,4', '6,4', '1,1',
  '6,1', '1,0', '0,5', '1,6', '2,0',
].join('\n');

function createSteppingFakeClock(ticks: readonly number[]): Clock {
  let i = 0;
  return { nowMs: () => ticks[Math.min(i++, ticks.length - 1)]! };
}

describe('solvePart2, createRamRunPart2Solver & default solver', () => {
  it('solves the 7x7 example and throws when exit remains reachable', () => {
    const example = parseMemorySpace(EXAMPLE_INPUT, 7);
    expect(solvePart2(example)).toBe('6,1');
    expect(() => solvePart2(new MemorySpace(3, [{ x: 1, y: 0 }]))).toThrow(Error);
  });

  it('rejects invalid grid sizes', () => {
    for (const invalid of [0, -3, 2.5, Number.NaN]) {
      expect(() => createRamRunPart2Solver(invalid)).toThrow(RangeError);
    }
  });

  it('runs example solver and default 71x71 solver via executeSolver with fake Clock and trace', () => {
    const exampleSolver = createRamRunPart2Solver(7);
    const exRun = executeSolver(exampleSolver, EXAMPLE_INPUT, createSteppingFakeClock([10, 27]));
    expect(exRun).toEqual({ answer: '6,1', elapsedMs: 17, runtime: 'main-thread' });

    const defaultInput = '1,0\n0,1\n2,0\n';
    const defaultRun = executeSolver(solver, defaultInput, createSteppingFakeClock([5, 9]));
    expect(defaultRun).toEqual({ answer: '0,1', elapsedMs: 4, runtime: 'main-thread' });
    const parsedDefault = solver.parse(defaultInput);
    expect(parsedDefault.gridSize).toBe(71);
    const defaultTrace = solver.trace!(parsedDefault, { maxSteps: 2 });
    expect(defaultTrace.map((f) => f.fallenCount)).toEqual([1, 2]);
  });
});

describe('buildBlockingByteTrace', () => {
  it('handles omitted options, maxSteps boundaries, byteIndex === 0, and never-blocked cases', () => {
    const example = parseMemorySpace(EXAMPLE_INPUT, 7);
    const full = buildBlockingByteTrace(example);
    expect(full).toHaveLength(22);
    expect(full[0]!.phase).toBe('corrupting');
    expect(full[0]!.fallenCount).toBe(0);
    expect(full[21]!.phase).toBe('complete');
    expect(full[21]!.fallenCount).toBe(21);
    expect(full[21]!.blockingByte).toEqual({ x: 6, y: 1 });
    expect(full[21]!.reachable).toBe(false);

    const one = buildBlockingByteTrace(example, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.phase).toBe('complete');

    const two = buildBlockingByteTrace(example, { maxSteps: 2 });
    expect(two.map((f) => f.fallenCount)).toEqual([20, 21]);
    expect(two[0]!.reachable).toBe(true);
    expect(two[1]!.reachable).toBe(false);

    const five = buildBlockingByteTrace(example, { maxSteps: 5 });
    expect(five).toHaveLength(5);
    expect(five[0]!.fallenCount).toBe(0);
    expect(five[4]!.fallenCount).toBe(21);

    const immediate = new MemorySpace(3, [{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    expect(buildBlockingByteTrace(immediate, { maxSteps: 2 }).map((f) => f.fallenCount)).toEqual([0, 1]);

    const empty = buildBlockingByteTrace(new MemorySpace(3, []));
    expect(empty).toHaveLength(1);
    expect(empty[0]!.fallenCount).toBe(0);
    expect(empty[0]!.blockingByte).toBeNull();
    expect(empty[0]!.reachable).toBe(true);

    const partial = buildBlockingByteTrace(new MemorySpace(3, [{ x: 1, y: 0 }, { x: 1, y: 1 }]));
    expect(partial.map((f) => f.fallenCount)).toEqual([0, 1, 2]);
    expect(partial[2]!.blockingByte).toBeNull();
    expect(partial[2]!.reachable).toBe(true);

    for (const invalid of [0, -1, 1.5]) {
      expect(() => buildBlockingByteTrace(example, { maxSteps: invalid })).toThrow(RangeError);
    }
  });
});
