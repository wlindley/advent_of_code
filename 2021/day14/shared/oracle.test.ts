import { describe, expect, it } from 'vitest';
import { parsePolymerFormula } from './parser';
import { InsertionRule, PolymerFormula } from './polymer';

const EXAMPLE_INPUT = [
  'NNCB',
  '',
  'CH -> B',
  'HH -> N',
  'CB -> H',
  'NH -> C',
  'HB -> C',
  'HC -> B',
  'HN -> C',
  'NN -> C',
  'BH -> H',
  'NC -> B',
  'NB -> B',
  'BN -> B',
  'BB -> N',
  'BC -> B',
  'CC -> N',
  'CN -> C',
].join('\n');

function expandBruteForce(formula: PolymerFormula, steps: number): string {
  let polymer = formula.template;
  for (let step = 0; step < steps; step += 1) {
    let next = polymer.slice(0, 1);
    for (let i = 0; i < polymer.length - 1; i += 1) {
      const pair = polymer.slice(i, i + 2);
      const rule = formula.ruleFor(pair);
      next += (rule ? rule.insert : '') + pair.slice(1, 2);
    }
    polymer = next;
  }
  return polymer;
}

function countElementsBruteForce(polymer: string): Map<string, bigint> {
  const counts = new Map<string, bigint>();
  for (const ch of polymer) {
    counts.set(ch, (counts.get(ch) ?? 0n) + 1n);
  }
  return counts;
}

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('PolymerState brute-force and algebraic oracle', () => {
  it('matches the official example across steps 0..10', () => {
    const formula = parsePolymerFormula(EXAMPLE_INPUT);
    const expectedStrings = new Map<number, string>([
      [1, 'NCNBCHB'],
      [2, 'NBCCNBBBCBHCB'],
      [3, 'NBBBCNCCNBBNBNBBCHBHHBCHB'],
      [4, 'NBBNBNBBCCNBCNCCNBBNBBNBBBNBBNBBCBHCBHHNHCBBCBHCB'],
    ]);

    for (let step = 0; step <= 10; step += 1) {
      const oraclePolymer = expandBruteForce(formula, step);
      const oracleCounts = countElementsBruteForce(oraclePolymer);
      const state = formula.initialState().advance(formula, step);

      expect(state.totalLength).toBe(BigInt(oraclePolymer.length));
      for (const freq of state.elementFrequencies) {
        expect(freq.count).toBe(oracleCounts.get(freq.element));
      }
      expect(state.elementFrequencies.length).toBe(oracleCounts.size);

      const expectedStr = expectedStrings.get(step);
      if (expectedStr !== undefined) {
        expect(oraclePolymer).toBe(expectedStr);
      }
    }

    expect(formula.initialState().advance(formula, 5).totalLength).toBe(97n);
    const step10 = formula.initialState().advance(formula, 10);
    expect(step10.totalLength).toBe(3073n);
    expect(step10.elementFrequencies).toEqual([
      { element: 'B', count: 1749n },
      { element: 'N', count: 865n },
      { element: 'C', count: 298n },
      { element: 'H', count: 161n },
    ]);
    expect(step10.spread).toBe(1588n);
  });

  it('matches brute-force expansion across 30 seeded random formulas (complete & partial)', () => {
    const rand = createPrng(202114);
    const alphabetPool = 'ABCDEF';

    for (let trial = 0; trial < 30; trial += 1) {
      const alphaSize = 1 + Math.floor(rand() * 6);
      const alphabet = alphabetPool.slice(0, alphaSize);
      const templateLen = 1 + Math.floor(rand() * 8);
      let template = '';
      for (let i = 0; i < templateLen; i += 1) {
        template += alphabet[Math.floor(rand() * alphaSize)]!;
      }

      const completeTable = trial % 2 === 0;
      const rules: InsertionRule[] = [];
      for (let i = 0; i < alphaSize; i += 1) {
        for (let j = 0; j < alphaSize; j += 1) {
          if (completeTable || rand() < 0.55) {
            const insert = alphabet[Math.floor(rand() * alphaSize)]!;
            rules.push(new InsertionRule(alphabet[i]! + alphabet[j]!, insert));
          }
        }
      }

      const formula = new PolymerFormula(template, rules);
      for (let step = 0; step <= 6; step += 1) {
        const oraclePolymer = expandBruteForce(formula, step);
        const oracleCounts = countElementsBruteForce(oraclePolymer);
        const state = formula.initialState().advance(formula, step);

        expect(state.totalLength).toBe(BigInt(oraclePolymer.length));
        const sumElements = state.elementFrequencies.reduce((acc, f) => acc + f.count, 0n);
        const totalPairs = Array.from(state.pairCounts.values()).reduce((acc, c) => acc + c, 0n);
        expect(sumElements).toBe(totalPairs + 1n);
        expect(sumElements).toBe(state.totalLength);

        if (completeTable) {
          const expectedClosedForm = BigInt(template.length - 1) * (1n << BigInt(step)) + 1n;
          expect(state.totalLength).toBe(expectedClosedForm);
        }

        for (const freq of state.elementFrequencies) {
          expect(freq.count).toBe(oracleCounts.get(freq.element));
        }
        expect(state.elementFrequencies.length).toBe(oracleCounts.size);
      }
    }
  });

  it('satisfies semigroup composition and handles > 2^64 BigInt lengths at step 80', () => {
    const formula = parsePolymerFormula(EXAMPLE_INPUT);
    const initial = formula.initialState();
    const composed = initial.advance(formula, 3).advance(formula, 7);
    const direct = initial.advance(formula, 10);
    expect(composed.pairCounts).toEqual(direct.pairCounts);
    expect(composed.elementFrequencies).toEqual(direct.elementFrequencies);

    const step80 = initial.advance(formula, 80);
    const closedForm80 = 3n * (1n << 80n) + 1n;
    expect(step80.totalLength).toBe(closedForm80);
    expect(step80.totalLength > 1n << 64n).toBe(true);
  });
});
