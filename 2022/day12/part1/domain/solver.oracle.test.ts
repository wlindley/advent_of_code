import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../../shared/core';
import {
  createHillClimbingSolver,
  type HeightMap,
  parseHeightMap,
  type StartCondition,
} from '../../shared';
import { FIXED_START_CONDITION, solver } from './index';

const OFFICIAL_EXAMPLE = [
  'Sabqponm',
  'abcryxxl',
  'accszExk',
  'acctuvwj',
  'abdefghi',
].join('\n');

const ANY_LOWEST_CONDITION: StartCondition = Object.freeze({
  label: 'Any lowest (a)',
  matches: (map: HeightMap, index: number) => map.heightAtIndex(index) === 0,
});

const PART2_CANDIDATE_SOLVER = createHillClimbingSolver(ANY_LOWEST_CONDITION);

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

/** Independent multi-source forward BFS oracle (no shared code with reverseBfs.ts). */
function forwardBfsOracle(map: HeightMap, condition: StartCondition): number | null {
  const dist = new Int32Array(map.size).fill(-1);
  const queue: number[] = [];
  for (let idx = 0; idx < map.size; idx += 1) {
    if (condition.matches(map, idx)) {
      dist[idx] = 0;
      queue.push(idx);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++]!;
    if (curr === map.goalIndex) return dist[curr]!;
    const [r, c] = map.coordsOf(curr);
    const maxNextHeight = map.heightAtIndex(curr) + 1;
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      if (!map.inBounds(nr, nc)) continue;
      const nextIdx = map.indexOf(nr, nc);
      if (dist[nextIdx] !== -1 || map.heightAtIndex(nextIdx) > maxNextHeight) continue;
      dist[nextIdx] = dist[curr]! + 1;
      queue.push(nextIdx);
    }
  }
  return null;
}

function generateRandomHeightMap(rng: LcgRng, rows: number, cols: number): HeightMap {
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
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    lines.push(chars.slice(r * cols, (r + 1) * cols).join(''));
  }
  return parseHeightMap(lines.join('\n'));
}

function assertMatchesOracle(map: HeightMap): void {
  const p1Expected = forwardBfsOracle(map, FIXED_START_CONDITION);
  if (p1Expected === null) {
    expect(() => solver.solve(map)).toThrow(/No reachable start/);
  } else {
    expect(solver.solve(map)).toBe(p1Expected);
  }

  const p2Expected = forwardBfsOracle(map, ANY_LOWEST_CONDITION);
  if (p2Expected === null) {
    expect(() => PART2_CANDIDATE_SOLVER.solve(map)).toThrow(/No reachable start/);
  } else {
    expect(PART2_CANDIDATE_SOLVER.solve(map)).toBe(p2Expected);
  }
}

describe('Forward BFS oracle vs reverse BFS solver', () => {
  it('matches Part 1 (31) and Part 2 (29) on the official 5x8 example', () => {
    const map = parseHeightMap(OFFICIAL_EXAMPLE);
    expect(forwardBfsOracle(map, FIXED_START_CONDITION)).toBe(31);
    expect(forwardBfsOracle(map, ANY_LOWEST_CONDITION)).toBe(29);
    assertMatchesOracle(map);
  });

  it('matches on steep-drop shortcuts, unreachable pockets, and 1D corridors', () => {
    const steepDrop = parseHeightMap('SbcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyE');
    const walledPocket = parseHeightMap('acSbcdefghijklmnopqrstuvwxyE');
    const horiz = parseHeightMap('SbcdefghijklmnopqrstuvwxyE');
    const vert = parseHeightMap('SbcdefghijklmnopqrstuvwxyE'.split('').join('\n'));
    const blocked = parseHeightMap('Sac\nzzz\nzEa');
    for (const map of [steepDrop, walledPocket, horiz, vert, blocked]) {
      assertMatchesOracle(map);
    }
  });

  it('matches across 60 seeded random heightmaps in both Part 1 and Part 2 modes', () => {
    const rng = new LcgRng(20221201);
    for (let i = 0; i < 60; i += 1) {
      const rows = 2 + rng.nextInt(10);
      const cols = 2 + rng.nextInt(12);
      const map = generateRandomHeightMap(rng, rows, cols);
      assertMatchesOracle(map);
    }
  });
});
