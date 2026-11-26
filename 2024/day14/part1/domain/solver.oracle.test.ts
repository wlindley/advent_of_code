import { describe, expect, it } from 'vitest';
import { EXAMPLE_REDOUBT_SPACE, Robot, TorusSpace, parseRobots } from '../../shared';
import { createPart1Solver } from './index';

const EXAMPLE_INPUT = [
  'p=0,4 v=3,-3',
  'p=6,3 v=-1,-3',
  'p=10,3 v=-1,2',
  'p=2,0 v=2,-1',
  'p=0,0 v=1,3',
  'p=3,0 v=-2,-2',
  'p=7,6 v=-1,-3',
  'p=3,0 v=-1,-2',
  'p=9,3 v=2,3',
  'p=7,3 v=-1,2',
  'p=2,4 v=2,-3',
  'p=9,5 v=-3,-3',
].join('\n');

function tickByTickOracle(robots: readonly Robot[], space: TorusSpace, seconds: number): number {
  const xs = robots.map((r) => r.x);
  const ys = robots.map((r) => r.y);
  for (let t = 0; t < seconds; t += 1) {
    for (let i = 0; i < robots.length; i += 1) {
      const r = robots[i]!;
      let nx = (xs[i]! + r.vx) % space.width;
      if (nx < 0) nx += space.width;
      let ny = (ys[i]! + r.vy) % space.height;
      if (ny < 0) ny += space.height;
      xs[i] = nx;
      ys[i] = ny;
    }
  }
  const grid: number[][] = Array.from({ length: space.height }, () =>
    Array.from({ length: space.width }, () => 0),
  );
  for (let i = 0; i < robots.length; i += 1) {
    grid[ys[i]!]![xs[i]!]! += 1;
  }
  const midX = (space.width - 1) / 2;
  const midY = (space.height - 1) / 2;
  let q0 = 0;
  let q1 = 0;
  let q2 = 0;
  let q3 = 0;
  for (let y = 0; y < space.height; y += 1) {
    if (y === midY) continue;
    for (let x = 0; x < space.width; x += 1) {
      if (x === midX) continue;
      const count = grid[y]![x]!;
      if (x < midX && y < midY) q0 += count;
      else if (x > midX && y < midY) q1 += count;
      else if (x < midX && y > midY) q2 += count;
      else q3 += count;
    }
  }
  return q0 * q1 * q2 * q3;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state;
  };
}

describe('part1 differential oracle', () => {
  it('matches tick-by-tick oracle on official example and single-robot wrap trajectory', () => {
    const robots = parseRobots(EXAMPLE_INPUT);
    expect(createPart1Solver(EXAMPLE_REDOUBT_SPACE, 100).solve(robots)).toBe(
      tickByTickOracle(robots, EXAMPLE_REDOUBT_SPACE, 100),
    );
    const single = [new Robot(2, 4, 2, -3)];
    const expected = [
      [2, 4],
      [4, 1],
      [6, 5],
      [8, 2],
      [10, 6],
      [1, 3],
    ];
    for (let t = 0; t < expected.length; t += 1) {
      expect(single[0]!.positionAt(EXAMPLE_REDOUBT_SPACE, t)).toEqual({
        x: expected[t]![0],
        y: expected[t]![1],
      });
    }
  });

  it('matches oracle on multi-period wraps, crosshairs, stacked robots, and 1x1 space', () => {
    const space = new TorusSpace(7, 5);
    const robots = [
      new Robot(3, 2, 0, 0), // center crosshair
      new Robot(3, 0, 7, 5), // returns to x=midX every step
      new Robot(0, 0, 0, 0),
      new Robot(0, 0, 0, 0), // stacked
      new Robot(6, 0, -14, 10),
      new Robot(0, 4, 21, -15),
      new Robot(6, 4, -70, -50),
    ];
    for (const t of [0, 1, 35, 100, 350]) {
      expect(createPart1Solver(space, t).solve(robots)).toBe(tickByTickOracle(robots, space, t));
    }
    const tiny = new TorusSpace(1, 1);
    const tinyRobots = [new Robot(0, 0, 3, -5), new Robot(0, 0, -2, 4)];
    expect(createPart1Solver(tiny, 100).solve(tinyRobots)).toBe(0);
    expect(tickByTickOracle(tinyRobots, tiny, 100)).toBe(0);
  });

  it('matches tick-by-tick oracle across 60 seeded deterministic random swarms', () => {
    const next = makeRng(20241401);
    for (let trial = 0; trial < 60; trial += 1) {
      const width = 3 + 2 * (next() % 11);
      const height = 3 + 2 * (next() % 11);
      const space = new TorusSpace(width, height);
      const count = 4 + (next() % 35);
      const seconds = next() % 180;
      const robots: Robot[] = [];
      for (let i = 0; i < count; i += 1) {
        const x = next() % width;
        const y = next() % height;
        const vx = (next() % 61) - 30;
        const vy = (next() % 61) - 30;
        robots.push(new Robot(x, y, vx, vy));
      }
      expect(createPart1Solver(space, seconds).solve(robots)).toBe(
        tickByTickOracle(robots, space, seconds),
      );
    }
  });
});
