import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { type TumblerInventory, buildMatchTrace } from '../../shared';
import { solvePart1, solver } from '.';

const OFFICIAL_EXAMPLE = [
  '#####\n.####\n.####\n.####\n.#.#.\n.#...\n.....',
  '#####\n##.##\n.#.##\n...##\n...#.\n...#.\n.....',
  '.....\n#....\n#....\n#...#\n#.#.#\n#.###\n#####',
  '.....\n.....\n#.#..\n###..\n###.#\n###.#\n#####',
  '.....\n.....\n.....\n#....\n#.#..\n#.#.#\n#####',
].join('\n\n');

function sosDpOracle(inv: TumblerInventory): number {
  const base = inv.maxPinHeight + 1;
  const totalStates = base ** inv.width;
  const dp = new Int32Array(totalStates);
  const strides = Array.from({ length: inv.width }, (_, c) => base ** c);
  for (const key of inv.keys) {
    let idx = 0;
    for (let c = 0; c < inv.width; c += 1) idx += key.heights[c]! * strides[c]!;
    dp[idx]! += 1;
  }
  for (let c = 0; c < inv.width; c += 1) {
    const stride = strides[c]!;
    for (let state = 0; state < totalStates; state += 1) {
      if (Math.floor(state / stride) % base > 0) dp[state]! += dp[state - stride]!;
    }
  }
  let total = 0;
  for (const lock of inv.locks) {
    let idx = 0;
    for (let c = 0; c < inv.width; c += 1) idx += (inv.maxPinHeight - lock.heights[c]!) * strides[c]!;
    total += dp[idx]!;
  }
  return total;
}

function rawGridOverlapOracle(raw: string): number {
  const blocks = raw.trim().split(/\n\s*\n/).map((b) => b.split('\n').map((r) => r.trim()));
  const locks = blocks.filter((rows) => rows[0]!.startsWith('#'));
  const keys = blocks.filter((rows) => rows[0]!.startsWith('.'));
  let fits = 0;
  for (const lock of locks) {
    for (const key of keys) {
      const collides = lock.some((row, r) => [...row].some((ch, c) => ch === '#' && key[r]![c] === '#'));
      if (!collides) fits += 1;
    }
  }
  return fits;
}

function renderAsciiBlock(kind: 'lock' | 'key', height: number, heights: readonly number[]): string {
  return Array.from({ length: height }, (_, r) =>
    heights
      .map((h) => (kind === 'lock' ? (r <= h ? '#' : '.') : (r >= height - 1 - h ? '#' : '.')))
      .join(''),
  ).join('\n');
}

function buildSeededCase(seed: number, width: number, height: number, lockCount: number, keyCount: number): string {
  let state = seed >>> 0;
  const nextInt = (bound: number): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % bound;
  };
  const blocks: string[] = [];
  for (let i = 0; i < lockCount; i += 1) {
    blocks.push(renderAsciiBlock('lock', height, Array.from({ length: width }, () => nextInt(height - 1))));
  }
  for (let i = 0; i < keyCount; i += 1) {
    blocks.push(renderAsciiBlock('key', height, Array.from({ length: width }, () => nextInt(height - 1))));
  }
  return blocks.join('\n\n');
}

describe('Day 25 Part 1 solver', () => {
  it('solves the official example to 3 via solver, executeSolver, and trace', () => {
    const inv = solver.parse(OFFICIAL_EXAMPLE);
    expect(solvePart1(inv)).toBe(3);
    expect(executeSolver(solver, OFFICIAL_EXAMPLE).answer).toBe(3);
    const trace = solver.trace!(inv, { maxSteps: 4 });
    expect(trace).toEqual(buildMatchTrace(inv, { maxSteps: 4 }));
    expect(trace[trace.length - 1]!.matchCount).toBe(3);
  });

  it('handles H=2 minimal schematics and wide 12x20 schematics', () => {
    const h2Raw = [
      renderAsciiBlock('lock', 2, [0, 0, 0, 0]),
      renderAsciiBlock('lock', 2, [0, 0, 0, 0]),
      renderAsciiBlock('key', 2, [0, 0, 0, 0]),
    ].join('\n\n');
    expect(solver.solve(solver.parse(h2Raw))).toBe(2);
    expect(rawGridOverlapOracle(h2Raw)).toBe(2);

    const wideRaw = [
      renderAsciiBlock('lock', 20, Array(12).fill(9)),
      renderAsciiBlock('key', 20, Array(12).fill(9)),
      renderAsciiBlock('key', 20, [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10]),
    ].join('\n\n');
    expect(solver.solve(solver.parse(wideRaw))).toBe(1);
    expect(rawGridOverlapOracle(wideRaw)).toBe(1);
  });

  it('matches both SOS DP and Raw 2D Grid oracles across duplicates and seeded fuzz cases', () => {
    const duplicateRaw = [
      renderAsciiBlock('lock', 5, [1, 2, 0]),
      renderAsciiBlock('lock', 5, [1, 2, 0]),
      renderAsciiBlock('key', 5, [2, 1, 3]),
      renderAsciiBlock('key', 5, [2, 1, 3]),
      renderAsciiBlock('key', 5, [2, 2, 0]),
    ].join('\n\n');

    const cases = [
      OFFICIAL_EXAMPLE,
      '###\n...\n\n...\n###',
      duplicateRaw,
      buildSeededCase(101, 3, 5, 8, 9),
      buildSeededCase(202, 4, 6, 12, 11),
      buildSeededCase(303, 4, 7, 15, 14),
      buildSeededCase(404, 2, 8, 10, 10),
    ];

    for (const raw of cases) {
      const inv = solver.parse(raw);
      const actual = solver.solve(inv);
      expect(actual).toBe(sosDpOracle(inv));
      expect(actual).toBe(rawGridOverlapOracle(raw));
    }
  });
});
