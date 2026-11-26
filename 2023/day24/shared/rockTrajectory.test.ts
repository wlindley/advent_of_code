import { describe, expect, it } from 'vitest';
import { Hailstone, parseHailstones, Vec3 } from './hailstone';
import { RockTrajectory, solveRockTrajectory } from './rockTrajectory';

const EXAMPLE_INPUT = [
  '19, 13, 30 @ -2,  1, -2',
  '18, 19, 22 @ -1, -1, -2',
  '20, 25, 34 @ -2, -2, -4',
  '12, 31, 28 @ -1, -2, -1',
  '20, 19, 15 @  1, -5, -3',
].join('\n');

describe('RockTrajectory', () => {
  it('derives positionSum dynamically and evaluates positionAt(time)', () => {
    const traj = new RockTrajectory(new Vec3(24n, 13n, 10n), new Vec3(-3n, 1n, 2n), [
      { hailstoneId: 0, time: 5n },
    ]);
    expect(Object.isFrozen(traj)).toBe(true);
    expect(Object.isFrozen(traj.collisions)).toBe(true);
    expect(traj.positionSum).toBe(47n);
    expect(traj.positionAt(5n).equals(new Vec3(9n, 18n, 20n))).toBe(true);
  });
});

describe('solveRockTrajectory', () => {
  it('solves the official example rock trajectory and verifies all collision times', () => {
    const stones = parseHailstones(EXAMPLE_INPUT);
    const traj = solveRockTrajectory(stones);
    expect(traj.position.equals(new Vec3(24n, 13n, 10n))).toBe(true);
    expect(traj.velocity.equals(new Vec3(-3n, 1n, 2n))).toBe(true);
    expect(traj.positionSum).toBe(47n);
    expect(traj.collisions.map((c) => c.time)).toEqual([5n, 3n, 4n, 6n, 1n]);
  });

  it('handles zero-relative-velocity axes including t=0 coincidence', () => {
    // Rock at (10, 20, 30) moving at (1, 2, 3)
    // Stone 0 matches rock identically -> t = 0 across all zero-dv axes
    // Stone 1 shares x velocity (dv_x=0, dp_x=0) and collides at t=2
    // Stone 2 collides at t=4, Stone 3 collides at t=6
    const stones = [
      new Hailstone(0, new Vec3(10n, 20n, 30n), new Vec3(1n, 2n, 3n)),
      new Hailstone(1, new Vec3(10n, 18n, 28n), new Vec3(1n, 3n, 4n)),
      new Hailstone(2, new Vec3(2n, 20n, 34n), new Vec3(3n, 2n, 2n)),
      new Hailstone(3, new Vec3(16n, 26n, 24n), new Vec3(0n, 1n, 4n)),
    ];
    const traj = solveRockTrajectory(stones);
    expect(traj.position.equals(new Vec3(10n, 20n, 30n))).toBe(true);
    expect(traj.velocity.equals(new Vec3(1n, 2n, 3n))).toBe(true);
    expect(traj.collisions.map((c) => c.time)).toEqual([0n, 2n, 4n, 6n]);
  });

  it('rejects fewer than 3 hailstones and underdetermined systems', () => {
    const stones = parseHailstones(EXAMPLE_INPUT);
    expect(() => solveRockTrajectory(stones.slice(0, 2))).toThrow(RangeError);
    // All parallel velocities yield rank < 6
    const parallel = [
      new Hailstone(0, new Vec3(0n, 0n, 0n), new Vec3(1n, 1n, 1n)),
      new Hailstone(1, new Vec3(1n, 0n, 0n), new Vec3(1n, 1n, 1n)),
      new Hailstone(2, new Vec3(0n, 1n, 0n), new Vec3(1n, 1n, 1n)),
    ];
    expect(() => solveRockTrajectory(parallel)).toThrow(/underdetermined/i);
  });

  it('rejects non-integer rock solutions', () => {
    // Rock (1/2, 0, 0) + t*(1, 2, 4) hits stones at t = 1/2, 3/2, 5/2
    const stones = [
      new Hailstone(0, new Vec3(0n, 1n, 1n), new Vec3(2n, 0n, 2n)),
      new Hailstone(1, new Vec3(2n, 0n, 3n), new Vec3(0n, 2n, 2n)),
      new Hailstone(2, new Vec3(-2n, 0n, 10n), new Vec3(2n, 2n, 0n)),
    ];
    expect(() => solveRockTrajectory(stones)).toThrow(/non-integer/i);
  });

  it('rejects a 4th hailstone that misses, hits fractionally, hits in past, or mismatches axes', () => {
    const base = parseHailstones(EXAMPLE_INPUT).slice(0, 4);
    // Rock is (24, 13, 10) + t*(-3, 1, 2)
    // 1. dv=0, dp!=0 on x axis (vel.x = -3, pos.x = 25)
    expect(() =>
      solveRockTrajectory([...base, new Hailstone(4, new Vec3(25n, 14n, 12n), new Vec3(-3n, 0n, 0n))]),
    ).toThrow(/collision/i);
    // 2. Non-integer collision time: dp_x = 24 - 23 = 1, dv_x = -2 - (-3) = 1? Wait: dp=1, dv=2 -> t=1/2
    expect(() =>
      solveRockTrajectory([...base, new Hailstone(4, new Vec3(23n, 13n, 10n), new Vec3(-1n, 1n, 2n))]),
    ).toThrow(/collision/i);
    // 3. Past collision (t = -1): rock at t=-1 is (27, 12, 8); stone at (27, 12, 8) - (-1)*(0, 0, 0)
    expect(() =>
      solveRockTrajectory([...base, new Hailstone(4, new Vec3(27n, 12n, 8n), new Vec3(0n, 0n, 0n))]),
    ).toThrow(/collision/i);
    // 4. Axis mismatch: hits x at t=1 (rock=(21,14,12)), hits y at t=2 (rock=(18,15,14))
    // For stone: pos=(21, 15, 12), vel=(-3? no: dv_x=-1 -> v_x=-2 so pos_x=21 - (-2)? Wait:
    // t=1 -> stone.x + 1*vx = 21 => vx=0, pos.x=21 (dp=3, dv=-3? Wait dv=rockVel-stoneVel: rockPos=24, dp=-3, dv=-3 -> t=1!
    // For y at t=2: pos.y + 2*vy = 15. Pick vy=0, pos.y=15 -> dp=2, dv=1 -> t=2!
    expect(() =>
      solveRockTrajectory([...base, new Hailstone(4, new Vec3(21n, 15n, 12n), new Vec3(0n, 0n, 2n))]),
    ).toThrow(/collision/i);
  });
});
