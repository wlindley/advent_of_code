import { describe, expect, it } from 'vitest';
import {
  FUEL_CHEMICAL,
  Ingredient,
  ORE_CHEMICAL,
  Reaction,
  ReactionNetwork,
  parseReactionNetwork,
} from './models';

const SIMPLE_NETWORK = [
  '10 ORE => 10 A',
  '1 ORE => 1 B',
  '7 A, 1 B => 1 C',
  '7 A, 1 C => 1 FUEL',
].join('\n');

const WITH_DEAD_BRANCH = [
  '10 ORE => 5 DEAD',
  '1 DEAD => 1 UNUSED',
  '2 ORE => 1 A',
  '3 A => 1 FUEL',
].join('\n');

describe('day14 shared models', () => {
  it('constructs frozen Ingredient and Reaction value objects with validation', () => {
    const a = new Ingredient('ORE', 10n);
    const b = new Ingredient('A', 2n);
    expect(Object.isFrozen(a)).toBe(true);
    expect(a.chemical).toBe(ORE_CHEMICAL);
    expect(a.quantity).toBe(10n);

    expect(() => new Ingredient('ore', 1n)).toThrow();
    expect(() => new Ingredient('A1', 1n)).toThrow();
    expect(() => new Ingredient('A', 0n)).toThrow(RangeError);
    expect(() => new Ingredient('A', -3n)).toThrow(RangeError);

    const rxn = new Reaction([a], b);
    expect(Object.isFrozen(rxn)).toBe(true);
    expect(Object.isFrozen(rxn.inputs)).toBe(true);
    expect(() => new Reaction([], b)).toThrow();
    expect(() => new Reaction([a, new Ingredient('ORE', 5n)], b)).toThrow();
    expect(() => new Reaction([b], new Ingredient('ORE', 1n))).toThrow();
  });

  it('parses reaction networks in topological demand order and prunes dead reactions', () => {
    const net = parseReactionNetwork(SIMPLE_NETWORK);
    expect(net).toBeInstanceOf(ReactionNetwork);
    expect(Object.isFrozen(net)).toBe(true);
    expect(net.reactionCount).toBe(4);
    expect(net.activeReactionCount).toBe(4);
    expect(net.reactionFor(FUEL_CHEMICAL)?.inputs.length).toBe(2);
    expect(net.reactionFor('UNKNOWN')).toBeUndefined();
    expect(net.orderedReactions.map((r) => r.output.chemical)).toEqual(['FUEL', 'C', 'A', 'B']);
    expect(net.demandGraph.has(ORE_CHEMICAL)).toBe(true);

    const pruned = parseReactionNetwork(WITH_DEAD_BRANCH);
    expect(pruned.reactionCount).toBe(4);
    expect(pruned.activeReactionCount).toBe(2);
    expect(pruned.orderedReactions.map((r) => r.output.chemical)).toEqual(['FUEL', 'A']);
  });

  it('rejects malformed syntax, invalid quantities, and duplicate or missing definitions', () => {
    expect(() => parseReactionNetwork('')).toThrow();
    expect(() => parseReactionNetwork('   \n  ')).toThrow();
    expect(() => parseReactionNetwork('1 ORE -> 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork('1 ORE => 1 A => 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork(' => 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork('0 ORE => 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork('-1 ORE => 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork('1.5 ORE => 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork('1 ORE => 1 FUEL extra')).toThrow();
    expect(() => parseReactionNetwork('1 ore => 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork('1 ORE => 1 A, 1 B')).toThrow();
    expect(() => parseReactionNetwork('1 A, 2 A => 1 FUEL\n1 ORE => 1 A')).toThrow();
    expect(() => parseReactionNetwork('1 A => 1 ORE\n1 ORE => 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork('1 ORE => 1 A\n2 ORE => 1 A\n1 A => 1 FUEL')).toThrow();
    expect(() => parseReactionNetwork('1 ORE => 1 A')).toThrow();
    expect(() => parseReactionNetwork('1 MISSING => 1 FUEL')).toThrow();
  });

  it('rejects self-loops, FUEL-reachable cycles, and off-path cycles', () => {
    expect(() => parseReactionNetwork('1 FUEL => 1 FUEL')).toThrow(/Cycle/);
    expect(() =>
      parseReactionNetwork(['1 A => 1 FUEL', '1 B => 1 A', '1 A => 1 B'].join('\n')),
    ).toThrow(/Cycle/);
    expect(() =>
      parseReactionNetwork(['1 ORE => 1 FUEL', '1 Y => 1 X', '1 X => 1 Y'].join('\n')),
    ).toThrow(/Cycle/);
  });
});
