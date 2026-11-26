import { describe, expect, it } from 'vitest';
import { TILT_DIRECTIONS, parseDishPlatform, type TiltDirection } from './index';

const DELTAS: Record<TiltDirection, readonly [number, number]> = {
  north: [-1, 0],
  west: [0, -1],
  south: [1, 0],
  east: [0, 1],
};

function bubbleStepTilt(lines: readonly string[], dir: TiltDirection): string[] {
  const h = lines.length;
  const w = lines[0]!.length;
  const grid = lines.map((line) => [...line]);
  const [dr, dc] = DELTAS[dir];
  let moved = true;
  while (moved) {
    moved = false;
    for (let r = 0; r < h; r += 1) {
      for (let c = 0; c < w; c += 1) {
        if (grid[r]![c] !== 'O') continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < h && nc >= 0 && nc < w && grid[nr]![nc] === '.') {
          grid[nr]![nc] = 'O';
          grid[r]![c] = '.';
          moved = true;
        }
      }
    }
  }
  return grid.map((row) => row.join(''));
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

function randomGrid(rng: () => number, h: number, w: number): string[] {
  const lines: string[] = [];
  for (let r = 0; r < h; r += 1) {
    let row = '';
    for (let c = 0; c < w; c += 1) {
      const p = rng();
      row += p < 0.35 ? 'O' : p < 0.55 ? '#' : '.';
    }
    lines.push(row);
  }
  return lines;
}

const EXAMPLE_LINES = [
  'O....#....',
  'O.OO#....#',
  '.....##...',
  'OO.#O....O',
  '.O.....O#.',
  'O.#..O.#.#',
  '..O..#O..O',
  '.......O..',
  '#....###..',
  '#OO..#....',
];

describe('2023/day14/shared/platform differential oracle', () => {
  it('matches bubble-step simulation across 1, 2, and 3 spin cycles on the official example', () => {
    let platform = parseDishPlatform(EXAMPLE_LINES.join('\n'));
    let oracleLines = [...EXAMPLE_LINES];

    for (let cycle = 1; cycle <= 3; cycle += 1) {
      for (const dir of TILT_DIRECTIONS) {
        platform = platform.tilt(dir);
        oracleLines = bubbleStepTilt(oracleLines, dir);
        expect(platform.toLines()).toEqual(oracleLines);
      }
    }
  });

  it('matches bubble-step simulation across asymmetric and 40 seeded random grids in all directions', () => {
    const rng = makeRng(20231401);
    const cases: string[][] = [
      ['O.O#.O.', '.O..O#.', '#.O...O'],
      ['O', '.', 'O', '#', '.', 'O'],
      ['.O..#O.O.'],
    ];
    for (let i = 0; i < 40; i += 1) {
      cases.push(randomGrid(rng, 1 + Math.floor(rng() * 11), 1 + Math.floor(rng() * 11)));
    }
    for (const lines of cases) {
      const platform = parseDishPlatform(lines.join('\n'));
      for (const dir of TILT_DIRECTIONS) {
        expect(platform.tilt(dir).toLines()).toEqual(bubbleStepTilt(lines, dir));
      }
    }
  });
});
