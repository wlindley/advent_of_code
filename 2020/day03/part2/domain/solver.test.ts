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

const PART2_DELTAS: readonly (readonly [number, number])[] = [[1, 1], [3, 1], [5, 1], [7, 1], [1, 2]];

class SequenceClock implements Clock {
  readonly #times: readonly number[];
  #index = 0;
  constructor(times: readonly number[]) { this.#times = times; }
  nowMs(): number {
    const value = this.#times[this.#index] ?? this.#times[this.#times.length - 1] ?? 0;
    this.#index += 1;
    return value;
  }
}

class SeededLcg {
  #state: number;
  constructor(seed: number) { this.#state = seed >>> 0; }
  nextUnit(): number {
    this.#state = (Math.imul(1664525, this.#state) + 1013904223) >>> 0;
    return this.#state / 0x100000000;
  }
}

function buildRandomForest(rng: SeededLcg, rows: number, cols: number): string {
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) line += rng.nextUnit() < 0.35 ? '#' : '.';
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
    const tiledRow = baseLine.repeat(Math.floor(col / baseLine.length) + 1);
    if (tiledRow[col] === '#') trees += 1;
    row += down;
    col += right;
  }
  return BigInt(trees);
}

function bruteForcePart2Product(raw: string): bigint {
  let product = 1n;
  for (let i = 0; i < PART2_DELTAS.length; i += 1) {
    const [right, down] = PART2_DELTAS[i]!;
    product *= bruteForceTiledTreeCount(raw, right, down);
  }
  return product;
}

function collectFrameTreeCounts(frame: ReturnType<NonNullable<typeof solver.trace>>[number]): number[] {
  const counts: number[] = [];
  for (let i = 0; i < frame.slopes.length; i += 1) counts.push(frame.slopes[i]!.treeCount);
  return counts;
}

function assertParseError(raw: string, errorType: typeof Error): void {
  let caught: unknown;
  try { solver.parse(raw); } catch (error) { caught = error; }
  expect(caught).toBeInstanceOf(errorType);
}

function assertZeroMaxStepsError(raw: string): void {
  const forest = solver.parse(raw);
  let caught: unknown;
  try { solver.trace!(forest, { maxSteps: 0 }); } catch (error) { caught = error; }
  expect(caught).toBeInstanceOf(RangeError);
}

describe('2020 Day 3 Part 2 solver', () => {
  it('solves the official 11x11 example to 336n and verifies uncapped and capped traces', () => {
    const forest = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(forest)).toBe(336n);

    const fullTrace = solver.trace!(forest);
    expect(fullTrace).toHaveLength(11);
    for (let i = 0; i < 5; i += 1) expect(fullTrace[0]!.slopes[i]!.activeLanding).toBeNull();
    for (let i = 0; i < 4; i += 1) expect(fullTrace[1]!.slopes[i]!.activeLanding?.stepIndex).toBe(1);
    expect(fullTrace[1]!.slopes[4]!.activeLanding).toBeNull();
    expect(fullTrace[2]!.slopes[4]!.activeLanding?.stepIndex).toBe(1);
    expect(collectFrameTreeCounts(fullTrace[10]!)).toEqual([2, 7, 3, 4, 2]);
    expect(fullTrace[10]!.treeProduct).toBe(336n);

    const cappedTrace = solver.trace!(forest, { maxSteps: 5 });
    expect(cappedTrace).toHaveLength(5);
    expect(collectFrameTreeCounts(cappedTrace[4]!)).toEqual([2, 7, 3, 4, 2]);
    expect(cappedTrace[4]!.treeProduct).toBe(336n);
  });

  it('handles boundary heights R=1..5 and zero-factor grids', () => {
    expect(solver.solve(solver.parse('#'))).toBe(0n);
    expect(solver.solve(solver.parse('.'))).toBe(0n);
    expect(solver.solve(solver.parse('#\n#'))).toBe(0n);
    expect(solver.solve(solver.parse('...\n###\n#.#'))).toBe(0n);
    expect(solver.solve(solver.parse('#\n#\n#\n#'))).toBe(81n);
    expect(solver.solve(solver.parse('#\n#\n#\n#\n#'))).toBe(512n);
  });

  it('preserves exact BigInt precision above MAX_SAFE_INTEGER on R=2004', () => {
    const answer = solver.solve(solver.parse('#\n'.repeat(2004)));
    expect(answer).toBe(2003n ** 4n * 1001n);
    expect(answer > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(answer % 2n).toBe(1n);
  });

  it('matches an independent brute-force string-tiling oracle across 35 seeded grids', () => {
    const rng = new SeededLcg(202012032);
    const colWidths = [1, 2, 5, 7, 31];
    const rowHeights = [1, 2, 3, 4, 5, 16, 41];
    for (let ci = 0; ci < colWidths.length; ci += 1) {
      for (let ri = 0; ri < rowHeights.length; ri += 1) {
        const raw = buildRandomForest(rng, rowHeights[ri]!, colWidths[ci]!);
        expect(solver.solve(solver.parse(raw))).toBe(bruteForcePart2Product(raw));
      }
    }
  });

  it('rejects empty input with Error', () => { assertParseError('', Error); });
  it('rejects non-grid characters with SyntaxError', () => { assertParseError('..#\n..@', SyntaxError); });
  it('rejects jagged rows with Error', () => { assertParseError('..#\n..', Error); });
  it('rejects maxSteps: 0 with RangeError', () => { assertZeroMaxStepsError(OFFICIAL_EXAMPLE); });

  it('executes with executeSolver and a deterministic SequenceClock', () => {
    const execution = executeSolver(solver, OFFICIAL_EXAMPLE, new SequenceClock([10.5, 18.25]));
    expect(execution).toEqual({ answer: 336n, elapsedMs: 7.75, runtime: 'main-thread' });
  });
});
