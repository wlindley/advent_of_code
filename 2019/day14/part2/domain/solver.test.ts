import { describe, expect, it } from 'vitest';
import { TRILLION_ORE, type ReactionNetwork } from '../../shared';
import { solver } from './solver';

const EX_13312 = [
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

const EX_180697 = [
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

const EX_2210736 = [
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

function nextSeed(rng: { value: number }, max: number): number {
  rng.value = (Math.imul(rng.value, 1664525) + 1013904223) >>> 0;
  return rng.value % max;
}

function buildRandomDagInput(seed: number): string {
  const rng = { value: seed };
  const midCount = 5 + nextSeed(rng, 5);
  const chems: string[] = [];
  for (let i = 0; i < midCount; i++) chems.push(String.fromCharCode(65 + i));
  const nodes = [...chems, 'FUEL'];
  const lines: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const pool = ['ORE', ...chems.slice(0, i)];
    const count = 1 + nextSeed(rng, Math.min(3, pool.length));
    const picked = new Set<string>();
    while (picked.size < count) picked.add(pool[nextSeed(rng, pool.length)]!);
    const terms: string[] = [];
    for (const c of picked) terms.push(`${1 + nextSeed(rng, 12)} ${c}`);
    const outQty = nodes[i] === 'FUEL' ? (nextSeed(rng, 4) === 0 ? 2 + nextSeed(rng, 3) : 1) : 1 + nextSeed(rng, 8);
    lines.push(`${terms.join(', ')} => ${outQty} ${nodes[i]}`);
  }
  if (seed % 3 === 0) lines.push('5 ORE => 2 DEAD');
  return lines.join('\n');
}

function oracleOreForFuel(network: ReactionNetwork, fuelAmount: bigint): bigint {
  if (fuelAmount === 0n) return 0n;
  const surplus = new Map<string, bigint>();
  const pending = new Map<string, bigint>([['FUEL', fuelAmount]]);
  const queue = ['FUEL'];
  let ore = 0n;
  for (let head = 0; head < queue.length; head++) {
    const chem = queue[head]!;
    const req = pending.get(chem)!;
    pending.delete(chem);
    if (chem === 'ORE') { ore += req; continue; }
    const spare = surplus.get(chem) ?? 0n;
    if (spare >= req) { surplus.set(chem, spare - req); continue; }
    const rem = req - spare;
    const rxn = network.reactionFor(chem)!;
    const outQty = rxn.output.quantity;
    const batches = (rem + outQty - 1n) / outQty;
    surplus.set(chem, batches * outQty - rem);
    for (const inp of rxn.inputs) {
      if (!pending.has(inp.chemical)) queue.push(inp.chemical);
      pending.set(inp.chemical, (pending.get(inp.chemical) ?? 0n) + inp.quantity * batches);
    }
  }
  return ore;
}

describe('2019 Day 14 Part 2 solver', () => {
  it('solves all three official Part 2 examples', () => {
    expect(solver.solve(solver.parse(EX_13312))).toBe(82892753n);
    expect(solver.solve(solver.parse(EX_180697))).toBe(5586022n);
    expect(solver.solve(solver.parse(EX_2210736))).toBe(460664n);
  });

  it('produces monotonic bracket-to-binary search trace and respects maxSteps', () => {
    const net = solver.parse(EX_13312);
    const full = solver.trace(net);
    expect(full[0]!.kind).toBe('search');
    expect(full[0]!.oreBudget).toBe(TRILLION_ORE);
    expect(full[0]!.searchStep.phase).toBe('bracket');
    let sawBinary = false;
    let prevBest = -1n;
    for (const frame of full) {
      expect(frame.bestFuel >= prevBest).toBe(true);
      prevBest = frame.bestFuel;
      if (frame.searchStep.phase === 'binary') sawBinary = true;
      else expect(sawBinary).toBe(false);
    }
    expect(sawBinary).toBe(true);
    const last = full[full.length - 1]!;
    expect(last.bestFuel).toBe(last.maxFuel);
    expect(last.maxFuel).toBe(82892753n);
    expect(last.bestOre <= last.oreBudget).toBe(true);
    expect(last.stepIndex).toBe(last.totalSteps);

    const bounded = solver.trace(net, { maxSteps: 5 });
    expect(bounded).toHaveLength(5);
    expect(bounded[0]!.stepIndex).toBe(0);
    expect(bounded[4]!.stepIndex).toBe(last.totalSteps);
  });

  it('satisfies exact tightness oracle across official examples and 25 random DAGs', () => {
    const inputs = [EX_13312, EX_180697, EX_2210736];
    for (let i = 1; i <= 25; i++) inputs.push(buildRandomDagInput(i * 4999 + 17));
    for (const raw of inputs) {
      const net = solver.parse(raw);
      const ans = solver.solve(net);
      expect(oracleOreForFuel(net, ans) <= TRILLION_ORE).toBe(true);
      expect(oracleOreForFuel(net, ans + 1n) > TRILLION_ORE).toBe(true);
    }
  });

  it('handles boundary and extreme BigInt reaction ratios', () => {
    const impossible = solver.parse('1000000000001 ORE => 1 FUEL');
    expect(solver.solve(impossible)).toBe(0n);
    const impTrace = solver.trace(impossible);
    expect(impTrace).toHaveLength(1);
    expect(impTrace[0]!.stepIndex).toBe(0);
    expect(impTrace[0]!.totalSteps).toBe(0);

    const exact = solver.parse('1000000000000 ORE => 1 FUEL');
    expect(solver.solve(exact)).toBe(1n);
    const exactTrace = solver.trace(exact);
    expect(exactTrace).toHaveLength(2);
    expect(exactTrace[0]!.searchStep.phase).toBe('bracket');
    expect(exactTrace[1]!.searchStep.phase).toBe('bracket');

    expect(solver.solve(solver.parse('1000000000000 ORE => 7 FUEL'))).toBe(7n);

    const huge = solver.parse('1 ORE => 1000000000000 FUEL');
    expect(solver.solve(huge)).toBe(10n ** 24n);
    expect(solver.trace(huge).length).toBeLessThanOrEqual(80);
  });

  it('rejects empty input, missing FUEL, cycles, and non-positive maxSteps', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1 ORE => 1 A')).toThrow();
    expect(() => solver.parse('1 B => 1 A\n1 A => 1 B\n1 A => 1 FUEL')).toThrow();
    const net = solver.parse('10 ORE => 1 FUEL');
    expect(() => solver.trace(net, { maxSteps: 0 })).toThrow(RangeError);
  });
});
