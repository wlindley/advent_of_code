import { describe, expect, it } from 'vitest';
import { BurrowState } from './burrow';
import { parseBurrow } from './parser';
import { STANDARD_BURROW_POLICY } from './policy';
import { findOptimalOrganization } from './search';

const OFFICIAL_EXAMPLE = [
  '#############',
  '#...........#',
  '###B#C#B#D###',
  '  #A#D#C#A#',
  '  #########',
].join('\n');

describe('findOptimalOrganization', () => {
  it('returns 0 energy and 0 moves when already at goal', () => {
    const goal = new BurrowState('.......AABBCCDD', 2);
    const result = findOptimalOrganization(goal);
    expect(result.totalEnergy).toBe(0);
    expect(result.moves).toHaveLength(0);
    expect(result.statesExpanded).toBe(1);
  });

  it('solves the official Part 1 example to 12521 energy', () => {
    const start = STANDARD_BURROW_POLICY.prepare(parseBurrow(OFFICIAL_EXAMPLE));
    const result = findOptimalOrganization(start);
    expect(result.totalEnergy).toBe(12521);
    expect(result.moves.length).toBeGreaterThan(0);
    expect(result.statesExpanded).toBeGreaterThan(1);
    const sumEnergy = result.moves.reduce((acc, m) => acc + m.energy, 0);
    expect(sumEnergy).toBe(12521);
  });

  it('handles states where a suboptimal path is queued before a lower-cost path', () => {
    const start = new BurrowState('....C..CA.BADBD', 2);
    const result = findOptimalOrganization(start);
    expect(result.totalEnergy).toBeGreaterThan(0);
    expect(result.moves.reduce((acc, m) => acc + m.energy, 0)).toBe(result.totalEnergy);
  });

  it('throws when the burrow configuration is deadlocked / unsolvable', () => {
    // All 7 hallway slots occupied blocking all exits and room-to-room moves
    const deadlocked = new BurrowState('ABCDABC.D......', 2);
    expect(() => findOptimalOrganization(deadlocked)).toThrow('Burrow configuration is unsolvable');
  });
});
