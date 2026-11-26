import { describe, expect, it } from 'vitest';
import { MOVE_DELTAS, type MoveDir } from '../../shared';
import { solver } from './index';

class SeededRng {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0;
  }

  nextUint(): number {
    this.#state = (Math.imul(1664525, this.#state) + 1013904223) >>> 0;
    return this.#state;
  }

  nextInt(maxExclusive: number): number {
    return this.nextUint() % maxExclusive;
  }
}

interface OracleResult {
  readonly rows: readonly string[];
  readonly gpsSum: number;
}

function oracleStep(grid: string[][], robot: [number, number], move: MoveDir): void {
  const [dr, dc] = MOVE_DELTAS[move];
  const height = grid.length;
  const width = grid[0]!.length;
  const nr = robot[0] + dr;
  const nc = robot[1] + dc;
  const chain: Array<[number, number]> = [];
  let r = nr;
  let c = nc;

  while (r >= 0 && r < height && c >= 0 && c < width && grid[r]![c] === 'O') {
    chain.push([r, c]);
    r += dr;
    c += dc;
  }

  if (r < 0 || r >= height || c < 0 || c >= width || grid[r]![c] !== '.') return;

  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const [br, bc] = chain[i]!;
    grid[br + dr]![bc + dc] = 'O';
    grid[br]![bc] = '.';
  }
  grid[robot[0]]![robot[1]] = '.';
  grid[nr]![nc] = '@';
  robot[0] = nr;
  robot[1] = nc;
}

function runOracle(rows: readonly string[], moves: readonly MoveDir[]): OracleResult {
  const grid = rows.map((row) => row.split(''));
  const robot: [number, number] = [0, 0];
  for (let r = 0; r < grid.length; r += 1) {
    const row = grid[r]!;
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] === '@') {
        robot[0] = r;
        robot[1] = c;
      }
    }
  }
  for (const move of moves) oracleStep(grid, robot, move);

  let gpsSum = 0;
  for (let r = 0; r < grid.length; r += 1) {
    const row = grid[r]!;
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] === 'O') gpsSum += 100 * r + c;
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
      if (roll < 5) return 'O';
      return '.';
    }),
  );
  const rr = 1 + rng.nextInt(height - 2);
  const rc = 1 + rng.nextInt(width - 2);
  grid[rr]![rc] = '@';

  const dirs: readonly MoveDir[] = ['^', 'v', '<', '>'];
  const moveCount = 20 + rng.nextInt(40);
  const moves = Array.from({ length: moveCount }, () => dirs[rng.nextInt(4)]!).join('');
  return `${grid.map((row) => row.join('')).join('\n')}\n\n${moves}`;
}

describe('Part 1 differential oracle', () => {
  it('matches all 15 steps of the small example and final board of the large example', () => {
    const small = [
      '########\n#..O.O.#\n##@.O..#\n#...O..#\n#.#.O..#\n#...O..#\n#......#\n########',
      '<^^>>>vv<v>>v<<',
    ].join('\n\n');
    const smallSpec = solver.parse(small);
    const trace = solver.trace?.(smallSpec) ?? [];
    expect(trace).toHaveLength(16);
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

  it('matches the independent shift oracle across 50 seeded random warehouses and edge cases', () => {
    const edges = ['###\n#@#\n###\n\n^v<>', 'O@O\n\n<>', '#####\n#@OO#\n#####\n\n>>>>'];
    for (const raw of edges) {
      const spec = solver.parse(raw);
      expect(solver.solve(spec)).toBe(runOracle(spec.rows, spec.moves).gpsSum);
    }

    const rng = new SeededRng(20241501);
    for (let i = 0; i < 50; i += 1) {
      const spec = solver.parse(generateRandomWarehouse(rng));
      expect(solver.solve(spec)).toBe(runOracle(spec.rows, spec.moves).gpsSum);
    }
  });
});
