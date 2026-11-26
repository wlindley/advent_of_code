import { describe, expect, it } from 'vitest';
import { Vec3 } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = [
  '19, 13, 30 @ -2,  1, -2',
  '18, 19, 22 @ -1, -1, -2',
  '20, 25, 34 @ -2, -2, -4',
  '12, 31, 28 @ -1, -2, -1',
  '20, 19, 15 @  1, -5, -3',
].join('\n');

function formatCollidingStone(rockPos: Vec3, rockVel: Vec3, stoneVel: Vec3, time: bigint): string {
  const px = rockPos.x + (rockVel.x - stoneVel.x) * time;
  const py = rockPos.y + (rockVel.y - stoneVel.y) * time;
  const pz = rockPos.z + (rockVel.z - stoneVel.z) * time;
  return `${px}, ${py}, ${pz} @ ${stoneVel.x}, ${stoneVel.y}, ${stoneVel.z}`;
}

describe('2023 Day 24 Part 2 solver', () => {
  it('solves the official 5-stone example to 47n', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(47n);
  });

  it('recovers exact 64-bit+ coordinates at 10^14 scale', () => {
    const rockPos = new Vec3(200_000_000_000_123n, 300_000_000_000_456n, 400_000_000_000_789n);
    const rockVel = new Vec3(-17n, 23n, -31n);
    const input = [
      formatCollidingStone(rockPos, rockVel, new Vec3(10n, -5n, 3n), 1_000_000_000n),
      formatCollidingStone(rockPos, rockVel, new Vec3(-4n, 11n, 7n), 2_000_000_000n),
      formatCollidingStone(rockPos, rockVel, new Vec3(5n, 2n, -9n), 3_000_000_000n),
      formatCollidingStone(rockPos, rockVel, new Vec3(-8n, -3n, 6n), 4_000_000_000n),
    ].join('\n');
    expect(solver.solve(solver.parse(input))).toBe(rockPos.x + rockPos.y + rockPos.z);
  });

  it('handles shared velocity axis (dv_x = 0n) and t = 0n coincidence', () => {
    const rockPos = new Vec3(10n, 20n, 30n);
    const rockVel = new Vec3(1n, 2n, 3n);
    const input = [
      formatCollidingStone(rockPos, rockVel, rockVel, 0n),
      formatCollidingStone(rockPos, rockVel, new Vec3(1n, 3n, 4n), 2n),
      formatCollidingStone(rockPos, rockVel, new Vec3(3n, 2n, 2n), 4n),
      formatCollidingStone(rockPos, rockVel, new Vec3(0n, 1n, 4n), 6n),
    ].join('\n');
    const parsed = solver.parse(input);
    expect(solver.solve(parsed)).toBe(60n);
    const frames = solver.trace(parsed);
    expect(frames[0]!.sortedCollisions.map((c) => c.time)).toEqual([0n, 2n, 4n, 6n]);
  });

  it('produces chronological trace frames and honors maxSteps', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace(parsed);
    expect(frames).toHaveLength(6);
    expect(frames[0]!.step).toBe(0);
    expect(frames[0]!.activeCollision).toBeNull();
    expect(frames[0]!.rockPosition.equals(new Vec3(24n, 13n, 10n))).toBe(true);
    expect(frames[0]!.sortedCollisions.map((c) => c.time)).toEqual([1n, 3n, 4n, 5n, 6n]);
    expect(frames[5]!.step).toBe(5);
    expect(frames[5]!.activeCollision).toEqual({ hailstoneId: 3, time: 6n });

    const sampled = solver.trace(parsed, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled.map((f) => f.step)).toEqual([0, 3, 5]);
  });

  it('rejects empty input', () => {
    expect(() => solver.parse('   \n  ')).toThrow(/empty/i);
  });

  it('rejects malformed hailstone lines', () => {
    expect(() => solver.parse('19, 13, 30 @ -2, 1')).toThrow(/Invalid hailstone/i);
  });

  it('rejects fewer than 3 hailstones', () => {
    const twoStones = EXAMPLE_INPUT.split('\n').slice(0, 2).join('\n');
    expect(() => solver.solve(solver.parse(twoStones))).toThrow(RangeError);
  });

  it('rejects parallel/underdetermined systems', () => {
    const parallel = [
      '0, 0, 0 @ 1, 1, 1',
      '1, 0, 0 @ 1, 1, 1',
      '0, 1, 0 @ 1, 1, 1',
    ].join('\n');
    expect(() => solver.solve(solver.parse(parallel))).toThrow(/underdetermined/i);
  });

  it('rejects an unsolvable 4th hailstone', () => {
    const fourExample = EXAMPLE_INPUT.split('\n').slice(0, 4).join('\n');
    const bad = `${fourExample}\n25, 14, 12 @ -3, 0, 0`;
    expect(() => solver.solve(solver.parse(bad))).toThrow(/collision/i);
  });

  it('rejects invalid maxSteps values of 0, -2, and 1.5', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(() => solver.trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(parsed, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => solver.trace(parsed, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
