import { describe, expect, it } from 'vitest';
import { solver } from './index';

function directColumnNorthLoad(raw: string): number {
  const lines = raw.replace(/\r\n?/g, '\n').trim().split('\n');
  const h = lines.length;
  const w = lines[0]!.length;
  let total = 0;
  for (let c = 0; c < w; c += 1) {
    let nextWeight = h;
    for (let r = 0; r < h; r += 1) {
      const ch = lines[r]!.charAt(c);
      if (ch === '#') {
        nextWeight = h - r - 1;
      } else if (ch === 'O') {
        total += nextWeight;
        nextWeight -= 1;
      }
    }
  }
  return total;
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

function randomGridText(rng: () => number, h: number, w: number): string {
  const rows: string[] = [];
  for (let r = 0; r < h; r += 1) {
    let row = '';
    for (let c = 0; c < w; c += 1) {
      const p = rng();
      row += p < 0.35 ? 'O' : p < 0.55 ? '#' : '.';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

const EXAMPLE = [
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
].join('\n');

describe('2023/day14/part1/domain/solver differential oracle', () => {
  it('matches zero-mutation arithmetic column-load accumulator on official example and edge grids', () => {
    const edgeCases = [
      EXAMPLE,
      '.',
      'O',
      '#',
      'O.O.#.O',
      'O\n.\n#\nO\n.',
      '###\n###',
      'OOO\nOOO',
      '...\n...',
    ];
    for (const raw of edgeCases) {
      expect(solver.solve(solver.parse(raw))).toBe(directColumnNorthLoad(raw));
    }
  });

  it('matches zero-mutation arithmetic accumulator across 60 seeded random grids', () => {
    const rng = makeRng(20231411);
    for (let i = 0; i < 60; i += 1) {
      const h = 1 + Math.floor(rng() * 14);
      const w = 1 + Math.floor(rng() * 14);
      const raw = randomGridText(rng, h, w);
      expect(solver.solve(solver.parse(raw))).toBe(directColumnNorthLoad(raw));
    }
  });
});
