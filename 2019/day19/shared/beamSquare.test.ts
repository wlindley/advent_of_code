import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { IntcodeBeamOracle, type BeamOracle } from './beamProbe';
import {
  DEFAULT_SQUARE_LIMITS,
  SquarePlacement,
  findBeamAnchor,
  findClosestSquare,
  locateRowLeft,
} from './beamSquare';

const BEAM_ROM =
  '3,59,3,60,107,-1,59,61,107,-1,60,62,102,6,60,63,102,7,59,64,1001,64,1,64,7,63,64,63,102,3,59,64,102,5,60,65,1001,65,1,65,7,64,65,64,2,61,62,61,2,61,63,61,2,61,64,61,4,61,99';

function makeCone(m1: number, m2: number): BeamOracle {
  return {
    probe: (x, y) => (x === 0 && y === 0) || (x >= m1 * y && x <= m2 * y),
  };
}

function makeRoundedCone(m1: number, m2: number): BeamOracle {
  return {
    probe: (x, y) => x >= Math.round(m1 * y) && x <= Math.round(m2 * y),
  };
}

function bruteForceClosest(oracle: BeamOracle, size: number, maxY: number): number {
  for (let y = size - 1; y <= maxY; y += 1) {
    for (let x = 0; x <= y * 4; x += 1) {
      if (oracle.probe(x, y) && oracle.probe(x + size - 1, y - size + 1)) {
        return x * 10_000 + (y - size + 1);
      }
    }
  }
  throw new Error('Brute force failed');
}

describe('beamSquare', () => {
  it('finds 100x100 square on the 59-cell ROM under 350 probes', () => {
    const oracle = new IntcodeBeamOracle(parseIntcodeProgram(BEAM_ROM));
    const result = findClosestSquare(oracle, 100);
    expect(result.placement.x).toBe(281);
    expect(result.placement.y).toBe(228);
    expect(result.placement.size).toBe(100);
    expect(result.placement.rightX).toBe(380);
    expect(result.placement.bottomY).toBe(327);
    expect(result.placement.answerCode).toBe(2_810_228);
    expect(oracle.probeCount).toBeLessThan(350);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.leftEdge.length).toBeGreaterThan(0);
  });

  it('handles S=1 (lit/unlit origin), S=2,3, wide, vertical, shallow, and narrow beams', () => {
    const litOne = findClosestSquare(makeCone(0.6, 1.2), 1);
    expect(litOne.placement.answerCode).toBe(0);

    const unlitOrigin: BeamOracle = { probe: (x, y) => y >= 2 && x >= 0.5 * y && x <= y };
    const unlitOne = findClosestSquare(unlitOrigin, 1);
    expect(unlitOne.placement.x).toBe(1);
    expect(unlitOne.placement.y).toBe(2);

    const wide = findClosestSquare({ probe: () => true }, 2);
    expect(wide.placement.answerCode).toBe(0);

    const s3 = findClosestSquare(makeCone(0.5, 1.0), 3);
    expect(s3.placement.answerCode).toBe(bruteForceClosest(makeCone(0.5, 1.0), 3, 50));

    const vertical = findClosestSquare(makeCone(0, 0.5), 5);
    expect(vertical.placement.x).toBe(0);
    expect(vertical.placement.y).toBe(8);

    const shallowAnchor = findBeamAnchor(makeCone(3, 4), 10);
    expect(shallowAnchor).toEqual({ x: 3, y: 1 });
    const shallow = findClosestSquare(makeCone(3, 4), 4);
    expect(shallow.placement.answerCode).toBe(bruteForceClosest(makeCone(3, 4), 4, 100));

    const narrow = findClosestSquare(makeCone(0.45, 0.48), 4);
    expect(narrow.placement.answerCode).toBe(bruteForceClosest(makeCone(0.45, 0.48), 4, 300));
  });

  it('matches brute force on oscillating discrete-rounding cone m1=7/10, m2=39/50', () => {
    const cone = makeRoundedCone(7 / 10, 39 / 50);
    for (const size of [6, 12, 20]) {
      const actual = findClosestSquare(cone, size);
      const expected = bruteForceClosest(cone, size, 1_000);
      expect(actual.placement.answerCode).toBe(expected);
    }
  });

  it('supports locateRowLeft left/right/empty branches and validates inputs/limits', () => {
    const rowOracle: BeamOracle = { probe: (x, y) => y === 5 && x >= 3 && x <= 7 };
    expect(locateRowLeft(rowOracle, 5, 6, 10)).toBe(3);
    expect(locateRowLeft(rowOracle, 5, 1, 10)).toBe(3);
    expect(locateRowLeft(rowOracle, 5, 0, 2)).toBe(-1);

    expect(() => new SquarePlacement(-1, 0, 1)).toThrow(RangeError);
    expect(() => new SquarePlacement(0, -1, 1)).toThrow(RangeError);
    expect(() => new SquarePlacement(0, 0, 0)).toThrow(RangeError);

    expect(() => findBeamAnchor({ probe: () => false }, 0)).toThrow(RangeError);
    expect(() => findBeamAnchor({ probe: () => false }, 5)).toThrow(/anchor/i);
    expect(() => findClosestSquare(makeCone(0.5, 0.6), 0)).toThrow(RangeError);
    expect(() => findClosestSquare(makeCone(0.5, 0.6), 4, { maxAnchorDist: 0, maxY: 100 })).toThrow(RangeError);
    expect(() => findClosestSquare(makeCone(0.5, 0.6), 4, { maxAnchorDist: 10, maxY: 0 })).toThrow(RangeError);
    expect(() => findClosestSquare(makeCone(0.5, 1.0), 50, { maxAnchorDist: 20, maxY: 30 })).toThrow(/maxY/i);
    expect(DEFAULT_SQUARE_LIMITS).toEqual({ maxAnchorDist: 64, maxY: 5_000 });
  });
});
