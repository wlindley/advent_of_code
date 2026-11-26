import { describe, expect, it } from 'vitest';
import { Blueprint } from './blueprint';
import { computeRelaxedGeodeBound, computeTriangularBound } from './upperBound';

const BP1 = new Blueprint({
  id: 1,
  oreRobotOreCost: 4,
  clayRobotOreCost: 2,
  obsidianRobotOreCost: 3,
  obsidianRobotClayCost: 14,
  geodeRobotOreCost: 2,
  geodeRobotObsidianCost: 7,
});

describe('upperBound', () => {
  it('computes triangular bound and avoids -0 when rem is 0 or 1', () => {
    expect(Object.is(computeTriangularBound(5, 0), 5)).toBe(true);
    expect(Object.is(computeTriangularBound(0, 0), 0)).toBe(true);
    expect(computeTriangularBound(5, 1)).toBe(5);
    expect(computeTriangularBound(5, 2)).toBe(6);
    expect(computeTriangularBound(3, 5)).toBe(13);
  });

  it('returns current geodes in relaxed bound when rem <= 1', () => {
    expect(computeRelaxedGeodeBound(BP1, 0, 100, 100, 10, 10, 4)).toBe(4);
    expect(computeRelaxedGeodeBound(BP1, 1, 100, 100, 10, 10, 4)).toBe(4);
  });

  it('handles zero initial clay and obsidian bots when rem is small', () => {
    expect(computeRelaxedGeodeBound(BP1, 3, 0, 0, 0, 0, 2)).toBe(2);
  });

  it('checks affordability before collection and builds clay/obsidian/geode tiers independently', () => {
    // At t=4: clay=14, obs=7 -> canGeode=true (7>=7), canObs=true (14>=14).
    // Collect: clay=14+0=14, obs=7+0=7. Spend: obs=0, geodes+=3; clay=0, obsBots=1; clayBots=1.
    // At t=3: canGeode=false, canObs=false. Collect: clay=1, obs=1; clayBots=2.
    // At t=2: canGeode=false, canObs=false. Collect: clay=3, obs=2; clayBots=3.
    expect(computeRelaxedGeodeBound(BP1, 4, 14, 7, 0, 0, 0)).toBe(3);

    // At t=2 with obs=6, obsBots=5: canGeode is checked BEFORE collection, so 6 < 7 => 0 new geodes!
    expect(computeRelaxedGeodeBound(BP1, 2, 0, 6, 0, 5, 1)).toBe(1);
  });

  it('never exceeds triangular bound for identical rem and geodes', () => {
    for (let rem = 0; rem <= 12; rem += 1) {
      const tri = computeTriangularBound(2, rem);
      const relaxed = computeRelaxedGeodeBound(BP1, rem, 5, 3, 2, 1, 2);
      expect(relaxed).toBeLessThanOrEqual(tri);
    }
  });
});
