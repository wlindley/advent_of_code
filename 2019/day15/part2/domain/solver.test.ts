import { describe, expect, it } from 'vitest';
import { solver } from './index';

const OFFICIAL_EXAMPLE_INPUT =
  '3,50,1001,50,57,7,1,0,51,53,1001,50,62,15,1,0,52,54,1002,54,6,55,1,55,53,55,1001,55,67,31,1001,0,0,56,4,56,1006,56,0,1001,53,0,51,1001,54,0,52,1105,1,0,0,3,2,0,0,0,0,0,0,0,-1,1,0,-1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,1,0,1,1,0,0,1,2,1,0,0,0,0,0,0,0,0';

function compileMazeToIntcode(rows: readonly string[]): string {
  const width = rows[0]!.length;
  const b = 50;
  let sx = 0, sy = 0;
  const cells: number[] = [];
  for (let y = 0; y < rows.length; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ch = rows[y]![x]!;
      if (ch === 'S') { sx = x; sy = y; }
      cells.push(ch === '#' ? 0 : ch === 'O' ? 2 : 1);
    }
  }
  return [
    3, b, 1001, b, b + 7, 7, 1, 0, b + 1, b + 3, 1001, b, b + 12, 15, 1, 0, b + 2, b + 4,
    1002, b + 4, width, b + 5, 1, b + 5, b + 3, b + 5, 1001, b + 5, b + 17, 31, 1001, 0, 0,
    b + 6, 4, b + 6, 1006, b + 6, 0, 1001, b + 3, 0, b + 1, 1001, b + 4, 0, b + 2, 1105, 1, 0,
    0, sx, sy, 0, 0, 0, 0, 0, 0, 0, -1, 1, 0, -1, 1, 0, 0, ...cells,
  ].join(',');
}

function nextRandom(rng: { state: number }): number {
  rng.state = (rng.state + 0x6d2b79f5) | 0;
  let t = Math.imul(rng.state ^ (rng.state >>> 15), 1 | rng.state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function placeEndpoints(grid: string[][], rng: { state: number }): string[] {
  const open: Array<[number, number]> = [];
  for (let y = 1; y < grid.length - 1; y += 1) {
    for (let x = 1; x < grid[0]!.length - 1; x += 1) {
      if (grid[y]![x] === '.') open.push([x, y]);
    }
  }
  const sIdx = Math.floor(nextRandom(rng) * open.length);
  const oIdx = (sIdx + 1 + Math.floor(nextRandom(rng) * (open.length - 1))) % open.length;
  grid[open[sIdx]![1]]![open[sIdx]![0]] = 'S';
  grid[open[oIdx]![1]]![open[oIdx]![0]] = 'O';
  return grid.map((row) => row.join(''));
}

function generateBorderedMaze(seed: number, cyclic: boolean): string[] {
  const rng = { state: seed };
  const w = 9, h = 7;
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => '#'));
  const stack: Array<[number, number]> = [[1, 1]];
  grid[1]![1] = '.';
  const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]] as const;
  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1]!;
    const nexts = dirs
      .map(([dx, dy]) => [cx + dx, cy + dy, cx + dx / 2, cy + dy / 2] as const)
      .filter(([nx, ny]) => nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny]![nx] === '#');
    if (nexts.length === 0) { stack.pop(); continue; }
    const [nx, ny, mx, my] = nexts[Math.floor(nextRandom(rng) * nexts.length)]!;
    grid[my]![mx] = '.';
    grid[ny]![nx] = '.';
    stack.push([nx, ny]);
  }
  if (cyclic) {
    for (let i = 0; i < 4; i += 1) {
      const x = 1 + Math.floor(nextRandom(rng) * (w - 2));
      const y = 1 + Math.floor(nextRandom(rng) * (h - 2));
      if ((x + y) % 2 === 1) grid[y]![x] = '.';
    }
  }
  return placeEndpoints(grid, rng);
}

