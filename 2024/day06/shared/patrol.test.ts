import { describe, expect, it } from 'vitest';
import { parseLabMap } from './labMap';
import { PatrolResult, simulatePatrol } from './patrol';

const EXAMPLE_MAP = [
  '....#.....',
  '.........#',
  '..........',
  '..#.......',
  '.......#..',
  '..........',
  '.#..^.....',
  '........#.',
  '#.........',
  '......#...',
].join('\n');

describe('PatrolResult invariants', () => {
  it('validates mask length, copies mask defensively, and rejects OOB queries', () => {
    const map = parseLabMap('^. \n.. '.replace(/ /g, ''));
    expect(() => new PatrolResult(map, 'exited', new Uint8Array(map.size - 1))).toThrow(RangeError);

    const rawMask = new Uint8Array(map.size);
    rawMask[0] = 1;
    const result = new PatrolResult(map, 'exited', rawMask);
    rawMask[0] = 0;
    rawMask[1] = 2;

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.steps)).toBe(true);
    expect(result.visitedCount).toBe(1);
    expect(result.wasVisited(0, 0)).toBe(true);
    expect(result.wasVisited(0, 1)).toBe(false);
    expect(() => result.wasVisited(-1, 0)).toThrow(RangeError);
  });
});

describe('simulatePatrol', () => {
  it('counts 41 distinct visited positions on the official 10x10 example', () => {
    const map = parseLabMap(EXAMPLE_MAP);
    const result = simulatePatrol(map);
    expect(result.outcome).toBe('exited');
    expect(result.visitedCount).toBe(41);
    expect(result.steps).toEqual([]);
    expect(result.wasVisited(6, 4)).toBe(true);
    expect(result.wasVisited(0, 4)).toBe(false);
  });

  it('handles 1x1 and immediate border exits', () => {
    const single = simulatePatrol(parseLabMap('^'), { recordSteps: true });
    expect(single.outcome).toBe('exited');
    expect(single.visitedCount).toBe(1);
    expect(single.steps).toEqual([{ row: 0, col: 0, dir: 0, action: 'start' }]);

    const edge = simulatePatrol(parseLabMap('..>'));
    expect(edge.outcome).toBe('exited');
    expect(edge.visitedCount).toBe(1);
  });

  it('handles double and triple turn corners without force-stepping after a turn', () => {
    const doubleCorner = parseLabMap(['.#.', '.^#', '...'].join('\n'));
    const twoTurn = simulatePatrol(doubleCorner, { recordSteps: true });
    expect(twoTurn.outcome).toBe('exited');
    expect(twoTurn.visitedCount).toBe(2);
    expect(twoTurn.steps.map((s) => s.action)).toEqual(['start', 'turn', 'turn', 'move']);

    const tripleBox = parseLabMap(['.#.', '#^#', '...'].join('\n'));
    const threeTurn = simulatePatrol(tripleBox, { recordSteps: true });
    expect(threeTurn.outcome).toBe('exited');
    expect(threeTurn.visitedCount).toBe(2);
    expect(threeTurn.steps.map((s) => s.dir)).toEqual([0, 1, 2, 2]);
  });

  it('detects 4-wall in-place loops', () => {
    const boxed = parseLabMap(['.#.', '#^#', '.#.'].join('\n'));
    const res = simulatePatrol(boxed, { recordSteps: true });
    expect(res.outcome).toBe('loop');
    expect(res.visitedCount).toBe(1);
    expect(res.steps.map((s) => s.dir)).toEqual([0, 1, 2, 3]);
  });

  it('allows perpendicular crossing back through the start cell', () => {
    const map = parseLabMap(['..#...', '.....#', '..^...', '....#.'].join('\n'));
    const res = simulatePatrol(map);
    expect(res.outcome).toBe('exited');
    expect(res.visitedCount).toBe(8);
  });

  it('detects 4-obstacle pinwheel loops with and without step recording', () => {
    const pinwheel = parseLabMap(['.#...', '....#', '.^...', '#....', '...#.'].join('\n'));
    const fast = simulatePatrol(pinwheel);
    expect(fast.outcome).toBe('loop');
    expect(fast.visitedCount).toBe(8);
    expect(fast.steps).toEqual([]);

    const traced = simulatePatrol(pinwheel, { recordSteps: true });
    expect(traced.outcome).toBe('loop');
    expect(traced.visitedCount).toBe(8);
    expect(traced.steps.length).toBe(12);
    expect(traced.steps[0]).toEqual({ row: 2, col: 1, dir: 0, action: 'start' });
  });

  it('supports extraObstacle for loops, altered exits, idempotent obstacles, and validation', () => {
    const example = parseLabMap(EXAMPLE_MAP);
    expect(simulatePatrol(example, { extraObstacle: { row: 6, col: 3 } }).outcome).toBe('loop');

    const idempotent = simulatePatrol(example, { extraObstacle: { row: 0, col: 4 } });
    expect(idempotent.outcome).toBe('exited');
    expect(idempotent.visitedCount).toBe(41);

    const open = parseLabMap(['..', '^.', '..'].join('\n'));
    const altered = simulatePatrol(open, { extraObstacle: { row: 0, col: 0 } });
    expect(altered.outcome).toBe('exited');
    expect(altered.visitedCount).toBe(2);

    expect(() => simulatePatrol(example, { extraObstacle: { row: -1, col: 0 } })).toThrow(RangeError);
    expect(() => simulatePatrol(example, { extraObstacle: { row: 6, col: 4 } })).toThrow(Error);
  });
});
