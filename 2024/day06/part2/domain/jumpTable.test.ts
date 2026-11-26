import { describe, expect, it } from 'vitest';
import { GUARD_SYMBOLS, parseLabMap, simulatePatrol, type CellCoord } from '../../shared';
import { ObstacleJumpTable } from './jumpTable';

const EXAMPLE_RAW = [
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

function buildSeededGrid(seed: number, rows: number, cols: number): string {
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const gr = Math.floor(next() * rows);
  const gc = Math.floor(next() * cols);
  const gdir = GUARD_SYMBOLS[Math.floor(next() * 4)]!;
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      if (r === gr && c === gc) line += gdir;
      else line += next() < 0.22 ? '#' : '.';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function assertMatchesOracle(raw: string): void {
  const map = parseLabMap(raw);
  const table = new ObstacleJumpTable(map);
  const expected: CellCoord[] = [];
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      if (r === map.startRow && c === map.startCol) continue;
      const obs = { row: r, col: c };
      const oracle = simulatePatrol(map, { extraObstacle: obs }).outcome === 'loop';
      expect(table.causesLoop(obs)).toBe(oracle);
      if (!map.isObstacle(r, c) && oracle) expected.push(obs);
    }
  }
  expect(table.findLoopObstructions()).toEqual(expected);
}

