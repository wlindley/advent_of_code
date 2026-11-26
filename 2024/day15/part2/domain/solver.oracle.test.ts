import { describe, expect, it } from 'vitest';
import { MOVE_DELTAS, type MoveDir } from '../../shared';
import { solver } from './index';

class SeededRng {
  #state: number;
  constructor(seed: number) { this.#state = seed >>> 0; }
  nextUint(): number {
    this.#state = (Math.imul(1664525, this.#state) + 1013904223) >>> 0;
    return this.#state;
  }
  nextInt(maxExclusive: number): number { return this.nextUint() % maxExclusive; }
}

interface OracleResult {
  readonly rows: readonly string[];
  readonly gpsSum: number;
}

const WIDE_TOKENS: Record<string, readonly [string, string]> = {
  '#': ['#', '#'], O: ['[', ']'], '.': ['.', '.'], '@': ['@', '.'],
};

function widenGrid(rows: readonly string[]): string[][] {
  return rows.map((row) => row.split('').flatMap((ch) => [...WIDE_TOKENS[ch]!]));
}

function boxLeft(grid: string[][], r: number, c: number): number {
  return grid[r]![c] === '[' ? c : c - 1;
}

function canPushVertical(
  grid: string[][],
  r: number,
  leftC: number,
  dr: number,
  collected: Set<number>,
  memo: Map<number, boolean>,
): boolean {
  const width = grid[0]!.length;
  const key = r * width + leftC;
  if (memo.has(key)) return memo.get(key)!;
  const nr = r + dr;
  if (nr < 0 || nr >= grid.length) { memo.set(key, false); return false; }

  for (const c of [leftC, leftC + 1]) {
    const ch = grid[nr]![c]!;
    if (ch === '.') continue;
    if (ch !== '[' && ch !== ']') { memo.set(key, false); return false; }
    if (!canPushVertical(grid, nr, boxLeft(grid, nr, c), dr, collected, memo)) {
      memo.set(key, false);
      return false;
    }
  }
  collected.add(key);
  memo.set(key, true);
  return true;
}

function pushHorizontalOracle(grid: string[][], next: string[][], nr: number, nc: number, dc: number): boolean {
  const width = grid[0]!.length;
  let c = nc;
  while (c >= 0 && c < width && (grid[nr]![c] === '[' || grid[nr]![c] === ']')) c += dc;
  if (c < 0 || c >= width || grid[nr]![c] !== '.') return false;
  for (let k = c; k !== nc; k -= dc) next[nr]![k] = grid[nr]![k - dc]!;
  return true;
}

function pushVerticalOracle(grid: string[][], next: string[][], nr: number, nc: number, dr: number): boolean {
  const width = grid[0]!.length;
  const collected = new Set<number>();
  if (!canPushVertical(grid, nr, boxLeft(grid, nr, nc), dr, collected, new Map())) return false;
  for (const key of collected) {
    const r = Math.floor(key / width);
    const lc = key - r * width;
    next[r]![lc] = '.';
    next[r]![lc + 1] = '.';
  }
  for (const key of collected) {
    const r = Math.floor(key / width);
    const lc = key - r * width;
    next[r + dr]![lc] = '[';
    next[r + dr]![lc + 1] = ']';
  }
  return true;
}

function oracleStep(grid: string[][], robot: [number, number], move: MoveDir): string[][] {
  const [dr, dc] = MOVE_DELTAS[move];
  const width = grid[0]!.length;
  const nr = robot[0] + dr;
  const nc = robot[1] + dc;
  if (nr < 0 || nr >= grid.length || nc < 0 || nc >= width) return grid;
  const target = grid[nr]![nc]!;
  if (target === '#') return grid;
  const next = grid.map((row) => [...row]);
  if (target !== '.') {
    const pushed = dr === 0
      ? pushHorizontalOracle(grid, next, nr, nc, dc)
      : pushVerticalOracle(grid, next, nr, nc, dr);
    if (!pushed) return grid;
  }
  next[robot[0]]![robot[1]] = '.';
  next[nr]![nc] = '@';
  robot[0] = nr;
  robot[1] = nc;
  return next;
}

function runOracle(rows: readonly string[], moves: readonly MoveDir[]): OracleResult {
  let grid = widenGrid(rows);
  const robot: [number, number] = [0, 0];
  for (let r = 0; r < grid.length; r += 1) {
    const c = grid[r]!.indexOf('@');
    if (c !== -1) { robot[0] = r; robot[1] = c; }
  }
  for (const move of moves) grid = oracleStep(grid, robot, move);

  let gpsSum = 0;
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r]!.length; c += 1) {
      if (grid[r]![c] === '[') gpsSum += 100 * r + c;
    }
  }
  return { rows: grid.map((r) => r.join('')), gpsSum };
}

