import { describe, expect, it } from 'vitest';
import { Blueprint } from './blueprint';

const VALID_PROPS = {
  id: 1,
  oreRobotOreCost: 4,
  clayRobotOreCost: 2,
  obsidianRobotOreCost: 3,
  obsidianRobotClayCost: 14,
  geodeRobotOreCost: 2,
  geodeRobotObsidianCost: 7,
} as const;

describe('Blueprint', () => {
  it('stores validated fields, freezes instance, and computes maxOreCost dynamically', () => {
    const bp = new Blueprint(VALID_PROPS);
    expect(Object.isFrozen(bp)).toBe(true);
    expect(bp.id).toBe(1);
    expect(bp.oreRobotOreCost).toBe(4);
    expect(bp.clayRobotOreCost).toBe(2);
    expect(bp.obsidianRobotOreCost).toBe(3);
    expect(bp.obsidianRobotClayCost).toBe(14);
    expect(bp.geodeRobotOreCost).toBe(2);
    expect(bp.geodeRobotObsidianCost).toBe(7);
    expect(bp.maxOreCost).toBe(4);
  });

  it('computes maxOreCost when geodeRobotOreCost is highest', () => {
    const bp = new Blueprint({ ...VALID_PROPS, oreRobotOreCost: 2, geodeRobotOreCost: 5 });
    expect(bp.maxOreCost).toBe(5);
  });

  it.each([
    ['id', 0],
    ['id', -1],
    ['id', 1.5],
    ['oreRobotOreCost', 0],
    ['clayRobotOreCost', -2],
    ['obsidianRobotOreCost', Number.NaN],
    ['obsidianRobotClayCost', Number.POSITIVE_INFINITY],
    ['geodeRobotOreCost', 0],
    ['geodeRobotObsidianCost', Number.MAX_SAFE_INTEGER + 1],
  ] as const)('rejects non-positive or non-safe-integer %s (%s)', (field, badValue) => {
    expect(() => new Blueprint({ ...VALID_PROPS, [field]: badValue })).toThrow(RangeError);
  });
});
