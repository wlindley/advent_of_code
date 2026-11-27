import { describe, expect, it } from 'vitest';
import { DIRS_4, executeSolver } from '../../../../shared/core';
import type { VaultMap } from '../../shared';
import { solver } from './index';

const EXAMPLE_1_UNSPLIT = [
  '#######',
  '#a.#Cd#',
  '##...##',
  '##.@.##',
  '##...##',
  '#cB#Ab#',
  '#######',
].join('\n');

const EXAMPLE_1_SPLIT = [
  '#######',
  '#a.#Cd#',
  '##@#@##',
  '#######',
  '##@#@##',
  '#cB#Ab#',
  '#######',
].join('\n');

const EXAMPLE_2 = [
  '###############',
  '#d.ABC.#.....a#',
  '######@#@######',
  '###############',
  '######@#@######',
  '#b.....#.....c#',
  '###############',
].join('\n');

const EXAMPLE_3 = [
  '#############',
  '#DcBa.#.GhKl#',
  '#.###@#@#I###',
  '#e#d#####j#k#',
  '###C#@#@###J#',
  '#fEbA.#.FgHi#',
  '#############',
].join('\n');

const EXAMPLE_4 = [
  '#############',
  '#g#f.D#..h#l#',
  '#F###e#E###.#',
  '#dCba@#@BcIJ#',
  '#############',
  '#nK.L@#@G...#',
  '#M###N#H###.#',
  '#o#m..#i#jk.#',
  '#############',
].join('\n');

const TINY_CYCLIC_IDLE_VAULT = [
  '#########',
  '#a..#@Ab#',
  '#..@#...#',
  '#########',
  '#.B@#@###',
  '#c#.#.###',
  '#########',
].join('\n');

interface RawBfsState {
  readonly robots: readonly number[];
  readonly mask: number;
  readonly dist: number;
}

function expandQuadBfsStep(
  map: VaultMap,
  state: RawBfsState,
  visited: Set<string>,
  queue: RawBfsState[],
): void {
  for (let i = 0; i < 4; i += 1) {
    const pt = map.pointOf(state.robots[i]!);
    for (const [dr, dc] of DIRS_4) {
      const nr = pt.row + dr;
      const nc = pt.col + dc;
      if (nr < 0 || nr >= map.rows || nc < 0 || nc >= map.cols) continue;
      const nextCell = map.cellOf(nr, nc);
      if (map.isWallCell(nextCell)) continue;
      const doorBit = map.doorBitAtCell(nextCell);
      if (doorBit !== 0 && (state.mask & doorBit) === 0) continue;
      const keyId = map.keyIdAtCell(nextCell);
      const nextMask = keyId >= 0 ? state.mask | map.keyBitById(keyId) : state.mask;
      const nextRobots = [state.robots[0]!, state.robots[1]!, state.robots[2]!, state.robots[3]!];
      nextRobots[i] = nextCell;
      const key = `${nextRobots[0]},${nextRobots[1]},${nextRobots[2]},${nextRobots[3]}:${nextMask}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ robots: nextRobots, mask: nextMask, dist: state.dist + 1 });
    }
  }
}

function rawQuadGridBfsOracle(raw: string): number {
  const map = solver.parse(raw);
  const startRobots: number[] = [];
  for (const entrance of map.entrances) {
    startRobots.push(map.cellOf(entrance.row, entrance.col));
  }
  const queue: RawBfsState[] = [{ robots: startRobots, mask: 0, dist: 0 }];
  const visited = new Set<string>([`${startRobots.join(',')}:0`]);
  const goalMask = map.allKeysMask;
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head]!;
    head += 1;
    if (cur.mask === goalMask) return cur.dist;
    expandQuadBfsStep(map, cur, visited, queue);
  }
  throw new Error('Unreachable in raw BFS oracle');
}

function sumTrailSteps(trailLengths: readonly number[]): number {
  let total = 0;
  for (const len of trailLengths) total += len - 1;
  return total;
}

describe('2019 Day 18 Part 2 solver', () => {
  it('solves all 4 official examples accurately', () => {
    expect(executeSolver(solver, EXAMPLE_1_UNSPLIT).answer).toBe(8);
    expect(executeSolver(solver, EXAMPLE_1_SPLIT).answer).toBe(8);
    expect(executeSolver(solver, EXAMPLE_2).answer).toBe(24);
    expect(executeSolver(solver, EXAMPLE_3).answer).toBe(32);
    expect(executeSolver(solver, EXAMPLE_4).answer).toBe(72);
  });

  it('matches a raw 4-robot grid BFS oracle on tiny vaults', () => {
    expect(executeSolver(solver, EXAMPLE_1_SPLIT).answer).toBe(rawQuadGridBfsOracle(EXAMPLE_1_SPLIT));
    expect(executeSolver(solver, TINY_CYCLIC_IDLE_VAULT).answer).toBe(8);
    expect(executeSolver(solver, TINY_CYCLIC_IDLE_VAULT).answer).toBe(
      rawQuadGridBfsOracle(TINY_CYCLIC_IDLE_VAULT),
    );
  });

  it('produces bounded trace frames with shared frozen trails and live robot metrics', () => {
    const map = solver.parse(EXAMPLE_4);
    const frames = solver.trace(map, { maxSteps: 40 });
    expect(frames.length).toBe(40);
    const first = frames[0]!;
    expect(first.stepIndex).toBe(0);
    expect(first.totalSteps).toBe(72);
    expect(first.collectedMask).toBe(0);
    expect(first.activeRobotIndex).toBe(-1);
    expect(first.trailLengths).toEqual([1, 1, 1, 1]);
    expect(first.robotTrails.length).toBe(4);
    expect(Object.isFrozen(first.robotTrails)).toBe(true);
    expect(first.expandedStates).toBeGreaterThan(0);

    const last = frames[frames.length - 1]!;
    expect(last.stepIndex).toBe(72);
    expect(last.totalSteps).toBe(72);
    expect(last.collectedMask).toBe(map.allKeysMask);
    expect(last.activeRobotIndex).toBeGreaterThanOrEqual(0);
    expect(last.activeRobotIndex).toBeLessThanOrEqual(3);
    expect(sumTrailSteps(last.trailLengths)).toBe(72);
    expect(last.robotTrails).toBe(first.robotTrails);
    expect(last.expandedStates).toBeGreaterThan(0);
  });

  it('handles zero-key vaults and rejects invalid entrance counts, splits, and unreachable keys', () => {
    const zeroKeyMap = solver.parse('@#@\n###\n@#@');
    expect(solver.solve(zeroKeyMap)).toBe(0);
    const zeroFrames = solver.trace(zeroKeyMap);
    expect(zeroFrames.length).toBe(1);
    expect(zeroFrames[0]!.totalSteps).toBe(0);

    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('@.@\n...\n###')).toThrow(/1 or 4 entrances/);
    expect(() => solver.parse('@.@\n.#.\n.@.')).toThrow(/1 or 4 entrances/);
    expect(() => solver.parse('#@#\n#.#\n###')).toThrow(/strictly interior/);
    expect(() => solver.parse('#####\n#.#.#\n#.@.#\n#...#\n#####')).toThrow(/8 open neighbors/);
    expect(() => solver.solve(solver.parse('@#@\n###\n@#@\n#a#'))).toThrow(/unreachable/);
  });
});
