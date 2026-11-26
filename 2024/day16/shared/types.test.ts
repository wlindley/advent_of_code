import { describe, expect, it } from 'vitest';
import {
  DIR_DELTAS,
  DIR_EAST,
  DIR_NORTH,
  DIR_SOUTH,
  DIR_WEST,
  oppositeDir,
  ReindeerMaze,
  STEP_COST,
  TURN_COST,
  turnCcw,
  turnCw,
} from './types';

describe('types & direction helpers', () => {
  it('defines orthogonal deltas and cost constants', () => {
    expect(DIR_DELTAS).toEqual([
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]);
    expect(STEP_COST).toBe(1);
    expect(TURN_COST).toBe(1000);
  });

  it('rotates clockwise, counter-clockwise, and reverses directions', () => {
    expect(turnCw(DIR_NORTH)).toBe(DIR_EAST);
    expect(turnCw(DIR_EAST)).toBe(DIR_SOUTH);
    expect(turnCw(DIR_SOUTH)).toBe(DIR_WEST);
    expect(turnCw(DIR_WEST)).toBe(DIR_NORTH);

    expect(turnCcw(DIR_NORTH)).toBe(DIR_WEST);
    expect(turnCcw(DIR_WEST)).toBe(DIR_SOUTH);
    expect(turnCcw(DIR_SOUTH)).toBe(DIR_EAST);
    expect(turnCcw(DIR_EAST)).toBe(DIR_NORTH);

    expect(oppositeDir(DIR_NORTH)).toBe(DIR_SOUTH);
    expect(oppositeDir(DIR_EAST)).toBe(DIR_WEST);
    expect(oppositeDir(DIR_SOUTH)).toBe(DIR_NORTH);
    expect(oppositeDir(DIR_WEST)).toBe(DIR_EAST);
  });
});

describe('ReindeerMaze', () => {
  it('exposes dimensions, coordinates, wall lookups, and valid neighbors', () => {
    // 3x3 maze: center (1,1) is wall, S=(1,0), E=(1,2)
    const walls = new Uint8Array([
      0, 0, 1,
      0, 1, 0,
      0, 0, 0,
    ]);
    const maze = new ReindeerMaze(3, 3, walls, 3, 5);
    walls[0] = 1; // external mutation must not affect maze

    expect(Object.isFrozen(maze)).toBe(true);
    expect(maze.width).toBe(3);
    expect(maze.height).toBe(3);
    expect(maze.cellCount).toBe(9);
    expect(maze.startCell).toBe(3);
    expect(maze.endCell).toBe(5);
    expect(maze.cellIndex(2, 1)).toBe(7);
    expect(maze.rowOf(5)).toBe(1);
    expect(maze.colOf(5)).toBe(2);
    expect(maze.isWallCell(0)).toBe(false);
    expect(maze.isWallCell(4)).toBe(true);
    expect(maze.isWall(0, 2)).toBe(true);
    expect(maze.isWall(2, 2)).toBe(false);

    expect(maze.neighborCell(3, DIR_NORTH)).toBe(0);
    expect(maze.neighborCell(3, DIR_SOUTH)).toBe(6);
    expect(maze.neighborCell(3, DIR_WEST)).toBe(-1); // OOB west
    expect(maze.neighborCell(3, DIR_EAST)).toBe(-1); // wall at (1,1)
    expect(maze.neighborCell(0, DIR_NORTH)).toBe(-1); // OOB north
    expect(maze.neighborCell(8, DIR_SOUTH)).toBe(-1); // OOB south
    expect(maze.neighborCell(5, DIR_EAST)).toBe(-1); // OOB east
    expect(maze.neighborCell(5, DIR_NORTH)).toBe(-1); // wall at (0,2)
  });

  it('rejects invalid dimensions, walls length, start/end cells, and out-of-bounds queries', () => {
    const valid = new Uint8Array([0, 0, 0, 1]);
    expect(() => new ReindeerMaze(0, 2, valid, 0, 1)).toThrow(RangeError);
    expect(() => new ReindeerMaze(2, 0, valid, 0, 1)).toThrow(RangeError);
    expect(() => new ReindeerMaze(2.5, 2, valid, 0, 1)).toThrow(RangeError);
    expect(() => new ReindeerMaze(2, 2, new Uint8Array(3), 0, 1)).toThrow(RangeError);
    expect(() => new ReindeerMaze(2, 2, valid, -1, 1)).toThrow(RangeError);
    expect(() => new ReindeerMaze(2, 2, valid, 0, 4)).toThrow(RangeError);
    expect(() => new ReindeerMaze(2, 2, valid, 1, 1)).toThrow(RangeError);
    expect(() => new ReindeerMaze(2, 2, valid, 3, 1)).toThrow(RangeError);
    expect(() => new ReindeerMaze(2, 2, valid, 0, 3)).toThrow(RangeError);

    const maze = new ReindeerMaze(2, 2, valid, 0, 1);
    expect(() => maze.cellIndex(-1, 0)).toThrow(RangeError);
    expect(() => maze.cellIndex(0, 2)).toThrow(RangeError);
    expect(() => maze.cellIndex(1.5, 0)).toThrow(RangeError);
    expect(() => maze.rowOf(-1)).toThrow(RangeError);
    expect(() => maze.colOf(4)).toThrow(RangeError);
    expect(() => maze.isWallCell(1.5)).toThrow(RangeError);
  });
});
