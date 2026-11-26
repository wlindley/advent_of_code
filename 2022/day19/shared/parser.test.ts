import { describe, expect, it } from 'vitest';
import { parseBlueprints } from './parser';

const WRAPPED_TWO = `
Blueprint 1:
  Each ore robot costs 4 ore.
  Each clay robot costs 2 ore.
  Each obsidian robot costs 3 ore and 14 clay.
  Each geode robot costs 2 ore and 7 obsidian.

Blueprint 2:
  Each ore robot costs 2 ore.
  Each clay robot costs 3 ore.
  Each obsidian robot costs 3 ore and 8 clay.
  Each geode robot costs 3 ore and 12 obsidian.
`;

const SINGLE_LINE =
  'Blueprint 5: Each ore robot costs 3 ore. Each clay robot costs 4 ore. Each obsidian robot costs 2 ore and 10 clay. Each geode robot costs 4 ore and 9 obsidian.';

describe('parseBlueprints', () => {
  it('parses wrapped multi-line official blueprints and freezes the result', () => {
    const bps = parseBlueprints(WRAPPED_TWO);
    expect(Object.isFrozen(bps)).toBe(true);
    expect(bps).toHaveLength(2);
    expect(bps[0]!.id).toBe(1);
    expect(bps[0]!.obsidianRobotClayCost).toBe(14);
    expect(bps[0]!.geodeRobotObsidianCost).toBe(7);
    expect(bps[1]!.id).toBe(2);
    expect(bps[1]!.clayRobotOreCost).toBe(3);
    expect(bps[1]!.geodeRobotObsidianCost).toBe(12);
  });

  it('parses single-line blueprint format', () => {
    const bps = parseBlueprints(SINGLE_LINE);
    expect(bps).toHaveLength(1);
    expect(bps[0]!.id).toBe(5);
    expect(bps[0]!.maxOreCost).toBe(4);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parseBlueprints('')).toThrow(SyntaxError);
    expect(() => parseBlueprints('   \n\t  ')).toThrow(SyntaxError);
  });

  it('rejects leading or trailing garbage', () => {
    expect(() => parseBlueprints(`junk ${SINGLE_LINE}`)).toThrow(SyntaxError);
    expect(() => parseBlueprints(`${SINGLE_LINE} trailing`)).toThrow(SyntaxError);
  });

  it('rejects malformed blueprint syntax', () => {
    expect(() => parseBlueprints('Blueprint 1: Each ore robot costs 4 ore.')).toThrow(SyntaxError);
  });

  it('rejects non-positive id or cost', () => {
    const zeroCost = SINGLE_LINE.replace('4 ore.', '0 ore.');
    expect(() => parseBlueprints(zeroCost)).toThrow(RangeError);
    const zeroId = SINGLE_LINE.replace('Blueprint 5:', 'Blueprint 0:');
    expect(() => parseBlueprints(zeroId)).toThrow(RangeError);
  });

  it('rejects duplicate blueprint IDs', () => {
    expect(() => parseBlueprints(`${SINGLE_LINE}\n${SINGLE_LINE}`)).toThrow(RangeError);
  });
});
