import { describe, expect, it } from 'vitest';
import {
  BLIZZARD_DOWN, BLIZZARD_LEFT, BLIZZARD_RIGHT, BLIZZARD_UP, BlizzardBasin,
} from './basin';
import { solveLeg } from './legBfs';
import { parseBasin } from './parser';
import type { BasinWaypoint, LegResult } from './types';

const OFFICIAL_EXAMPLE = [
  '#.######', '#>>.<^<#', '#.<..<<#', '#>v.><>#', '#<^v^^>#', '######.#',
].join('\n');

function verifyPathLegal(basin: BlizzardBasin, leg: LegResult): void {
  for (let i = 0; i < leg.path.length; i += 1) {
    const cell = leg.path[i]!;
    const coord = basin.cellCoord(cell);
    if (cell !== basin.startCellId && cell !== basin.endCellId) {
      expect(basin.blizzardCountAt(coord.row - 1, coord.col - 1, leg.startTime + i)).toBe(0);
    }
    if (i > 0) {
      const prev = basin.cellCoord(leg.path[i - 1]!);
      expect(Math.abs(coord.row - prev.row) + Math.abs(coord.col - prev.col)).toBeLessThanOrEqual(1);
    }
  }
}

interface OracleBlizzard { r: number; c: number; dr: number; dc: number }

function extractBlizzards(basin: BlizzardBasin): OracleBlizzard[] {
  const list: OracleBlizzard[] = [];
  for (let ir = 0; ir < basin.innerHeight; ir += 1) {
    for (let ic = 0; ic < basin.innerWidth; ic += 1) {
      const m = basin.blizzardMaskAt(ir, ic, 0);
      if (m & BLIZZARD_UP) list.push({ r: ir, c: ic, dr: -1, dc: 0 });
      if (m & BLIZZARD_DOWN) list.push({ r: ir, c: ic, dr: 1, dc: 0 });
      if (m & BLIZZARD_LEFT) list.push({ r: ir, c: ic, dr: 0, dc: -1 });
      if (m & BLIZZARD_RIGHT) list.push({ r: ir, c: ic, dr: 0, dc: 1 });
    }
  }
  return list;
}

function oracleLegDuration(
  basin: BlizzardBasin, from: BasinWaypoint, to: BasinWaypoint, startTime: number,
): number {
  const startR = from === 'start' ? 0 : basin.height - 1;
  const startC = from === 'start' ? basin.startCol : basin.endCol;
  const targetR = to === 'start' ? 0 : basin.height - 1;
  const targetC = to === 'start' ? basin.startCol : basin.endCol;
  const blizzards = extractBlizzards(basin);
  const h = basin.innerHeight, w = basin.innerWidth, period = basin.period;
  const occupiedAt = Array.from({ length: period }, (_, t) => {
    const set = new Set<string>();
    for (const b of blizzards) {
      set.add(`${(((b.r + b.dr * t) % h) + h) % h + 1},${(((b.c + b.dc * t) % w) + w) % w + 1}`);
    }
    return set;
  });
  const queue = [{ r: startR, c: startC, t: startTime }];
  const seen = new Set<string>([`${startR},${startC},${startTime % period}`]);
  const deltas = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]] as const;
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head]!;
    const nt = cur.t + 1;
    const occ = occupiedAt[nt % period]!;
    for (const [dr, dc] of deltas) {
      const nr = cur.r + dr, nc = cur.c + dc;
      if (nr === targetR && nc === targetC) return nt - startTime;
      const isStart = nr === 0 && nc === basin.startCol;
      const isEnd = nr === basin.height - 1 && nc === basin.endCol;
      const isInner = nr >= 1 && nr <= h && nc >= 1 && nc <= w && !occ.has(`${nr},${nc}`);
      if (!isStart && !isEnd && !isInner) continue;
      const key = `${nr},${nc},${nt % period}`;
      if (!seen.has(key)) { seen.add(key); queue.push({ r: nr, c: nc, t: nt }); }
    }
  }
  return -1;
}

