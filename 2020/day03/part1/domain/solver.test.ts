import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '..##.......',
  '#...#...#..',
  '.#....#..#.',
  '..#.#...#.#',
  '.#...##..#.',
  '..#.##.....',
  '.#.#.#....#',
  '.#........#',
  '#.##...#...',
  '#...##....#',
  '.#..#...#.#',
].join('\n');

class SequenceClock implements Clock {
  readonly #times: readonly number[];
  #index = 0;

  constructor(times: readonly number[]) {
    this.#times = times;
  }

  nowMs(): number {
    const value = this.#times[this.#index] ?? this.#times[this.#times.length - 1] ?? 0;
    this.#index += 1;
    return value;
  }
}

class SeededLcg {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0;
  }

  nextUnit(): number {
    this.#state = (Math.imul(1664525, this.#state) + 1013904223) >>> 0;
    return this.#state / 0x100000000;
  }
}

function buildRandomForest(rng: SeededLcg, rows: number, cols: number): string {
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      line += rng.nextUnit() < 0.35 ? '#' : '.';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function bruteForceTiledTreeCount(raw: string, right: number, down: number): bigint {
  const lines = raw.split('\n');
  let row = down;
  let col = right;
  let trees = 0;
  while (row < lines.length) {
    const baseLine = lines[row]!;
    const repeats = Math.floor(col / baseLine.length) + 1;
    const tiledRow = baseLine.repeat(repeats);
    if (tiledRow[col] === '#') trees += 1;
    row += down;
    col += right;
  }
  return BigInt(trees);
}

describe('2020 Day 3 Part 1 solver', () => {
  it('solves the official 11x11 example to 7n and supports uncapped/capped traces', () => {
    const forest = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(forest)).toBe(7n);

    const fullTrace = solver.trace!(forest);
    expect(fullTrace).toHaveLength(11);
    expect(fullTrace[0]!.slopes[0]!.activeLanding).toBeNull();
    expect(fullTrace[fullTrace.length - 1]!.treeProduct).toBe(7n);

    const cappedTrace = solver.trace!(forest, { maxSteps: 5 });
    expect(cappedTrace).toHaveLength(5);
    expect(cappedTrace[cappedTrace.length - 1]!.treeProduct).toBe(7n);
  });

  it('propagates parse errors and executes cleanly with executeSolver and a stub Clock', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('..#\n..@')).toThrow(SyntaxError);

    const clock = new SequenceClock([12.5, 19.75]);
    const execution = executeSolver(solver, OFFICIAL_EXAMPLE, clock);
    expect(execution).toEqual({
      answer: 7n,
      elapsedMs: 7.25,
      runtime: 'main-thread',
    });
  });

  it('matches an independent string-tiling brute-force oracle across varied seeded grids', () => {
    const rng = new SeededLcg(20201203);
    const colWidths = [1, 3, 4, 11, 31];
    const rowHeights = [1, 2, 15, 50];
    for (let ci = 0; ci < colWidths.length; ci += 1) {
      for (let ri = 0; ri < rowHeights.length; ri += 1) {
        const raw = buildRandomForest(rng, rowHeights[ri]!, colWidths[ci]!);
        const expected = bruteForceTiledTreeCount(raw, 3, 1);
        expect(solver.solve(solver.parse(raw))).toBe(expected);
      }
    }
  });
});
