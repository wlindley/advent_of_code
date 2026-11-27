import { describe, expect, it } from 'vitest';
import { estimateRemainingEnergy } from './heuristic';

describe('estimateRemainingEnergy', () => {
  it('returns 0 for goal states', () => {
    expect(estimateRemainingEnergy('.......AABBCCDD', 2)).toBe(0);
    expect(estimateRemainingEnergy('.......AAAABBBBCCCCDDDD', 4)).toBe(0);
  });

  it('computes lower-bound energy for hallway, foreign-room, and self-blocking amphipods', () => {
    // Hallway 'A' at slot 1 (col 1 -> col 2 = 1) + triangular entry (1) = 2
    expect(estimateRemainingEnergy('.A......ABBCCDD', 2)).toBe(2);

    // 'A' at room 0 depth 0 blocking 'B' at depth 1 (room 1 is '.B'):
    // A: vExit=1, hDist=2 -> 3, entry=1 => 4*1 = 4
    // B: vExit=2, hDist=2 -> 4, entry=1 => 5*10 = 50
    // Total = 54
    expect(estimateRemainingEnergy('.......AB.BCCDD', 2)).toBe(54);
  });

  it('is admissible on the official Part 1 example start state', () => {
    const h = estimateRemainingEnergy('.......BACDBCDA', 2);
    expect(h).toBeGreaterThan(0);
    expect(h).toBeLessThanOrEqual(12521);
  });
});
