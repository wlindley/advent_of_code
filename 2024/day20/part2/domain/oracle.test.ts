import { describe, expect, it } from 'vitest';
import { type Racetrack, UNREACHABLE, parseRacetrack } from '../../shared';
import { solvePart2 } from './index';

const EXAMPLE_TRACK = [
  '###############',
  '#...#...#.....#',
  '#.#.#.#.#.###.#',
  '#S#...#.#.#...#',
  '#######.#.#.###',
  '#######.#.#...#',
  '#######.#.###.#',
  '###..E#...#...#',
  '###.#######.###',
  '#...###...#...#',
  '#.#####.#.###.#',
  '#.#...#.#.#...#',
  '#.#.#.#.#.#.###',
  '#...#...#...###',
  '###############',
].join('\n');

const EDGE_CASE_TRACKS = [
  // Branching track with dead ends
  ['S...#...', '.##.#.#.', '....#.#.', '###...#E', '#.#.###.', '#.......'].join('\n'),
  // Disconnected S and E
  ['S..#..E', '###.###', '.......'].join('\n'),
  // Unreachable open pocket inside walls
  ['S...###', '###.#.#', 'E...###'].join('\n'),
];

function bfsFrom(track: Racetrack, startRow: number, startCol: number): Int32Array {
  const dist = new Int32Array(track.cellCount).fill(UNREACHABLE);
  const startIdx = track.indexOf(startRow, startCol);
  const queue = [startIdx];
  dist[startIdx] = 0;
  for (let head = 0; head < queue.length; head += 1) {
    const idx = queue[head]!;
    const col = idx % track.cols;
    const row = (idx - col) / track.cols;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = row + dr;
      const nc = col + dc;
      if (!track.inBounds(nr, nc) || track.isWall(nr, nc)) continue;
      const nIdx = nr * track.cols + nc;
      if (dist[nIdx] !== UNREACHABLE) continue;
      dist[nIdx] = dist[idx]! + 1;
      queue.push(nIdx);
    }
  }
  return dist;
}

function allPairsOraclePart2(track: Racetrack, minSaving: number): number {
  const distS = bfsFrom(track, track.start.row, track.start.col);
  const distE = bfsFrom(track, track.end.row, track.end.col);
  const baseline = distS[track.endIndex]!;
  if (baseline === UNREACHABLE) return 0;

  let count = 0;
  for (let u = 0; u < track.cellCount; u += 1) {
    const ds = distS[u]!;
    if (ds === UNREACHABLE) continue;
    const uCol = u % track.cols;
    const uRow = (u - uCol) / track.cols;
    for (let v = 0; v < track.cellCount; v += 1) {
      const de = distE[v]!;
      if (de === UNREACHABLE) continue;
      const vCol = v % track.cols;
      const vRow = (v - vCol) / track.cols;
      const d = Math.abs(uRow - vRow) + Math.abs(uCol - vCol);
      if (d >= 2 && d <= 20 && baseline - (ds + d + de) >= minSaving) {
        count += 1;
      }
    }
  }
  return count;
}

function buildSeededMaze(seed: number, rows: number, cols: number): Racetrack {
  let state = seed >>> 0;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r += 1) {
    const row: string[] = [];
    for (let c = 0; c < cols; c += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      row.push(state / 0x100000000 < 0.32 ? '#' : '.');
    }
    grid.push(row);
  }
  grid[0]![0] = 'S';
  grid[rows - 1]![cols - 1] = 'E';
  return parseRacetrack(grid.map((row) => row.join('')).join('\n'));
}

describe('solvePart2 independent O(T^2) all-pairs oracle', () => {
  it('matches oracle on official example, edge-case tracks, and 8 seeded mazes', () => {
    const example = parseRacetrack(EXAMPLE_TRACK);
    for (const minSaving of [1, 50, 72, 76, 84]) {
      expect(solvePart2(example, minSaving)).toBe(allPairsOraclePart2(example, minSaving));
    }

    for (const raw of EDGE_CASE_TRACKS) {
      const track = parseRacetrack(raw);
      for (const minSaving of [1, 4, 10]) {
        expect(solvePart2(track, minSaving)).toBe(allPairsOraclePart2(track, minSaving));
      }
    }

    for (let i = 0; i < 8; i += 1) {
      const rows = 9 + (i % 7);
      const cols = 9 + ((i * 5) % 7);
      const maze = buildSeededMaze(202420 + i * 97, rows, cols);
      for (const minSaving of [1, 4, 10, 20]) {
        expect(solvePart2(maze, minSaving)).toBe(allPairsOraclePart2(maze, minSaving));
      }
    }
  });
});
