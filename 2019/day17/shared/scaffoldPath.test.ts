import { describe, expect, it } from 'vitest';
import { ScaffoldMap } from './scaffoldMap';
import { traceScaffoldPath } from './scaffoldPath';

const CROSSING_TRACK = [
  '..###..',
  '..#.#..',
  '#######',
  '#.#...#',
  '###^..#',
].join('\n');

describe('traceScaffoldPath', () => {
  it('traces straight across intersections and turns at corners until dead end', () => {
    const map = ScaffoldMap.fromAscii(CROSSING_TRACK);
    const path = traceScaffoldPath(map);
    expect(path.start).toEqual({ x: 3, y: 4, direction: 'U' });
    expect(path.tokens).toEqual(['L', '3', 'R', '2', 'R', '6', 'R', '2']);
    expect(path.waypoints).toHaveLength(1 + 3 + 2 + 6 + 2);
    expect(path.waypoints[0]).toEqual({ x: 3, y: 4 });
    expect(path.waypoints[path.waypoints.length - 1]).toEqual({ x: 6, y: 4 });
  });

  it('handles initial U-turn when robot starts facing away from the scaffold', () => {
    const map = ScaffoldMap.fromAscii('<##\n..#');
    const path = traceScaffoldPath(map);
    expect(path.tokens).toEqual(['R', 'R', '2', 'R', '1']);
    expect(path.waypoints).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ]);
  });

  it('handles an isolated robot with no outgoing scaffold and rejects missing robot', () => {
    const solo = ScaffoldMap.fromAscii('^');
    const path = traceScaffoldPath(solo);
    expect(path.tokens).toEqual([]);
    expect(path.waypoints).toEqual([{ x: 0, y: 0 }]);

    const noRobot = ScaffoldMap.fromAscii('###');
    expect(() => traceScaffoldPath(noRobot)).toThrow('no live robot');
  });

  it('detects cycles in closed scaffold loops', () => {
    const cycleMap = ScaffoldMap.fromAscii('###\n#.#\n^##');
    expect(() => traceScaffoldPath(cycleMap)).toThrow('Cycle detected');
  });
});