function wavefrontMinutesOracle(rows: readonly string[]): number {
  let start: [number, number] = [0, 0];
  for (let y = 0; y < rows.length; y += 1) {
    const x = rows[y]!.indexOf('O');
    if (x >= 0) start = [x, y];
  }
  const visited = new Set<string>([`${start[0]},${start[1]}`]);
  let frontier: Array<[number, number]> = [start];
  let minutes = 0;
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]] as const;
  while (frontier.length > 0) {
    const next: Array<[number, number]> = [];
    for (const [x, y] of frontier) {
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
        if (rows[ny]?.[nx] !== undefined && rows[ny]![nx] !== '#' && !visited.has(key)) {
          visited.add(key);
          next.push([nx, ny]);
        }
      }
    }
    if (next.length === 0) break;
    minutes += 1;
    frontier = next;
  }
  return minutes;
}

describe('2019 Day 15 Part 2 solver', () => {
  it('solves and traces the official 6x5 Part 2 example compartment', () => {
    const program = solver.parse(OFFICIAL_EXAMPLE_INPUT);
    expect(solver.solve(program)).toBe(4);
    const frames = solver.trace(program);
    const solveFrames = frames.filter((f) => f.phase === 'solve');
    expect(frames[0]!.phase).toBe('explore');
    expect(solver.policy.formatFrameAnswer(frames[0]!)).toBe('Pending');
    expect(solveFrames.map((f) => f.frontierDistance)).toEqual([0, 1, 2, 3, 4]);
    expect(solveFrames.map((f) => f.distances!.size)).toEqual([1, 3, 5, 7, 8]);
    for (const frame of solveFrames) expect(frame.shortestPath).toEqual([]);
    expect(solver.policy.formatFrameAnswer(solveFrames[solveFrames.length - 1]!)).toBe('4');
  });

  it('respects maxSteps bounds across 1, 2, and 4 frames', () => {
    const program = solver.parse(OFFICIAL_EXAMPLE_INPUT);
    const one = solver.trace(program, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.phase).toBe('solve');
    expect(solver.policy.formatFrameAnswer(one[0]!)).toBe('4');

    const two = solver.trace(program, { maxSteps: 2 });
    expect(two.map((f) => f.phase)).toEqual(['explore', 'solve']);

    const four = solver.trace(program, { maxSteps: 4 });
    expect(four).toHaveLength(4);
    expect(four[0]!.phase).toBe('explore');
    expect(four[3]!.phase).toBe('solve');
    expect(solver.policy.formatFrameAnswer(four[3]!)).toBe('4');
  });

  it('solves structural boundary mazes accurately', () => {
    expect(solver.solve(solver.parse(compileMazeToIntcode(['####', '#SO#', '####'])))).toBe(1);
    expect(solver.solve(solver.parse(compileMazeToIntcode(['##########', '#S.O.....#', '##########'])))).toBe(5);
    expect(solver.solve(solver.parse(compileMazeToIntcode(['#####', '#S..#', '#.#.#', '#..O#', '#####'])))).toBe(4);
    expect(solver.solve(solver.parse(compileMazeToIntcode(['#######', '#SO#..#', '#######'])))).toBe(1);
  });

  it('rejects empty Intcode input', () => {
    expect(() => solver.parse('')).toThrow();
  });

  it('rejects malformed non-integer Intcode input', () => {
    expect(() => solver.parse('1,2,bad')).toThrow();
  });

  it('rejects invalid maxSteps values', () => {
    const valid = solver.parse(OFFICIAL_EXAMPLE_INPUT);
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => solver.trace(valid, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('rejects compartment missing an oxygen system', () => {
    expect(() => solver.solve(solver.parse(compileMazeToIntcode(['###', '#S#', '###'])))).toThrow();
  });

  it('rejects compartment with duplicate oxygen systems', () => {
    expect(() => solver.solve(solver.parse(compileMazeToIntcode(['#####', '#SOO#', '#####'])))).toThrow();
  });

  it('rejects program that halts immediately without waiting for input', () => {
    expect(() => solver.solve(solver.parse('99'))).toThrow();
  });

  it('matches an independent wavefront oracle across 24 seeded spanning-tree and cyclic mazes', () => {
    for (let seed = 1; seed <= 24; seed += 1) {
      const rows = generateBorderedMaze(seed * 97 + 13, seed % 2 === 0);
      expect(solver.solve(solver.parse(compileMazeToIntcode(rows)))).toBe(wavefrontMinutesOracle(rows));
    }
  });
});