function makeSeededBasin(seed: number, height: number, width: number): BlizzardBasin {
  let s = seed >>> 0;
  const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s; };
  const innerH = height - 2, innerW = width - 2;
  const buf = new Uint8Array(innerH * innerW);
  const dirs = [0, 0, BLIZZARD_UP, BLIZZARD_DOWN, BLIZZARD_LEFT, BLIZZARD_RIGHT];
  for (let i = 0; i < buf.length; i += 1) buf[i] = dirs[next() % dirs.length]!;
  return new BlizzardBasin(height, width, 1 + (next() % innerW), 1 + (next() % innerW), buf);
}

describe('solveLeg', () => {
  it('solves all three official 6x8 legs (18, 23, 13 -> total 54) with legal paths', () => {
    const basin = parseBasin(OFFICIAL_EXAMPLE);
    const leg1 = solveLeg(basin, 'start', 'end', 0);
    expect(leg1.duration).toBe(18);
    expect(leg1.arrivalTime).toBe(18);
    expect(leg1.startCellId).toBe(basin.startCellId);
    expect(leg1.endCellId).toBe(basin.endCellId);
    verifyPathLegal(basin, leg1);

    const leg2 = solveLeg(basin, 'end', 'start', leg1.arrivalTime);
    expect(leg2.duration).toBe(23);
    expect(leg2.arrivalTime).toBe(41);
    verifyPathLegal(basin, leg2);

    const leg3 = solveLeg(basin, 'start', 'end', leg2.arrivalTime);
    expect(leg3.duration).toBe(13);
    expect(leg3.arrivalTime).toBe(54);
    verifyPathLegal(basin, leg3);
  });

  it('handles 3x3 empty, blocked valleys, coincident waypoints, and invalid startTime', () => {
    const empty = parseBasin('#.#\n#.#\n#.#');
    const leg = solveLeg(empty, 'start', 'end', 0);
    expect(leg.duration).toBe(2);
    verifyPathLegal(empty, leg);
    expect(() => solveLeg(parseBasin('#.#\n#<#\n#.#'), 'start', 'end', 0)).toThrow();

    const sameStart = solveLeg(empty, 'start', 'start', 5);
    expect(sameStart.duration).toBe(0);
    expect(Array.from(sameStart.path)).toEqual([empty.startCellId]);
    expect(Array.from(sameStart.frontierCounts)).toEqual([1]);

    const sameEnd = solveLeg(empty, 'end', 'end', 2);
    expect(sameEnd.duration).toBe(0);
    expect(Array.from(sameEnd.path)).toEqual([empty.endCellId]);
    expect(() => solveLeg(empty, 'start', 'end', -1)).toThrow(RangeError);
    expect(() => solveLeg(empty, 'start', 'end', 0.5)).toThrow(RangeError);
  });

  it('matches an independent Set-BFS oracle across official and seeded random valleys', () => {
    const basins = [parseBasin(OFFICIAL_EXAMPLE)];
    for (let i = 1; i <= 10; i += 1) {
      basins.push(makeSeededBasin(i * 97 + 13, 5 + (i % 3), 6 + (i % 4)));
    }
    for (const basin of basins) {
      const expected1 = oracleLegDuration(basin, 'start', 'end', 0);
      if (expected1 >= 0) {
        const leg1 = solveLeg(basin, 'start', 'end', 0);
        expect(leg1.duration).toBe(expected1);
        verifyPathLegal(basin, leg1);
        const expected2 = oracleLegDuration(basin, 'end', 'start', leg1.arrivalTime);
        if (expected2 >= 0) {
          const leg2 = solveLeg(basin, 'end', 'start', leg1.arrivalTime);
          expect(leg2.duration).toBe(expected2);
          verifyPathLegal(basin, leg2);
        }
      } else {
        expect(() => solveLeg(basin, 'start', 'end', 0)).toThrow();
      }
    }
  });
});
