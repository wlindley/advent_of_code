import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { EXAMPLE_RAM_RUN_CONFIG, MemorySpace, parseMemorySpace } from '../../shared';
import { createRamRunPart1Solver, solvePart1, solver } from './index';

const EXAMPLE_INPUT = [
  '5,4', '4,2', '4,5', '3,0', '2,1',
  '6,3', '2,4', '1,5', '0,6', '3,3',
  '2,6', '5,1', '1,2', '5,5', '2,5',
  '6,5', '1,4', '0,4', '6,4', '1,1',
  '6,1', '1,0', '0,5', '1,6', '2,0',
].join('\n');

describe('solvePart1', () => {
  it('computes shortest distance on reachable grids and throws when blocked', () => {
    const example = parseMemorySpace(EXAMPLE_INPUT, 7);
    expect(solvePart1(example, 12)).toBe(22);

    const blocked = new MemorySpace(3, [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(() => solvePart1(blocked, 3)).toThrow(Error);
  });
});

describe('createRamRunPart1Solver & default solver', () => {
  it('validates config bounds', () => {
    expect(() => createRamRunPart1Solver({ gridSize: 0, fallenCount: 1 })).toThrow(RangeError);
    expect(() => createRamRunPart1Solver({ gridSize: 1.5, fallenCount: 1 })).toThrow(RangeError);
    expect(() => createRamRunPart1Solver({ gridSize: 7, fallenCount: -1 })).toThrow(RangeError);
  });

  it('runs example solver and default 71x71 solver via executeSolver with trace', () => {
    const exampleSolver = createRamRunPart1Solver(EXAMPLE_RAM_RUN_CONFIG);
    const exRun = executeSolver(exampleSolver, EXAMPLE_INPUT);
    expect(exRun.answer).toBe(22);

    const exParsed = exampleSolver.parse(EXAMPLE_INPUT);
    const exTrace = exampleSolver.trace!(exParsed, { maxSteps: 20 });
    expect(exTrace.length).toBeGreaterThan(1);
    expect(exTrace.length).toBeLessThanOrEqual(20);
    expect(exTrace[exTrace.length - 1]!.shortestDistance).toBe(22);

    const defaultRun = executeSolver(solver, '1,0\n0,2\n');
    expect(defaultRun.answer).toBe(140);
    const defaultParsed = solver.parse('1,0\n0,2\n');
    const defaultTrace = solver.trace!(defaultParsed, { maxSteps: 5 });
    expect(defaultTrace[defaultTrace.length - 1]!.memory.gridSize).toBe(71);
  });
});
