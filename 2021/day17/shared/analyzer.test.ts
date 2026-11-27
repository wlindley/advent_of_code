import { describe, expect, it } from 'vitest';
import { YStepInterval } from './ballistics';
import { TargetArea } from './target';
import { analyzeTargetArea } from './analyzer';

function bruteForceOracle(target: TargetArea): { readonly maxApexY: number; readonly validCount: number } {
  let maxApexY = 0;
  let validCount = 0;
  for (let vx = 1; vx <= target.xMax; vx += 1) {
    for (let vy = target.yMin; vy <= target.maxFeasibleVy; vy += 1) {
      let x = 0;
      let y = 0;
      let curVx = vx;
      let curVy = vy;
      let peakY = 0;
      let hit = false;
      while (x <= target.xMax && y >= target.yMin) {
        x += curVx;
        y += curVy;
        curVx = Math.max(0, curVx - 1);
        curVy -= 1;
        if (y > peakY) peakY = y;
        if (target.contains(x, y)) {
          hit = true;
          break;
        }
      }
      if (hit) {
        validCount += 1;
        if (peakY > maxApexY) maxApexY = peakY;
      }
    }
  }
  return { maxApexY, validCount };
}

function nextSeededInt(state: { value: number }, min: number, max: number): number {
  state.value = (Math.imul(state.value, 1664525) + 1013904223) >>> 0;
  return min + (state.value % (max - min + 1));
}

describe('2021 Day 17 TrickShotAnalysis', () => {
  it('solves the official example (maxApexY=45, validVelocityCount=112) and enforces immutability', () => {
    const analysis = analyzeTargetArea(new TargetArea(20, 30, -10, -5));
    expect(Object.isFrozen(analysis)).toBe(true);
    expect(Object.isFrozen(analysis.xIntervals)).toBe(true);
    expect(Object.isFrozen(analysis.yIntervals)).toBe(true);
    expect(analysis.maxApexY).toBe(45);
    expect(analysis.validVelocityCount).toBe(112);
    expect(analysis.bestVelocity.vy).toBe(9);
    expect(analysis.bestVelocity.apexY).toBe(45);

    const bestMatches = analysis.matchingVxValues(analysis.bestVyInterval);
    expect(Object.isFrozen(bestMatches)).toBe(true);
    expect(bestMatches).toEqual([6, 7]);
  });

  it('throws RangeError when countMatchingVx receives a step window past target.maxStep', () => {
    const analysis = analyzeTargetArea(new TargetArea(20, 30, -10, -5));
    const invalidY = new YStepInterval(10, 21, 21);
    expect(() => analysis.countMatchingVx(invalidY)).toThrow(RangeError);
  });

  it('matches brute-force 2D ballistic oracle on tricky edge targets', () => {
    const edgeTargets: readonly [TargetArea, number, number][] = [
      [new TargetArea(14, 14, -10, -2), 1, 12],
      [new TargetArea(5, 5, -2, -2), 0, 1],
      [new TargetArea(1, 1, -1, -1), 0, 2],
      [new TargetArea(20, 27, -6, -3), 15, 54],
    ];
    for (const [target, expectedApex, expectedCount] of edgeTargets) {
      const analysis = analyzeTargetArea(target);
      const oracle = bruteForceOracle(target);
      expect(oracle.maxApexY).toBe(expectedApex);
      expect(oracle.validCount).toBe(expectedCount);
      expect(analysis.maxApexY).toBe(oracle.maxApexY);
      expect(analysis.validVelocityCount).toBe(oracle.validCount);
    }
  });

  it('matches brute-force 2D ballistic oracle across 18 seeded PRNG target boxes', () => {
    const rng = { value: 20211701 };
    for (let i = 0; i < 18; i += 1) {
      const xMin = nextSeededInt(rng, 1, 80);
      const xMax = xMin + nextSeededInt(rng, 0, 40);
      const yMax = -nextSeededInt(rng, 1, 25);
      const yMin = yMax - nextSeededInt(rng, 0, 30);
      const target = new TargetArea(xMin, xMax, yMin, yMax);
      const analysis = analyzeTargetArea(target);
      const oracle = bruteForceOracle(target);
      expect(analysis.maxApexY).toBe(oracle.maxApexY);
      expect(analysis.validVelocityCount).toBe(oracle.validCount);
    }
  });
});
