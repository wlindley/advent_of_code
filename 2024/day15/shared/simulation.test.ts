import { describe, expect, it } from 'vitest';
import { MOVE_DELTAS, type MoveDir, type WarehouseSpec } from './parse';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type WarehouseRule,
  buildWarehouseTrace,
  createWarehouseSolver,
  runWarehouseSimulation,
} from './simulation';
import { TILE_WALL, WarehouseState } from './warehouseState';

const dummyStepRule: WarehouseRule = {
  buildInitialState: (spec) => WarehouseState.fromRows(spec.rows),
  step: (state, move) => {
    const [dr, dc] = MOVE_DELTAS[move];
    const nr = state.robotRow + dr;
    const nc = state.robotCol + dc;
    if (state.cellAt(nr, nc) === TILE_WALL) return false;
    state.moveRobotTo(nr, nc);
    return true;
  },
};

describe('runWarehouseSimulation', () => {
  it('runs zero or more moves and returns the final snapshot', () => {
    const emptySpec: WarehouseSpec = { rows: ['####', '#@O#', '####'], moves: [] };
    const snap0 = runWarehouseSimulation(emptySpec, dummyStepRule);
    expect(snap0.robotRow).toBe(1);
    expect(snap0.robotCol).toBe(1);
    expect(snap0.gpsSum).toBe(102);

    const spec: WarehouseSpec = { rows: ['#####', '#@..#', '#####'], moves: ['>', '^', '>'] };
    const snap1 = runWarehouseSimulation(spec, dummyStepRule);
    expect(snap1.robotRow).toBe(1);
    expect(snap1.robotCol).toBe(3);
  });
});

describe('buildWarehouseTrace', () => {
  it('emits initial frame when moves are empty and full frames within maxSteps', () => {
    const spec0: WarehouseSpec = { rows: ['###', '#@#', '###'], moves: [] };
    const trace0 = buildWarehouseTrace(spec0, dummyStepRule);
    expect(trace0).toHaveLength(1);
    const frame0 = trace0[0]!;
    expect(frame0.step).toBe(0);
    expect(frame0.totalMoves).toBe(0);
    expect(frame0.move).toBeNull();
    expect(frame0.moved).toBe(false);
    expect(Object.isFrozen(trace0)).toBe(true);
    expect(Object.isFrozen(frame0)).toBe(true);

    const spec: WarehouseSpec = { rows: ['#####', '#@..#', '#####'], moves: ['>', '^', '>'] };
    const trace = buildWarehouseTrace(spec, dummyStepRule);
    expect(trace.map((f) => [f.step, f.move, f.moved, f.snapshot.robotCol])).toEqual([
      [0, null, false, 1],
      [1, '>', true, 2],
      [2, '^', false, 2],
      [3, '>', true, 3],
    ]);
  });

  it('downsamples long traces while preserving endpoints and handles maxSteps: 1', () => {
    const moves = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? '>' : '<')) as MoveDir[];
    const spec: WarehouseSpec = { rows: ['#####', '#@..#', '#####'], moves };
    const sampled = buildWarehouseTrace(spec, dummyStepRule, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.step).toBe(0);
    expect(sampled[sampled.length - 1]!.step).toBe(10);

    const onlyFinal = buildWarehouseTrace(spec, dummyStepRule, { maxSteps: 1 });
    expect(onlyFinal).toHaveLength(1);
    expect(onlyFinal[0]!.step).toBe(10);
    expect(onlyFinal[0]!.move).toBe('<');
  });

  it('rejects invalid maxSteps values', () => {
    const spec: WarehouseSpec = { rows: ['###', '#@#', '###'], moves: ['^'] };
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);
    expect(() => buildWarehouseTrace(spec, dummyStepRule, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildWarehouseTrace(spec, dummyStepRule, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => buildWarehouseTrace(spec, dummyStepRule, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});

describe('createWarehouseSolver', () => {
  it('wires parse, solve, and trace using the provided rule', () => {
    const solver = createWarehouseSolver(dummyStepRule);
    const raw = '######\n#@..O#\n######\n\n>>';
    const parsed = solver.parse(raw);
    expect(solver.solve(parsed)).toBe(104);
    const trace = solver.trace?.(parsed, { maxSteps: 2 });
    expect(trace?.map((f) => f.step)).toEqual([0, 2]);
  });
});
