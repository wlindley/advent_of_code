import { describe, expect, it } from 'vitest';
import { computeBfsDistances } from './bfs';
import { analyzeCheats } from './cheats';
import { CheatConfig, type Racetrack, UNREACHABLE } from './model';
import { parseRacetrack } from './parser';

function allPairsOracle(track: Racetrack, config: CheatConfig): Map<number, number> {
  const field = computeBfsDistances(track);
  const baseline = field.baseline;
  const counts = new Map<number, number>();
  if (baseline === UNREACHABLE) return counts;

  const open: Array<{ r: number; c: number; ds: number; de: number }> = [];
  for (let r = 0; r < track.rows; r += 1) {
    for (let c = 0; c < track.cols; c += 1) {
      if (!track.isWall(r, c)) {
        open.push({ r, c, ds: field.distanceFromStart(r, c), de: field.distanceFromEnd(r, c) });
      }
    }
  }
  for (const u of open) {
    if (u.ds === UNREACHABLE) continue;
    for (const v of open) {
      if (v.de === UNREACHABLE) continue;
      const d = Math.abs(u.r - v.r) + Math.abs(u.c - v.c);
      if (d < 2 || d > config.maxDuration) continue;
      const saving = baseline - (u.ds + d + v.de);
      if (saving >= config.minSaving) counts.set(saving, (counts.get(saving) ?? 0) + 1);
    }
  }
  return counts;
}

function plainBfsGrid(track: Racetrack, sr: number, sc: number): Int32Array {
  const dist = new Int32Array(track.cellCount).fill(UNREACHABLE);
  const queue: number[] = [track.indexOf(sr, sc)];
  dist[queue[0]!] = 0;
  for (let i = 0; i < queue.length; i += 1) {
    const idx = queue[i]!;
    const c = idx % track.cols;
    const r = (idx - c) / track.cols;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (!track.inBounds(nr, nc) || track.isWall(nr, nc)) continue;
      const nIdx = nr * track.cols + nc;
      if (dist[nIdx] !== UNREACHABLE) continue;
      dist[nIdx] = dist[idx]! + 1;
      queue.push(nIdx);
    }
  }
  return dist;
}

function perCheatFullBfsOracle(track: Racetrack, config: CheatConfig): Map<number, number> {
  const distFromS = plainBfsGrid(track, track.start.row, track.start.col);
  const baseline = distFromS[track.endIndex]!;
  const counts = new Map<number, number>();
  if (baseline === UNREACHABLE) return counts;

  const open: Array<{ r: number; c: number; idx: number }> = [];
  for (let r = 0; r < track.rows; r += 1) {
    for (let c = 0; c < track.cols; c += 1) {
      if (!track.isWall(r, c)) open.push({ r, c, idx: track.indexOf(r, c) });
    }
  }
  for (const u of open) {
    const ds = distFromS[u.idx]!;
    if (ds === UNREACHABLE) continue;
    for (const v of open) {
      const d = Math.abs(u.r - v.r) + Math.abs(u.c - v.c);
      if (d < 2 || d > config.maxDuration) continue;
      const de = plainBfsGrid(track, v.r, v.c)[track.endIndex]!;
      if (de === UNREACHABLE) continue;
      const saving = baseline - (ds + d + de);
      if (saving >= config.minSaving) counts.set(saving, (counts.get(saving) ?? 0) + 1);
    }
  }
  return counts;
}

function seededMaze(seed: number, rows: number, cols: number): Racetrack {
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let row = '';
    for (let c = 0; c < cols; c += 1) row += next() < 0.35 ? '#' : '.';
    lines.push(row);
  }
  const grid = lines.map((l) => l.split(''));
  grid[0]![0] = 'S';
  grid[rows - 1]![cols - 1] = 'E';
  return parseRacetrack(grid.map((g) => g.join('')).join('\n'));
}

const FIXTURE_TRACKS = [
  ['###############', '#...#...#.....#', '#.#.#.#.#.###.#', '#S#...#.#.#...#', '#######.#.#.###',
   '#######.#.#...#', '#######.#.###.#', '###..E#...#...#', '###.#######.###', '#...###...#...#',
   '#.#####.#.###.#', '#.#...#.#.#...#', '#.#.#.#.#.#.###', '#...#...#...###', '###############'].join('\n'),
  ['S...#...', '.##.#.#.', '....#.#.', '###...#E', '#.#.###.', '#.......'].join('\n'),
  ['S.#..', '..#..', '....E', '.###.', '.#.#.'].join('\n'),
];

describe('analyzeCheats differential oracles', () => {
  it('matches O(T^2) and per-cheat full-BFS oracles across fixtures and 20 seeded mazes', () => {
    const tracks: Racetrack[] = FIXTURE_TRACKS.map(parseRacetrack);
    for (let i = 0; i < 20; i += 1) {
      tracks.push(seededMaze(1000 + i * 37, 5 + (i % 5), 5 + ((i * 3) % 5)));
    }

    for (const track of tracks) {
      const field = computeBfsDistances(track);
      const isTiny = track.rows <= 9 && track.cols <= 9;
      for (const k of [2, 4, 10, 20]) {
        const cfg = new CheatConfig(k, 1);
        const actual = new Map(analyzeCheats(field, cfg).buckets.map((b) => [b.saving, b.count]));
        expect(actual).toEqual(allPairsOracle(track, cfg));
        if (isTiny) expect(actual).toEqual(perCheatFullBfsOracle(track, cfg));
      }
    }
  });
});
