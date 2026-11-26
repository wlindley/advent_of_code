import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '#.#####################',
  '#.......#########...###',
  '#######.#########.#.###',
  '###.....#.>.>.###.#.###',
  '###v#####.#v#.###.#.###',
  '###.>...#.#.#.....#...#',
  '###v###.#.#.#########.#',
  '###...#.#.#.......#...#',
  '#####.#.#.#######.#.###',
  '#.....#.#.#.......#...#',
  '#.#####.#.#.#########v#',
  '#.#...#...#...###...>.#',
  '#.#.#v#######v###.###v#',
  '#...#.>.#...>.>.#.###.#',
  '#####v#.#.###v#.#.###.#',
  '#.....#...#...#.#.#...#',
  '#.#########.###.#.#.###',
  '#...###...#...#...#.###',
  '###.###.#.###v#####v###',
  '#...#...#.#.>.>.#.>.###',
  '#.###.###.#.###.#.#v###',
  '#.....###...###...#...#',
  '#####################.#',
].join('\n');

interface RawGrid {
  readonly rows: number;
  readonly cols: number;
  readonly cells: readonly string[];
  readonly start: number;
  readonly end: number;
}

const RAW_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

function parseRawGrid(raw: string): RawGrid {
  const lines = raw.trim().split('\n');
  const first = lines[0] ?? '';
  const last = lines[lines.length - 1] ?? '';
  const rows = lines.length;
  const cols = first.length;
  const cells = lines.join('').split('');
  return { rows, cols, cells, start: first.indexOf('.'), end: (rows - 1) * cols + last.indexOf('.') };
}

function dfsRawGrid(grid: RawGrid, pos: number, visited: Uint8Array, steps: number): number {
  if (pos === grid.end) return steps;
  visited[pos] = 1;
  let best = -1;
  const r = Math.floor(pos / grid.cols);
  const c = pos - r * grid.cols;
  for (const [dr, dc] of RAW_DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) continue;
    const next = nr * grid.cols + nc;
    if (grid.cells[next] === '#' || visited[next] === 1) continue;
    const dist = dfsRawGrid(grid, next, visited, steps + 1);
    if (dist > best) best = dist;
  }
  visited[pos] = 0;
  return best;
}

function oracleLongestWalk(raw: string): number {
  const grid = parseRawGrid(raw);
  return dfsRawGrid(grid, grid.start, new Uint8Array(grid.rows * grid.cols), 0);
}

class FakeClock implements Clock {
  private index = 0;
  private readonly ticks: readonly number[];

  constructor(ticks: readonly number[]) {
    this.ticks = ticks;
  }

  nowMs(): number {
    const value = this.ticks[this.index] ?? this.ticks[this.ticks.length - 1] ?? 0;
    this.index += 1;
    return value;
  }
}

describe('AoC 2023 Day 23 Part 2 solver', () => {
  it('solves the 154-step official example via executeSolver and matches raw DFS oracle', () => {
    const execution = executeSolver(solver, OFFICIAL_EXAMPLE, new FakeClock([10, 22]));
    expect(execution.answer).toBe(154);
    expect(execution.elapsedMs).toBe(12);
    expect(execution.runtime).toBe('main-thread');
    expect(oracleLongestWalk(OFFICIAL_EXAMPLE)).toBe(154);
  });

  it('matches independent raw-grid DFS across minimal, uphill, cyclic, parallel, and 2x2 room mazes', () => {
    const cases: readonly [string, number][] = [
      ['#.#\n#.#', 1],
      ['#.#####\n#.#.<.#\n#^#v#.#\n#...#.#\n###>..#\n###.###', 15],
      ['#.#####\n#...#.#\n#.#...#\n#.##.##\n#....##\n###.###', 9],
      ['#.#####\n#...###\n#.#.###\n#.#...#\n#...#.#\n#####.#', 11],
      ['#.###\n#...#\n#...#\n###.#', 7],
    ];
    for (const [raw, expected] of cases) {
      expect(oracleLongestWalk(raw)).toBe(expected);
      expect(solver.solve(solver.parse(raw))).toBe(expected);
    }
  });

  it('throws on unreachable #.#/###/#.# maze and traces unreachable phase', () => {
    const blocked = '#.#\n###\n#.#';
    expect(oracleLongestWalk(blocked)).toBe(-1);
    const parsed = solver.parse(blocked);
    expect(() => solver.solve(parsed)).toThrow('No valid trail path from start to exit');
    const frames = solver.trace?.(parsed);
    expect(frames?.[frames.length - 1]?.phase).toBe('unreachable');
    expect(frames?.[frames.length - 1]?.isFinal).toBe(true);
  });

  it('builds bounded trace frames and rejects invalid maxSteps', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace?.(parsed);
    expect(full?.[0]?.phase).toBe('contracted');
    expect(full?.[full.length - 1]?.distance).toBe(154);
    expect(full?.[full.length - 1]?.isFinal).toBe(true);

    const bounded = solver.trace?.(parsed, { maxSteps: 5 });
    expect(bounded?.length).toBe(5);
    expect(bounded?.[4]?.isFinal).toBe(true);
    expect(() => solver.trace?.(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('propagates invalid input errors from parseTrailMap', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('###')).toThrow();
  });
});
