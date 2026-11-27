import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_MOVES,
  DEFAULT_MAX_VM_STEPS,
  DEFAULT_OXYGEN_LIMITS,
  MOVE_COMMANDS,
  ORIGIN,
  ShipBounds,
  ShipMap,
  computeShipBounds,
  oppositeCommand,
  parseDroidStatus,
  pointKey,
  stepPoint,
  validateOxygenLimits,
  type ShipTile,
} from './oxygenModels';

describe('oxygenModels helpers and constants', () => {
  it('exposes frozen origin, movement commands, and default limits', () => {
    expect(ORIGIN).toEqual({ x: 0, y: 0 });
    expect(Object.isFrozen(ORIGIN)).toBe(true);
    expect(MOVE_COMMANDS).toEqual([1, 2, 3, 4]);
    expect(DEFAULT_OXYGEN_LIMITS).toEqual({
      maxVmSteps: DEFAULT_MAX_VM_STEPS,
      maxMoves: DEFAULT_MAX_MOVES,
    });
    expect(pointKey(-3, 7)).toBe('-3,7');
  });

  it('steps coordinates and computes opposite commands for all four directions', () => {
    expect(stepPoint(ORIGIN, 1)).toEqual({ x: 0, y: -1 });
    expect(stepPoint(ORIGIN, 2)).toEqual({ x: 0, y: 1 });
    expect(stepPoint(ORIGIN, 3)).toEqual({ x: -1, y: 0 });
    expect(stepPoint(ORIGIN, 4)).toEqual({ x: 1, y: 0 });

    expect(oppositeCommand(1)).toBe(2);
    expect(oppositeCommand(2)).toBe(1);
    expect(oppositeCommand(3)).toBe(4);
    expect(oppositeCommand(4)).toBe(3);
  });

  it('parses valid droid statuses and rejects out-of-range outputs', () => {
    expect(parseDroidStatus(0n)).toBe(0);
    expect(parseDroidStatus(1n)).toBe(1);
    expect(parseDroidStatus(2n)).toBe(2);
    expect(() => parseDroidStatus(-1n)).toThrow(RangeError);
    expect(() => parseDroidStatus(3n)).toThrow(RangeError);
  });

  it('validates positive safe integer execution limits', () => {
    const custom = validateOxygenLimits({ maxVmSteps: 100, maxMoves: 25 });
    expect(custom).toEqual({ maxVmSteps: 100, maxMoves: 25 });
    expect(Object.isFrozen(custom)).toBe(true);

    expect(() => validateOxygenLimits({ maxVmSteps: 0, maxMoves: 10 })).toThrow(RangeError);
    expect(() => validateOxygenLimits({ maxVmSteps: 1.5, maxMoves: 10 })).toThrow(RangeError);
    expect(() => validateOxygenLimits({ maxVmSteps: Number.MAX_SAFE_INTEGER + 1, maxMoves: 10 })).toThrow(RangeError);
    expect(() => validateOxygenLimits({ maxVmSteps: 10, maxMoves: 0 })).toThrow(RangeError);
    expect(() => validateOxygenLimits({ maxVmSteps: 10, maxMoves: 2.5 })).toThrow(RangeError);
    expect(() => validateOxygenLimits({ maxVmSteps: 10, maxMoves: Number.MAX_SAFE_INTEGER + 1 })).toThrow(RangeError);
  });
});

describe('ShipBounds and ShipMap', () => {
  it('computes dynamic bounds from tiles and handles empty maps', () => {
    const empty = computeShipBounds(new Map());
    expect(empty.width).toBe(1);
    expect(empty.height).toBe(1);
    expect(Object.isFrozen(empty)).toBe(true);

    const expanded = ShipBounds.empty().expand(-2, 3).expand(4, -1);
    expect(expanded.minX).toBe(-2);
    expect(expanded.maxX).toBe(4);
    expect(expanded.minY).toBe(-1);
    expect(expanded.maxY).toBe(3);
    expect(expanded.width).toBe(7);
    expect(expanded.height).toBe(5);
  });

  it('derives bounds, counts, tile lookup, and traversability dynamically', () => {
    const tiles = new Map<string, ShipTile>([
      ['0,0', { x: 0, y: 0, kind: 'open' }],
      ['1,0', { x: 1, y: 0, kind: 'oxygen' }],
      ['-1,0', { x: -1, y: 0, kind: 'wall' }],
      ['0,1', { x: 0, y: 1, kind: 'wall' }],
    ]);
    const map = new ShipMap(tiles, ORIGIN, { x: 1, y: 0 }, 5, 42);

    expect(Object.isFrozen(map)).toBe(true);
    expect(map.openCount).toBe(2);
    expect(map.wallCount).toBe(2);
    expect(map.bounds.width).toBe(3);
    expect(map.bounds.height).toBe(2);
    expect(map.tileAt(0, 0)).toBe('open');
    expect(map.tileAt(1, 0)).toBe('oxygen');
    expect(map.tileAt(-1, 0)).toBe('wall');
    expect(map.tileAt(9, 9)).toBeNull();
    expect(map.isTraversable(0, 0)).toBe(true);
    expect(map.isTraversable(1, 0)).toBe(true);
    expect(map.isTraversable(-1, 0)).toBe(false);
    expect(map.isTraversable(9, 9)).toBe(false);
  });
});
