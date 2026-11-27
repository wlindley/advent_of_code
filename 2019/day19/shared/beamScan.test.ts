import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { IntcodeBeamOracle, type BeamOracle } from './beamProbe';
import { scanBeamGrid } from './beamScan';

const BEAM_ROM =
  '3,59,3,60,107,-1,59,61,107,-1,60,62,102,6,60,63,102,7,59,64,1001,64,1,64,7,63,64,63,102,3,59,64,102,5,60,65,1001,65,1,65,7,64,65,64,2,61,62,61,2,61,63,61,2,61,64,61,4,61,99';

function makeConeOracle(m1: number, m2: number): BeamOracle {
  return {
    probe: (x, y) => {
      if (x === 0 && y === 0) return true;
      return x >= m1 * y && x <= m2 * y;
    },
  };
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe('scanBeamGrid', () => {
  it('scans the 59-cell Intcode ROM accurately for 10x10 and 50x50', () => {
    const program = parseIntcodeProgram(BEAM_ROM);
    const small = scanBeamGrid(new IntcodeBeamOracle(program), 10);
    expect(small.grid.affectedCount).toBe(27);
    expect(small.steps).toHaveLength(10);
    expect(small.grid.spans()).toEqual([
      { y: 0, left: 0, right: 0 },
      { y: 1, left: 1, right: 1 },
      { y: 2, left: 2, right: 3 },
      { y: 3, left: 3, right: 5 },
      { y: 4, left: 4, right: 6 },
      { y: 5, left: 5, right: 8 },
      { y: 6, left: 6, right: 9 },
      { y: 7, left: 6, right: 9 },
      { y: 8, left: 7, right: 9 },
      { y: 9, left: 8, right: 9 },
    ]);

    const part1 = scanBeamGrid(new IntcodeBeamOracle(program), 50);
    expect(part1.grid.affectedCount).toBe(674);
    expect(part1.steps[part1.steps.length - 1]!.affectedSoFar).toBe(674);
  });

  it('handles narrow empty-row cones, edge geometries, and invalid gridSize', () => {
    const narrow = scanBeamGrid(makeConeOracle(0.45, 0.48), 20);
    expect(narrow.grid.rowSpan(0)).toEqual({ y: 0, left: 0, right: 0 });
    expect(narrow.grid.rowSpan(1)).toBeNull();
    expect(narrow.grid.rowSpan(12)).toBeNull();
    expect(narrow.grid.rowSpan(11)).toEqual({ y: 11, left: 5, right: 5 });

    expect(scanBeamGrid({ probe: () => false }, 12).grid.affectedCount).toBe(0);
    expect(scanBeamGrid({ probe: (x, y) => x === 0 && y === 0 }, 12).grid.affectedCount).toBe(1);
    expect(scanBeamGrid({ probe: (x) => x === 0 }, 15).grid.affectedCount).toBe(15);

    const horiz = scanBeamGrid({ probe: (_x, y) => y === 0 }, 10);
    expect(horiz.grid.affectedCount).toBe(10);
    expect(horiz.grid.rowSpan(0)).toEqual({ y: 0, left: 0, right: 9 });
    expect(horiz.grid.rowSpan(1)).toBeNull();

    const steep = scanBeamGrid(makeConeOracle(3, 4), 20);
    expect(steep.grid.rowSpan(5)).toEqual({ y: 5, left: 15, right: 19 });
    expect(steep.grid.rowSpan(7)).toBeNull();

    expect(() => scanBeamGrid({ probe: () => false }, 0)).toThrow(RangeError);
    expect(() => scanBeamGrid({ probe: () => false }, -2)).toThrow(RangeError);
    expect(() => scanBeamGrid({ probe: () => false }, 4.5)).toThrow(RangeError);
  });

  it('matches brute-force N x N grid evaluation across seeded PRNG cones', () => {
    const nextRand = makeRng(201919);
    for (let trial = 0; trial < 20; trial += 1) {
      const m1 = nextRand() * 2.5;
      const m2 = m1 + 0.02 + nextRand() * 0.8;
      const n = 25;
      const oracle = makeConeOracle(m1, m2);
      const result = scanBeamGrid(oracle, n);

      for (let y = 0; y < n; y += 1) {
        for (let x = 0; x < n; x += 1) {
          expect(result.grid.isPulled(x, y)).toBe(oracle.probe(x, y));
        }
      }
    }
  });
});