describe('ObstacleJumpTable', () => {
  it('finds exact 6 loop obstructions on the official 10x10 example', () => {
    const map = parseLabMap(EXAMPLE_RAW);
    const table = new ObstacleJumpTable(map);
    expect(Object.isFrozen(table)).toBe(true);
    const coords = table.findLoopObstructions();
    expect(Object.isFrozen(coords)).toBe(true);
    expect(coords).toEqual([
      { row: 6, col: 3 }, { row: 7, col: 6 }, { row: 7, col: 7 },
      { row: 8, col: 1 }, { row: 8, col: 3 }, { row: 9, col: 7 },
    ]);
  });

  it('validates extraObstacle bounds and guard start', () => {
    const table = new ObstacleJumpTable(parseLabMap(EXAMPLE_RAW));
    expect(() => table.causesLoop({ row: -1, col: 0 })).toThrow(RangeError);
    expect(() => table.causesLoop({ row: 0, col: 10 })).toThrow(RangeError);
    expect(() => table.causesLoop({ row: 6, col: 4 })).toThrow(Error);
    expect(() => table.traceLoopPath({ row: 6, col: 4 })).toThrow(Error);
  });

  it('handles all 4 directional ray interceptions (open edge, closer, farther, behind, existing #)', () => {
    // Base loop exists when guard faces ^; placing # closer vs farther vs behind vs on # tests all branches
    const upOpen = parseLabMap(['.....', '.....', '..^..', '.....', '.....'].join('\n'));
    expect(new ObstacleJumpTable(upOpen).causesLoop({ row: 0, col: 2 })).toBe(false);
    expect(new ObstacleJumpTable(upOpen).causesLoop({ row: 4, col: 2 })).toBe(false);

    const fourWay = parseLabMap([
      '..#....', '......#', '.#.....', '...^...', '..#....', '.......', '....#..',
    ].join('\n'));
    const tbl = new ObstacleJumpTable(fourWay);
    // Dir 0 (up): base stop at row 1; closer (2,3) vs farther (0,3) vs on base (0,2 is #)
    expect(tbl.causesLoop({ row: 0, col: 2 })).toBe(false);
    expect(tbl.causesLoop({ row: 1, col: 3 })).toBe(false);
    // Dir 1 (right): base open on row 3, col > 3; Dir 2 (down): row 3->6; Dir 3 (left): col < 3
    const rightOpen = parseLabMap(['..#..', '.>...', '....#', '#....', '..#..'].join('\n'));
    const rt = new ObstacleJumpTable(rightOpen);
    expect(rt.causesLoop({ row: 1, col: 4 })).toBe(false);
    expect(rt.causesLoop({ row: 1, col: 0 })).toBe(false);

    const boxedLoop = parseLabMap(['.#...', '....#', '.^...', '#....', '...#.'].join('\n'));
    const bt = new ObstacleJumpTable(boxedLoop);
    // Closer on each ray vs farther than base # vs on existing #
    expect(bt.causesLoop({ row: 0, col: 1 })).toBe(true); // on existing #
    expect(bt.causesLoop({ row: 1, col: 4 })).toBe(true); // on existing #
    expect(bt.causesLoop({ row: 4, col: 3 })).toBe(true); // on existing #
    expect(bt.causesLoop({ row: 3, col: 0 })).toBe(true); // on existing #
    expect(bt.causesLoop({ row: 1, col: 1 })).toBe(false); // closer on dir 0 breaks loop
    expect(bt.causesLoop({ row: 1, col: 2 })).toBe(false); // closer on dir 1 breaks loop
    expect(bt.causesLoop({ row: 2, col: 3 })).toBe(false); // closer on dir 2 breaks loop
    expect(bt.causesLoop({ row: 3, col: 1 })).toBe(false); // closer on dir 3 breaks loop
  });

  it('handles 2-wall, 3-wall, 4-wall 0-step corners and mid-path revisits', () => {
    const corner2 = parseLabMap(['.#.', '..#', '^..'].join('\n'));
    expect(new ObstacleJumpTable(corner2).findLoopObstructions()).toEqual([]);

    const corner3 = parseLabMap(['.#.', '#^#', '...'].join('\n'));
    const c3 = new ObstacleJumpTable(corner3);
    expect(c3.causesLoop({ row: 2, col: 1 })).toBe(true);
    const t4 = c3.traceLoopPath({ row: 2, col: 1 })!;
    expect(t4.approachVertices).toEqual([{ row: 1, col: 1 }]);
    expect(t4.cycleVertices).toHaveLength(5);
    expect(t4.cycleVertices[0]).toEqual(t4.cycleVertices[4]);

    const midRevisit = parseLabMap([
      '.#....',
      '.....#',
      '......',
      '......',
      '.^....',
      '....#.',
    ].join('\n'));
    // Guard starts at (4,1)^ -> (1,1)> -> (1,4)v -> (4,4)< -> needs # at (4,0) to turn up onto (4,1)^
    const mr = new ObstacleJumpTable(midRevisit);
    expect(mr.causesLoop({ row: 4, col: 0 })).toBe(true);
    const traj = mr.traceLoopPath({ row: 4, col: 0 })!;
    expect(traj.approachVertices).toEqual([{ row: 4, col: 1 }]);
    expect(traj.cycleVertices[0]).toEqual(traj.cycleVertices[traj.cycleVertices.length - 1]);
  });

  it('handles baseline-looping maps and zero-loop 2x2 maps', () => {
    const baselineLoop = ['.#...', '....#', '.^...', '#....', '...#.'].join('\n');
    const blTable = new ObstacleJumpTable(parseLabMap(baselineLoop));
    expect(blTable.causesLoop({ row: 0, col: 0 })).toBe(true); // unvisited preserved
    expect(blTable.causesLoop({ row: 1, col: 1 })).toBe(false); // visited exit
    expect(blTable.causesLoop({ row: 4, col: 4 })).toBe(true); // unvisited
    expect(blTable.findLoopObstructions().length).toBeGreaterThan(0);

    const tiny = parseLabMap(['..', '^.'].join('\n'));
    expect(new ObstacleJumpTable(tiny).findLoopObstructions()).toEqual([]);
  });

  it('traces null on exit and multi-turn closed cycle on loop', () => {
    const table = new ObstacleJumpTable(parseLabMap(EXAMPLE_RAW));
    expect(table.traceLoopPath({ row: 0, col: 0 })).toBeNull();
    const traj = table.traceLoopPath({ row: 6, col: 3 })!;
    expect(Object.isFrozen(traj)).toBe(true);
    expect(Object.isFrozen(traj.approachVertices)).toBe(true);
    expect(Object.isFrozen(traj.cycleVertices)).toBe(true);
    expect(traj.approachVertices[0]).toEqual({ row: 6, col: 4 });
    expect(traj.cycleVertices.length).toBeGreaterThanOrEqual(5);
    expect(traj.cycleVertices[0]).toEqual(traj.cycleVertices[traj.cycleVertices.length - 1]);
    expect(traj.approachVertices[traj.approachVertices.length - 1]).toEqual(traj.cycleVertices[0]);
  });

  it('matches simulatePatrol differential oracle across fixed and 20 seeded random grids', () => {
    assertMatchesOracle(EXAMPLE_RAW);
    assertMatchesOracle(['.#.', '#^#', '...'].join('\n'));
    assertMatchesOracle(['.#...', '....#', '.^...', '#....', '...#.'].join('\n'));
    for (let i = 1; i <= 20; i += 1) {
      const size = 6 + (i % 10);
      assertMatchesOracle(buildSeededGrid(i * 7919, size, size));
    }
  });
});
