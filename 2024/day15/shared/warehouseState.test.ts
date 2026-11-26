import { describe, expect, it } from 'vitest';
import {
  TILE_BOX,
  TILE_BOX_LEFT,
  TILE_BOX_RIGHT,
  TILE_EMPTY,
  TILE_ROBOT,
  TILE_WALL,
  WarehouseSnapshot,
  WarehouseState,
} from './warehouseState';

describe('WarehouseState.fromRows', () => {
  it('builds Part 1 and Part 2 grids and computes dynamic gpsSum and boxCount', () => {
    const state = WarehouseState.fromRows(['######', '#@O[]#', '######']);
    expect(state.width).toBe(6);
    expect(state.height).toBe(3);
    expect(state.robotRow).toBe(1);
    expect(state.robotCol).toBe(1);
    expect(state.cellAt(1, 1)).toBe(TILE_ROBOT);
    expect(state.cellAt(1, 2)).toBe(TILE_BOX);
    expect(state.cellAt(1, 3)).toBe(TILE_BOX_LEFT);
    expect(state.cellAt(1, 4)).toBe(TILE_BOX_RIGHT);
    expect(state.gpsSum).toBe((100 + 2) + (100 + 3));

    const snap = state.snapshot();
    expect(snap).toBeInstanceOf(WarehouseSnapshot);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(snap.boxCount).toBe(2);
    expect(snap.gpsSum).toBe(205);
    expect(snap.toAsciiRows()).toEqual(['######', '#@O[]#', '######']);
  });

  it('rejects empty, ragged, invalid-char, and wrong-robot-count grids', () => {
    expect(() => WarehouseState.fromRows([])).toThrow(/non-empty/i);
    expect(() => WarehouseState.fromRows([''])).toThrow(/non-empty/i);
    expect(() => WarehouseState.fromRows(['###', '#@'])).toThrow(/rectangular/i);
    expect(() => WarehouseState.fromRows(['###', '#@?', '###'])).toThrow(/invalid tile/i);
    expect(() => WarehouseState.fromRows(['###', '#.#', '###'])).toThrow(/exactly one robot/i);
    expect(() => WarehouseState.fromRows(['###', '@@#', '###'])).toThrow(/exactly one robot/i);
  });

  it('enforces paired wide-box brackets []', () => {
    expect(() => WarehouseState.fromRows(['#####', '#@[.#', '#####'])).toThrow(/unpaired/i);
    expect(() => WarehouseState.fromRows(['###', '#@[', '###'])).toThrow(/unpaired/i);
    expect(() => WarehouseState.fromRows(['####', '#@]#', '####'])).toThrow(/unpaired/i);
    expect(() => WarehouseState.fromRows(['###', ']@#', '###'])).toThrow(/unpaired/i);
  });
});

describe('WarehouseState bounds & mutation', () => {
  it('returns TILE_WALL for out-of-bounds cellAt queries on state and snapshot', () => {
    const state = WarehouseState.fromRows(['###', '#@#', '###']);
    const snap = state.snapshot();
    const oob: ReadonlyArray<readonly [number, number]> = [
      [-1, 0], [3, 0], [0, -1], [0, 3], [0.5, 0], [0, 1.5],
    ];
    for (const [r, c] of oob) {
      expect(state.cellAt(r, c)).toBe(TILE_WALL);
      expect(snap.cellAt(r, c)).toBe(TILE_WALL);
    }
    expect(snap.cellAt(0, 0)).toBe(TILE_WALL);
    expect(snap.cellAt(1, 1)).toBe(TILE_ROBOT);
  });

  it('validates coordinates and robot collision in setTile', () => {
    const state = WarehouseState.fromRows(['####', '#@.#', '####']);
    state.setTile(1, 2, TILE_BOX);
    expect(state.cellAt(1, 2)).toBe(TILE_BOX);
    state.setTile(1, 2, TILE_EMPTY);
    expect(state.cellAt(1, 2)).toBe(TILE_EMPTY);

    const invalid: ReadonlyArray<readonly [number, number]> = [
      [-1, 0], [3, 0], [0, -1], [0, 4], [0.5, 0], [0, 0.5],
    ];
    for (const [r, c] of invalid) {
      expect(() => state.setTile(r, c, TILE_EMPTY)).toThrow(RangeError);
    }
    expect(() => state.setTile(1, 1, TILE_EMPTY)).toThrow(/robot/i);
  });

  it('moves robot safely, supports same-cell move, rejects walls/OOB, and keeps snapshots isolated', () => {
    const state = WarehouseState.fromRows(['####', '#@.#', '####']);
    const before = state.snapshot();

    state.moveRobotTo(1, 1);
    expect(state.cellAt(1, 1)).toBe(TILE_ROBOT);

    state.moveRobotTo(1, 2);
    expect(state.robotRow).toBe(1);
    expect(state.robotCol).toBe(2);
    expect(state.cellAt(1, 1)).toBe(TILE_EMPTY);
    expect(state.cellAt(1, 2)).toBe(TILE_ROBOT);
    expect(before.robotCol).toBe(1);
    expect(before.cellAt(1, 1)).toBe(TILE_ROBOT);

    expect(() => state.moveRobotTo(0, 1)).toThrow(/wall/i);
    expect(() => state.moveRobotTo(-1, 1)).toThrow(RangeError);
  });
});
