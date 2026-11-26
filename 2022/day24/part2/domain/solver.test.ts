import { describe, expect, it } from 'vitest';
import type { BlizzardBasin } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '#.######',
  '#>>.<^<#',
  '#.<..<<#',
  '#>v.><>#',
  '#<^v^^>#',
  '######.#',
].join('\n');

const BLOCKED_WAIT_3X5 = ['#.###', '#..>#', '#.###'].join('\n');

const DELTAS: readonly (readonly [number, number])[] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function isPassableAt(basin: BlizzardBasin, row: number, col: number, time: number): boolean {
  if (row === 0 && col === basin.startCol) return true;
  if (row === basin.height - 1 && col === basin.endCol) return true;
  if (row < 1 || row >= basin.height - 1 || col < 1 || col >= basin.width - 1) return false;
  return basin.blizzardMaskAt(row - 1, col - 1, time) === 0;
}

function advanceStage(basin: BlizzardBasin, row: number, col: number, stage: number): number {
  if (stage === 0 && row === basin.height - 1 && col === basin.endCol) return 1;
  if (stage === 1 && row === 0 && col === basin.startCol) return 2;
  if (stage === 2 && row === basin.height - 1 && col === basin.endCol) return 3;
  return stage;
}

function oracleJointBfs(basin: BlizzardBasin): number {
  const period = basin.period;
  const visited = new Set<string>([`0,${basin.startCol},0,0`]);
  const queue: Array<{ row: number; col: number; stage: number; time: number }> = [
    { row: 0, col: basin.startCol, stage: 0, time: 0 },
  ];
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head]!;
    const nextTime = cur.time + 1;
    const phase = nextTime % period;
    for (const [dr, dc] of DELTAS) {
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (!isPassableAt(basin, nr, nc, nextTime)) continue;
      const nextStage = advanceStage(basin, nr, nc, cur.stage);
      if (nextStage === 3) return nextTime;
      const key = `${nr},${nc},${nextStage},${phase}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ row: nr, col: nc, stage: nextStage, time: nextTime });
    }
  }
  throw new Error('Oracle: unreachable');
}

describe('Day 24 Part 2 solver', () => {
  it('solves the official 6x8 example in 54 minutes and empty 3x3 in 6', () => {
    expect(solver.solve(solver.parse(OFFICIAL_EXAMPLE))).toBe(54);
    expect(solver.solve(solver.parse('#.#\n#.#\n#.#'))).toBe(6);
  });

  it('waits at every waypoint on the 3x5 blocked-wait valley (9 minutes)', () => {
    expect(solver.solve(solver.parse(BLOCKED_WAIT_3X5))).toBe(9);
  });

  it('matches an independent joint (row, col, stage, phase) BFS oracle', () => {
    const official = solver.parse(OFFICIAL_EXAMPLE);
    const blocked = solver.parse(BLOCKED_WAIT_3X5);
    expect(solver.solve(official)).toBe(oracleJointBfs(official));
    expect(solver.solve(blocked)).toBe(oracleJointBfs(blocked));
  });

  it('traces all 3 legs, waypoint hits, blizzard-free interiors, and bounded sampling', () => {
    const basin = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(basin);
    expect(full).toHaveLength(55);
    expect(full[0]).toMatchObject({
      minute: 0,
      legIndex: 0,
      legCount: 3,
      action: 'start',
      position: { row: 0, col: 1 },
    });
    expect(full[18]).toMatchObject({ minute: 18, legIndex: 0, legCount: 3, position: { row: 5, col: 6 } });
    expect(full[41]).toMatchObject({ minute: 41, legIndex: 1, legCount: 3, position: { row: 0, col: 1 } });
    expect(full[54]).toMatchObject({ minute: 54, legIndex: 2, legCount: 3, position: { row: 5, col: 6 } });

    for (const frame of full) {
      const { row, col } = frame.position;
      if (row > 0 && row < basin.height - 1) {
        expect(basin.blizzardMaskAt(row - 1, col - 1, frame.minute)).toBe(0);
      }
    }

    const capped = solver.trace(basin, { maxSteps: 10 });
    expect(capped).toHaveLength(10);
    expect(capped[0]!.minute).toBe(0);
    expect(capped[9]!.minute).toBe(54);
  });

  it('rejects invalid inputs, invalid maxSteps, and permanently blocked valleys', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('#.#\n#.#')).toThrow(RangeError);
    const basin = solver.parse('#.#\n#.#\n#.#');
    expect(() => solver.trace(basin, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('#.#\n#<#\n#.#'))).toThrow();
  });
});
