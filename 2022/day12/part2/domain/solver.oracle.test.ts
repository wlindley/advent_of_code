import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../../shared/core';
import { type HeightMap, parseHeightMap } from '../../shared';
import { ANY_LOWEST_START_CONDITION, solver } from './index';

const OFFICIAL_EXAMPLE = [
  'Sabqponm',
  'abcryxxl',
  'accszExk',
  'acctuvwj',
  'abdefghi',
].join('\n');

class LcgRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextInt(bound: number): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state % bound;
  }
}

/** Shared forward-BFS engine from an explicit seed list (independent of reverseBfs.ts). */
function forwardBfsFromSeeds(map: HeightMap, seeds: readonly number[]): number | null {
  const dist = new Int32Array(map.size).fill(-1);
  const queue: number[] = [];
  for (const idx of seeds) {
    dist[idx] = 0;
    queue.push(idx);
  }
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++]!;
    if (curr === map.goalIndex) return dist[curr]!;
    const [r, c] = map.coordsOf(curr);
    const maxNext = map.heightAtIndex(curr) + 1;
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      if (!map.inBounds(nr, nc)) continue;
      const nextIdx = map.indexOf(nr, nc);
      if (dist[nextIdx] !== -1 || map.heightAtIndex(nextIdx) > maxNext) continue;
      dist[nextIdx] = dist[curr]! + 1;
      queue.push(nextIdx);
    }
  }
  return null;
}

/** Oracle A: multi-source forward BFS seeding all height-0 cells simultaneously at distance 0. */
function multiSourceForwardBfs(map: HeightMap): number | null {
  const seeds: number[] = [];
  for (let idx = 0; idx < map.size; idx += 1) {
    if (map.heightAtIndex(idx) === 0) seeds.push(idx);
  }
  return forwardBfsFromSeeds(map, seeds);
}

/** Oracle B: isolated per-source forward BFS across every height-0 cell, taking the minimum. */
function perSourceForwardBfs(map: HeightMap): number | null {
  let best: number | null = null;
  for (let idx = 0; idx < map.size; idx += 1) {
    if (map.heightAtIndex(idx) !== 0) continue;
    const d = forwardBfsFromSeeds(map, [idx]);
    if (d !== null && (best === null || d < best)) best = d;
  }
  return best;
}

function snakeIndexToCell(step: number, cols: number): number {
  const row = Math.floor(step / cols);
  const offset = step % cols;
  const col = row % 2 === 0 ? offset : cols - 1 - offset;
  return row * cols + col;
}

function formatCharsAsMap(chars: readonly string[], rows: number, cols: number): HeightMap {
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    lines.push(chars.slice(r * cols, (r + 1) * cols).join(''));
  }
  return parseHeightMap(lines.join('\n'));
}

/** Builds a reachable-by-construction ramped grid with extra 'a' starts, jitter, and cliff drops. */
function generateRampedHeightMap(rng: LcgRng, rows: number, cols: number): HeightMap {
  const size = rows * cols;
  const chars = new Array<string>(size).fill('a');
  const startStep = rng.nextInt(2) === 0 ? 0 : 26 + rng.nextInt(size - 26);
  for (let step = 0; step < size; step += 1) {
    const idx = snakeIndexToCell(step, cols);
    if (step === startStep) chars[idx] = 'S';
    else if (step === 25) chars[idx] = 'E';
    else if (step < 25) chars[idx] = String.fromCharCode(97 + step);
    else {
      const roll = rng.nextInt(6);
      chars[idx] = roll === 0 ? 'a' : roll === 1 ? 'z' : String.fromCharCode(97 + rng.nextInt(26));
    }
  }
  return formatCharsAsMap(chars, rows, cols);
}

function generateUniformHeightMap(rng: LcgRng, rows: number, cols: number): HeightMap {
  const size = rows * cols;
  const startIdx = rng.nextInt(size);
  let goalIdx = rng.nextInt(size);
  if (goalIdx === startIdx) goalIdx = (startIdx + 1) % size;
  const chars: string[] = [];
  for (let i = 0; i < size; i += 1) {
    if (i === startIdx) chars.push('S');
    else if (i === goalIdx) chars.push('E');
    else chars.push(String.fromCharCode(97 + rng.nextInt(26)));
  }
  return formatCharsAsMap(chars, rows, cols);
}

function assertMatchesBothOracles(map: HeightMap): void {
  const expectedMulti = multiSourceForwardBfs(map);
  const expectedPerSource = perSourceForwardBfs(map);
  expect(expectedMulti).toBe(expectedPerSource);
  if (expectedMulti === null) {
    expect(() => solver.solve(map)).toThrow(
      new RegExp(`No reachable start cell matching "${ANY_LOWEST_START_CONDITION.label.replace(/[()]/g, '\\$&')}"`),
    );
  } else {
    expect(solver.solve(map)).toBe(expectedMulti);
  }
}

describe('Part 2 forward BFS oracles vs reverse BFS solver', () => {
  it('matches both oracles on official example and deterministic edge grids', () => {
    const deterministic = [
      OFFICIAL_EXAMPLE,
      'acSbcdefghijklmnopqrstuvwxyE',
      'ScabcdefghijklmnopqrstuvwxyzE',
      'SbcdefghijklmnopqrstuvwxyE',
      'zSzzzzzzzzzzzzzzzzzzzzzzzz\nzbcdefghijklmnopqrstuvwxyE\nzazzzzzzzzzzzzzzzzzzzzzzzz',
      'SbcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyE',
      'SE',
      'Sac\nzzz\nzEa',
    ];
    for (const raw of deterministic) {
      assertMatchesBothOracles(parseHeightMap(raw));
    }
  });

  it('matches across 20 ramped reachable-by-construction grids and 15 uniform random grids', () => {
    const rng = new LcgRng(20221202);
    for (let i = 0; i < 20; i += 1) {
      const rows = 5 + rng.nextInt(5);
      const cols = 6 + rng.nextInt(5);
      const map = generateRampedHeightMap(rng, rows, cols);
      expect(multiSourceForwardBfs(map)).not.toBeNull();
      assertMatchesBothOracles(map);
    }
    for (let i = 0; i < 15; i += 1) {
      const rows = 2 + rng.nextInt(9);
      const cols = 2 + rng.nextInt(11);
      assertMatchesBothOracles(generateUniformHeightMap(rng, rows, cols));
    }
  });
});
