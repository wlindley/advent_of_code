import { describe, expect, it } from 'vitest';
import { Chamber } from './chamber';
import { parseJetPattern } from './jetPattern';
import { simulateTower } from './simulate';

const EXAMPLE_INPUT = '>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>';

type Coord = readonly [number, number];

// Independent 2D coordinate shapes (x from left wall 0..6, y upward from floor 0)
const ORACLE_SHAPES: ReadonlyArray<ReadonlyArray<Coord>> = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
];

function canPlace(occupied: ReadonlySet<string>, shape: ReadonlyArray<Coord>, ox: number, oy: number): boolean {
  for (const [dx, dy] of shape) {
    const x = ox + dx;
    const y = oy + dy;
    if (x < 0 || x >= 7 || y <= 0 || occupied.has(`${x},${y}`)) {
      return false;
    }
  }
  return true;
}

/** Brute-force 2D Set<string> rock simulator with zero bitmasks and zero cycle-skipping. */
function runOracleHeights(sequence: string, count: number): number[] {
  const occupied = new Set<string>();
  const heights: number[] = [];
  let maxY = 0;
  let jetIdx = 0;

  for (let rock = 0; rock < count; rock += 1) {
    const shape = ORACLE_SHAPES[rock % 5]!;
    let x = 2;
    let y = maxY + 4;

    while (true) {
      const dx = sequence[jetIdx % sequence.length] === '<' ? -1 : 1;
      jetIdx += 1;
      if (canPlace(occupied, shape, x + dx, y)) x += dx;
      if (!canPlace(occupied, shape, x, y - 1)) break;
      y -= 1;
    }

    for (const [sx, sy] of shape) {
      const py = y + sy;
      occupied.add(`${x + sx},${py}`);
      if (py > maxY) maxY = py;
    }
    heights.push(maxY);
  }
  return heights;
}

function seededJets(seed: number, length: number): string {
  let state = seed >>> 0;
  let out = '';
  for (let i = 0; i < length; i += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    out += (state & 1) === 0 ? '<' : '>';
  }
  return out;
}

describe('differential oracle verification (2D Set<string> vs Chamber & simulateTower)', () => {
  it('matches every single rock height from 1..2022 on the official example', () => {
    const oracle = runOracleHeights(EXAMPLE_INPUT, 2022);
    const chamber = new Chamber(parseJetPattern(EXAMPLE_INPUT));

    for (let i = 0; i < 10; i += 1) {
      chamber.dropNextRock();
      expect(chamber.height).toBe(oracle[i]);
    }
    for (let i = 10; i < 2022; i += 1) {
      chamber.dropNextRock();
      expect(chamber.height).toBe(oracle[i]);
    }
    expect(simulateTower(parseJetPattern(EXAMPLE_INPUT), 2022n).towerHeight).toBe(BigInt(oracle[2021]!));
  });

  it('matches brute-force heights across degenerate, overhang-pocket, and seeded random jet streams', () => {
    const patterns = [
      '<',
      '>',
      '<>',
      '<<>',
      '<<<<<>>>>>',
      '<<<>>><>><<<>><',
      seededJets(17, 43),
      seededJets(2022, 97),
    ];

    for (const seq of patterns) {
      const count = 400;
      const oracle = runOracleHeights(seq, count);
      const jets = parseJetPattern(seq);
      const chamber = new Chamber(jets);
      for (let i = 0; i < count; i += 1) {
        chamber.dropNextRock();
        expect(chamber.height).toBe(oracle[i]);
      }
      expect(simulateTower(jets, BigInt(count)).towerHeight).toBe(BigInt(oracle[count - 1]!));
    }
  });
});
