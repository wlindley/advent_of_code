import { describe, expect, it } from 'vitest';
import { parseHailstones, Vec3 } from './hailstone';
import { RockTrajectory, solveRockTrajectory } from './rockTrajectory';
import { buildRockTrace, DEFAULT_ROCK_TRACE_STEPS } from './rockTrace';

const EXAMPLE_INPUT = [
  '19, 13, 30 @ -2,  1, -2',
  '18, 19, 22 @ -1, -1, -2',
  '20, 25, 34 @ -2, -2, -4',
  '12, 31, 28 @ -1, -2, -1',
  '20, 19, 15 @  1, -5, -3',
].join('\n');

describe('buildRockTrace', () => {
  it('sorts collisions chronologically with BigInt-safe tie-breaking and shares sorted array', () => {
    const traj = solveRockTrajectory(parseHailstones(EXAMPLE_INPUT));
    const frames = buildRockTrace(traj);

    expect(DEFAULT_ROCK_TRACE_STEPS).toBe(120);
    expect(frames).toHaveLength(6);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames[0]!.step).toBe(0);
    expect(frames[0]!.activeCollision).toBeNull();
    expect(frames[0]!.rockPosition.equals(new Vec3(24n, 13n, 10n))).toBe(true);
    expect(frames[0]!.sortedCollisions).toBe(frames[5]!.sortedCollisions);
    expect(Object.isFrozen(frames[0]!.sortedCollisions)).toBe(true);
    expect(frames[0]!.sortedCollisions.map((c) => c.time)).toEqual([1n, 3n, 4n, 5n, 6n]);
    expect(frames[5]!.step).toBe(5);
    expect(frames[5]!.activeCollision).toEqual({ hailstoneId: 3, time: 6n });
    expect(frames[5]!.rockPosition.equals(new Vec3(6n, 19n, 22n))).toBe(true);
  });

  it('breaks equal collision times by hailstoneId and respects maxSteps', () => {
    const traj = new RockTrajectory(new Vec3(0n, 0n, 0n), new Vec3(1n, 0n, 0n), [
      { hailstoneId: 3, time: 10n },
      { hailstoneId: 1, time: 10n },
      { hailstoneId: 2, time: 5n },
      { hailstoneId: 0, time: 20n },
    ]);
    const bounded = buildRockTrace(traj, { maxSteps: 3 });
    expect(bounded).toHaveLength(3);
    expect(bounded[0]!.sortedCollisions.map((c) => c.hailstoneId)).toEqual([2, 1, 3, 0]);
    expect(bounded[0]!.step).toBe(0);
    expect(bounded[2]!.step).toBe(4);
    expect(bounded[2]!.activeCollision).toEqual({ hailstoneId: 0, time: 20n });
  });

  it('handles empty collision list cleanly', () => {
    const empty = new RockTrajectory(new Vec3(1n, 2n, 3n), new Vec3(4n, 5n, 6n), []);
    const frames = buildRockTrace(empty);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.totalCollisions).toBe(0);
    expect(frames[0]!.activeCollision).toBeNull();
    expect(frames[0]!.rockPosition.equals(new Vec3(1n, 2n, 3n))).toBe(true);
  });
});
