import { describe, expect, it } from 'vitest';
import {
  DIRECTION_DELTAS,
  ScaffoldMap,
  turnBack,
  turnLeft,
  turnRight,
  type Direction,
} from './scaffoldMap';

const SAMPLE_MAP = [
  '..#..........',
  '..#..........',
  '#######...###',
  '#.#...#...#.#',
  '#############',
  '..#...#...#..',
  '..#####...^..',
].join('\n');

describe('direction helpers', () => {
  it('rotates left, right, and back across all four cardinal directions', () => {
    const dirs: readonly Direction[] = ['U', 'R', 'D', 'L'];
    expect(dirs.map(turnLeft)).toEqual(['L', 'U', 'R', 'D']);
    expect(dirs.map(turnRight)).toEqual(['R', 'D', 'L', 'U']);
    expect(dirs.map(turnBack)).toEqual(['D', 'L', 'U', 'R']);
    expect(DIRECTION_DELTAS.U).toEqual({ x: 0, y: -1 });
    expect(DIRECTION_DELTAS.R).toEqual({ x: 1, y: 0 });
    expect(DIRECTION_DELTAS.D).toEqual({ x: 0, y: 1 });
    expect(DIRECTION_DELTAS.L).toEqual({ x: -1, y: 0 });
  });
});

describe('ScaffoldMap', () => {
  it('parses the official example ASCII grid and computes intersections and alignment sum', () => {
    const map = ScaffoldMap.fromAscii(`${SAMPLE_MAP}\n\n`);
    expect(map.width).toBe(13);
    expect(map.height).toBe(7);
    expect(map.robot).toEqual({ x: 10, y: 6, direction: 'U' });
    expect(map.intersections).toEqual([
      { x: 2, y: 2 },
      { x: 2, y: 4 },
      { x: 6, y: 4 },
      { x: 10, y: 4 },
    ]);
    expect(map.alignmentParameterSum).toBe(76n);
    expect(map.scaffoldCount).toBe(39);
    expect(map.cellAt(0, 0)).toBe('.');
    expect(map.cellAt(10, 6)).toBe('^');
    expect(map.isScaffold(10, 6)).toBe(true);
    expect(map.isScaffold(0, 0)).toBe(false);
    expect(map.isScaffold(-1, 0)).toBe(false);
    expect(map.isScaffold(13, 0)).toBe(false);
    expect(map.isScaffold(0, -1)).toBe(false);
    expect(map.isScaffold(0, 7)).toBe(false);
    expect(() => map.cellAt(-1, 0)).toThrow(RangeError);
    expect(() => map.cellAt(0, 7)).toThrow(RangeError);
  });

  it('recognizes all robot orientations and dead/absent robots', () => {
    expect(ScaffoldMap.fromAscii('>#').robot).toEqual({ x: 0, y: 0, direction: 'R' });
    expect(ScaffoldMap.fromAscii('v#').robot).toEqual({ x: 0, y: 0, direction: 'D' });
    expect(ScaffoldMap.fromAscii('<#').robot).toEqual({ x: 0, y: 0, direction: 'L' });
    const fallen = ScaffoldMap.fromAscii('X#');
    expect(fallen.robot).toBeNull();
    expect(fallen.isScaffold(0, 0)).toBe(false);
    expect(fallen.isScaffold(1, 0)).toBe(true);
  });

  it('rejects empty, blank-interior, ragged, unknown-character, and multi-robot grids', () => {
    expect(() => ScaffoldMap.fromAscii('\n\n')).toThrow('empty');
    expect(() => ScaffoldMap.fromAscii('#\n\n#')).toThrow('blank');
    expect(() => ScaffoldMap.fromAscii('##\n#')).toThrow('ragged');
    expect(() => ScaffoldMap.fromAscii('#?\n##')).toThrow('Unknown scaffold');
    expect(() => ScaffoldMap.fromAscii('^\nv')).toThrow('Multiple robots');
  });
});
