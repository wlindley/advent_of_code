import { describe, expect, it } from 'vitest';
import { parseReactionNetwork } from './models';
import {
  ChemicalDemand,
  FuelSearchStep,
  evaluateStoichiometry,
  findMaxFuelForOre,
  oreRequiredForFuel,
} from './stoichiometry';

const EX1 = [
  '10 ORE => 10 A',
  '1 ORE => 1 B',
  '7 A, 1 B => 1 C',
  '7 A, 1 C => 1 D',
  '7 A, 1 D => 1 E',
  '7 A, 1 E => 1 FUEL',
].join('\n');

const EX2 = [
  '9 ORE => 2 A',
  '8 ORE => 3 B',
  '7 ORE => 5 C',
  '3 A, 4 B => 1 AB',
  '5 B, 7 C => 1 BC',
  '4 C, 1 A => 1 CA',
  '2 AB, 3 BC, 4 CA => 1 FUEL',
].join('\n');

const EX3 = [
  '157 ORE => 5 NZVS',
  '165 ORE => 6 DCFZ',
  '44 XJWVT, 5 KHKGT, 1 QDVJ, 29 NZVS, 9 GPVTF, 48 HKGWZ => 1 FUEL',
  '12 HKGWZ, 1 GPVTF, 8 PSHF => 9 QDVJ',
  '179 ORE => 7 PSHF',
  '177 ORE => 5 HKGWZ',
  '7 DCFZ, 7 PSHF => 2 XJWVT',
  '165 ORE => 2 GPVTF',
  '3 DCFZ, 7 NZVS, 5 HKGWZ, 10 PSHF => 8 KHKGT',
].join('\n');

const EX4 = [
  '2 VPVL, 7 FWMGM, 2 CXFTF, 11 MNCFX => 1 STKFG',
  '17 NVRVD, 3 JNWZP => 8 VPVL',
  '53 STKFG, 6 MNCFX, 46 VJHF, 81 HVMC, 68 CXFTF, 25 GNMV => 1 FUEL',
  '22 VJHF, 37 MNCFX => 5 FWMGM',
  '139 ORE => 4 NVRVD',
  '144 ORE => 7 JNWZP',
  '5 MNCFX, 7 RFSQX, 2 FWMGM, 2 VPVL, 19 CXFTF => 3 HVMC',
  '5 VJHF, 7 MNCFX, 9 VPVL, 37 CXFTF => 6 GNMV',
  '145 ORE => 6 MNCFX',
  '1 NVRVD => 8 CXFTF',
  '1 VJHF, 6 MNCFX => 4 RFSQX',
  '176 ORE => 6 VJHF',
].join('\n');

const EX5 = [
  '171 ORE => 8 CNZTR',
  '7 ZLQW, 3 BMBT, 9 XCVML, 26 XMNCP, 1 WPTQ, 2 MZWV, 1 RJRHP => 4 PLWSL',
  '114 ORE => 4 BHXH',
  '14 VRPVC => 6 BMBT',
  '6 BHXH, 18 KTJDG, 12 WPTQ, 7 PLWSL, 31 FHTLT, 37 ZDVW => 1 FUEL',
  '6 WPTQ, 2 BMBT, 8 ZLQW, 18 KTJDG, 1 XMNCP, 6 MZWV, 1 RJRHP => 6 FHTLT',
  '15 XDBXC, 2 LTCX, 1 VRPVC => 6 ZLQW',
  '13 WPTQ, 10 LTCX, 3 RJRHP, 14 XMNCP, 2 MZWV, 1 ZLQW => 1 ZDVW',
  '5 BMBT => 4 WPTQ',
  '189 ORE => 9 KTJDG',
  '1 MZWV, 17 XDBXC, 3 XCVML => 2 XMNCP',
  '12 VRPVC, 27 CNZTR => 2 XDBXC',
  '15 KTJDG, 12 BHXH => 5 XCVML',
  '3 BHXH, 2 VRPVC => 7 MZWV',
  '121 ORE => 7 VRPVC',
  '7 XCVML => 6 RJRHP',
  '5 BHXH, 4 VRPVC => 5 LTCX',
].join('\n');

const TRILLION = 1_000_000_000_000n;

describe('day14 shared stoichiometry', () => {
  it('computes frozen ChemicalDemand derived properties and validates bounds', () => {
    const d = new ChemicalDemand('A', 28n, 10n);
    expect(Object.isFrozen(d)).toBe(true);
    expect(d.batches).toBe(3n);
    expect(d.produced).toBe(30n);
    expect(d.leftover).toBe(2n);

    expect(() => new ChemicalDemand('A', 0n, 10n)).toThrow(RangeError);
    expect(() => new ChemicalDemand('A', 10n, 0n)).toThrow(RangeError);

    const stepFit = new FuelSearchStep(0, 'bracket', 0n, 1n, 1n, 31n, 40n);
    const stepOver = new FuelSearchStep(1, 'binary', 1n, 2n, 2n, 62n, 40n);
    expect(Object.isFrozen(stepFit)).toBe(true);
    expect(stepFit.fits).toBe(true);
    expect(stepOver.fits).toBe(false);
  });

  it('solves all five official Part 1 examples and rejects non-positive fuel', () => {
    expect(oreRequiredForFuel(parseReactionNetwork(EX1), 1n)).toBe(31n);
    expect(oreRequiredForFuel(parseReactionNetwork(EX2), 1n)).toBe(165n);
    expect(oreRequiredForFuel(parseReactionNetwork(EX3), 1n)).toBe(13312n);
    expect(oreRequiredForFuel(parseReactionNetwork(EX4), 1n)).toBe(180697n);
    expect(oreRequiredForFuel(parseReactionNetwork(EX5), 1n)).toBe(2210736n);

    const net1 = parseReactionNetwork(EX1);
    const eval1 = evaluateStoichiometry(net1, 1n);
    expect(Object.isFrozen(eval1)).toBe(true);
    expect(eval1.oreRequired).toBe(31n);
    expect(eval1.demands.find((d) => d.chemical === 'A')?.leftover).toBe(2n);

    expect(() => evaluateStoichiometry(net1, 0n)).toThrow(RangeError);
    expect(() => evaluateStoichiometry(net1, -2n)).toThrow(RangeError);
  });

  it('solves all three official Part 2 examples and boundary budgets', () => {
    expect(findMaxFuelForOre(parseReactionNetwork(EX3), TRILLION).maxFuel).toBe(82892753n);
    expect(findMaxFuelForOre(parseReactionNetwork(EX4), TRILLION).maxFuel).toBe(5586022n);
    expect(findMaxFuelForOre(parseReactionNetwork(EX5), TRILLION).maxFuel).toBe(460664n);

    const net1 = parseReactionNetwork(EX1);
    expect(() => findMaxFuelForOre(net1, -1n)).toThrow(RangeError);

    const zero = findMaxFuelForOre(net1, 0n);
    expect(zero.maxFuel).toBe(0n);
    expect(zero.oreUsed).toBe(0n);

    const under = findMaxFuelForOre(net1, 30n);
    expect(under.maxFuel).toBe(0n);
    expect(under.oreUsed).toBe(0n);

    const exactOne = findMaxFuelForOre(net1, 31n);
    expect(exactOne.maxFuel).toBe(1n);
    expect(exactOne.oreUsed).toBe(31n);
  });
});