function generateRandomWarehouse(rng: SeededRng): string {
  const height = 5 + rng.nextInt(5);
  const width = 5 + rng.nextInt(5);
  const grid: string[][] = Array.from({ length: height }, (_, r) =>
    Array.from({ length: width }, (__, c) => {
      if (r === 0 || r === height - 1 || c === 0 || c === width - 1) return '#';
      const roll = rng.nextInt(10);
      if (roll < 2) return '#';
      return roll < 5 ? 'O' : '.';
    }),
  );
  grid[1 + rng.nextInt(height - 2)]![1 + rng.nextInt(width - 2)] = '@';
  const dirs: readonly MoveDir[] = ['^', 'v', '<', '>'];
  const moves = Array.from({ length: 25 + rng.nextInt(45) }, () => dirs[rng.nextInt(4)]!).join('');
  return `${grid.map((row) => row.join('')).join('\n')}\n\n${moves}`;
}

describe('Part 2 differential oracle', () => {
  it('matches all 11 steps of the small example and final board of the large example', () => {
    const small = '#######\n#...#.#\n#.....#\n#..OO@#\n#..O..#\n#.....#\n#######\n\n<vv<<^^<<^^';
    const smallSpec = solver.parse(small);
    const trace = solver.trace?.(smallSpec) ?? [];
    expect(trace).toHaveLength(12);
    for (const frame of trace) {
      const expected = runOracle(smallSpec.rows, smallSpec.moves.slice(0, frame.step));
      expect(frame.snapshot.toAsciiRows()).toEqual(expected.rows);
      expect(frame.snapshot.gpsSum).toBe(expected.gpsSum);
    }

    const large = [
      '##########\n#..O..O.O#\n#......O.#\n#.OO..O.O#\n#..O@..O.#\n#O#..O...#\n#O..O..O.#\n#.OO.O.OO#\n#....O...#\n##########',
      '<vv>^<v^>v>^vv^v>v<>v^v<v<^vv<<<^><<><>>v<vvv<>^v^>^<<<><<v<<<v^vv^v>^vvv<<^>^v^^><<>>><>^<<><^vv^^<>vvv<>><^^v>^>vv<>v<<<<v<^v>^<^^>>>^<v<v><>vv>v^v^<>><>>>><^^>vv>v<^^^>>v^v^<^^>v^^>v^<^v>v<>>v^v^<v>v^^<^^vv<<<v<^>>^^^^>>>v^<>vvv^><v<<<>^^^vv^<vvv>^>v<^^^^v<>^>vvvv><>>v^<<^^^^^^><^><>>><>^^<<^^v>>><^<v>^<vv>>v>>>^v><>^v><<<<v>>v<v<v>vvv>^<><<>^><^>><>^v<><^vvv<^^<><v<<<<<><^v<<<><<<^^<v<^^^><^>>^<v^><<<^>>^v<v^v<v^>^>>^v>vv>^<<^v<>><<><<v<<v><>v<^vv<<<>^^v^>^^>>><<^v>>v^v><^^>>^<>vv^<><^^>^^^<><vvvvv^v<v<<>^v<v>v<<^><<><<><<<^^<<<^<<>><<><^^^>^^<>^>v<>^^>vv<^v^v<vv>^<><v<^v>^^^>>>^^vvv^>vvv<>>>^<^>>>>>^<<^v>^vvv<>^<><<v>v^^>>><<^^<>>^v^<v^vv<>v^<<>^<^v^v><^<<<><<^<v><v<>vv>>v><v^<vv<>v^<<^',
    ].join('\n\n');
    const largeSpec = solver.parse(large);
    const finalSnap = solver.trace?.(largeSpec, { maxSteps: 1 })[0]?.snapshot;
    const largeOracle = runOracle(largeSpec.rows, largeSpec.moves);
    expect(finalSnap?.toAsciiRows()).toEqual(largeOracle.rows);
    expect(solver.solve(largeSpec)).toBe(largeOracle.gpsSum);
  });

  it('matches the copy-on-write memoized oracle across edge cases and 50 random warehouses', () => {
    const edges = [
      '###\n#@#\n###\n\n^v<>',
      'O@O\n\n<>',
      '#####\n#@OO#\n#####\n\n>>>>',
      '#########\n#..#....#\n#..OO...#\n#..O....#\n#@......#\n#########\n\n^>>>>v>^',
      '#########\n#.......#\n#..O....#\n#..OO...#\n#..O....#\n#@......#\n#########\n\n^^^>>>><<<vv>>>v>^',
    ];
    for (const raw of edges) {
      const spec = solver.parse(raw);
      const expected = runOracle(spec.rows, spec.moves);
      const actual = solver.trace?.(spec, { maxSteps: 1 })[0]?.snapshot;
      expect(actual?.toAsciiRows()).toEqual(expected.rows);
      expect(solver.solve(spec)).toBe(expected.gpsSum);
    }

    const rng = new SeededRng(20241502);
    for (let i = 0; i < 50; i += 1) {
      const spec = solver.parse(generateRandomWarehouse(rng));
      const expected = runOracle(spec.rows, spec.moves);
      const actual = solver.trace?.(spec, { maxSteps: 1 })[0]?.snapshot;
      expect(actual?.toAsciiRows()).toEqual(expected.rows);
      expect(solver.solve(spec)).toBe(expected.gpsSum);
    }
  });
});
