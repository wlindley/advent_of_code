import { describe, expect, it } from 'vitest';
import { ceilDiv } from '../../../shared/core';
import { FUEL_CHEMICAL, ORE_CHEMICAL, parseReactionNetwork, type ReactionNetwork } from './models';
import { findMaxFuelForOre, oreRequiredForFuel } from './stoichiometry';

function simulateSurplusDemand(network: ReactionNetwork, fuelAmount: bigint): bigint {
  const surplus = new Map<string, bigint>();
  const queue: Array<{ chemical: string; amount: bigint }> = [{ chemical: FUEL_CHEMICAL, amount: fuelAmount }];
  let oreTotal = 0n;

  for (let head = 0; head < queue.length; head++) {
    const item = queue[head]!;
    if (item.chemical === ORE_CHEMICAL) {
      oreTotal += item.amount;
      continue;
    }
    const spare = surplus.get(item.chemical) ?? 0n;
    if (spare >= item.amount) {
      surplus.set(item.chemical, spare - item.amount);
      continue;
    }
    const deficit = item.amount - spare;
    const rxn = network.reactionFor(item.chemical)!;
    const batches = ceilDiv(deficit, rxn.output.quantity);
    surplus.set(item.chemical, batches * rxn.output.quantity - deficit);
    for (const input of rxn.inputs) {
      queue.push({ chemical: input.chemical, amount: input.quantity * batches });
    }
  }
  return oreTotal;
}

function nextSeededInt(state: { value: number }, maxExclusive: number): number {
  state.value = (Math.imul(state.value, 1664525) + 1013904223) >>> 0;
  return state.value % maxExclusive;
}

function shuffleLines(lines: string[], seedState: { value: number }): string {
  const copy = [...lines];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = nextSeededInt(seedState, i + 1);
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy.join('\n');
}

function generateRandomDagInput(seed: number): string {
  const rng = { value: seed };
  const midCount = 4 + nextSeededInt(rng, 5);
  const chems = Array.from({ length: midCount }, (_, i) => String.fromCharCode(65 + i));
  const nodes = [...chems, FUEL_CHEMICAL];
  const lines: string[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const available = [ORE_CHEMICAL, ...chems.slice(0, i)];
    const inputCount = 1 + nextSeededInt(rng, Math.min(3, available.length));
    const chosen = new Set<string>();
    while (chosen.size < inputCount) {
      chosen.add(available[nextSeededInt(rng, available.length)]!);
    }
    const lhs = [...chosen].map((c) => `${1 + nextSeededInt(rng, 12)} ${c}`).join(', ');
    const outQty = nodes[i] === FUEL_CHEMICAL ? 1 : 1 + nextSeededInt(rng, 9);
    lines.push(`${lhs} => ${outQty} ${nodes[i]}`);
  }
  return shuffleLines(lines, rng);
}

const OFFICIAL_LINES = [
  ['10 ORE => 10 A', '1 ORE => 1 B', '7 A, 1 B => 1 C', '7 A, 1 C => 1 D', '7 A, 1 D => 1 E', '7 A, 1 E => 1 FUEL'],
  ['9 ORE => 2 A', '8 ORE => 3 B', '7 ORE => 5 C', '3 A, 4 B => 1 AB', '5 B, 7 C => 1 BC', '4 C, 1 A => 1 CA', '2 AB, 3 BC, 4 CA => 1 FUEL'],
  ['157 ORE => 5 NZVS', '165 ORE => 6 DCFZ', '44 XJWVT, 5 KHKGT, 1 QDVJ, 29 NZVS, 9 GPVTF, 48 HKGWZ => 1 FUEL', '12 HKGWZ, 1 GPVTF, 8 PSHF => 9 QDVJ', '179 ORE => 7 PSHF', '177 ORE => 5 HKGWZ', '7 DCFZ, 7 PSHF => 2 XJWVT', '165 ORE => 2 GPVTF', '3 DCFZ, 7 NZVS, 5 HKGWZ, 10 PSHF => 8 KHKGT'],
];

function linearMaxFuelOracle(network: ReactionNetwork, oreBudget: bigint): bigint {
  let fuel = 0n;
  while (oreRequiredForFuel(network, fuel + 1n) <= oreBudget) {
    fuel += 1n;
  }
  return fuel;
}

describe('day14 stoichiometry differential oracle', () => {
  it('matches order-agnostic surplus FIFO queue across shuffled examples and multi-FUEL targets', () => {
    const rng = { value: 42 };
    const targets = [1n, 2n, 7n, 100n];
    for (const lines of OFFICIAL_LINES) {
      const net = parseReactionNetwork(shuffleLines(lines, rng));
      for (const fuel of targets) {
        expect(oreRequiredForFuel(net, fuel)).toBe(simulateSurplusDemand(net, fuel));
      }
    }
  });

  it('matches surplus FIFO oracle across 20 seeded random DAGs', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const net = parseReactionNetwork(generateRandomDagInput(seed * 7919));
      for (const fuel of [1n, 5n, 23n]) {
        expect(oreRequiredForFuel(net, fuel)).toBe(simulateSurplusDemand(net, fuel));
      }
    }
  });

  it('matches linear-scan oracle for findMaxFuelForOre on small budgets 0..300', () => {
    const net1 = parseReactionNetwork(OFFICIAL_LINES[0]!.join('\n'));
    const net2 = parseReactionNetwork(OFFICIAL_LINES[1]!.join('\n'));
    for (let budget = 0n; budget <= 300n; budget += 5n) {
      expect(findMaxFuelForOre(net1, budget).maxFuel).toBe(linearMaxFuelOracle(net1, budget));
      expect(findMaxFuelForOre(net2, budget).maxFuel).toBe(linearMaxFuelOracle(net2, budget));
    }
  });
});
