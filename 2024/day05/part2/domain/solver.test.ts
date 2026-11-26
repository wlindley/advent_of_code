import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import {
  DEFAULT_MAX_TRACE_STEPS, PrintRepairTraceFrame, repairUpdate,
  solver, sumRepairedMiddlePages, tracePrintRepairs,
} from './solver';

const OFFICIAL_EXAMPLE = [
  '47|53', '97|13', '97|61', '97|47', '75|29', '61|13', '75|53',
  '29|13', '97|29', '53|29', '61|53', '97|53', '61|29', '47|13',
  '75|47', '97|75', '47|61', '75|61', '47|29', '75|13', '53|13',
  '',
  '75,47,61,53,29', '97,61,53,29,13', '75,29,13',
  '75,97,47,61,53', '61,13,29', '97,13,75,29,47',
].join('\n');

function parseRaw(raw: string): { rules: Set<string>; updates: number[][] } {
  const [ruleBlock, updateBlock] = raw.trim().split(/\n\s*\n/);
  return {
    rules: new Set(ruleBlock!.split('\n').map((l) => l.trim())),
    updates: updateBlock!.split('\n').map((l) => l.split(',').map(Number)),
  };
}

function isInvalidPairwise(pages: readonly number[], rules: ReadonlySet<string>): boolean {
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      if (rules.has(`${pages[j]}|${pages[i]}`)) return true;
    }
  }
  return false;
}

function pairwiseComparatorSortOracle(raw: string): number {
  const { rules, updates } = parseRaw(raw);
  let total = 0;
  for (const pages of updates) {
    if (!isInvalidPairwise(pages, rules)) continue;
    const sorted = [...pages].sort((a, b) => (rules.has(`${a}|${b}`) ? -1 : 1));
    total += sorted[(sorted.length - 1) / 2]!;
  }
  return total;
}

function tournamentDegreeRankOracle(raw: string): number {
  const { rules, updates } = parseRaw(raw);
  let total = 0;
  for (const pages of updates) {
    if (!isInvalidPairwise(pages, rules)) continue;
    const ranked = [...pages].sort((a, b) => {
      let inA = 0;
      let inB = 0;
      for (const other of pages) {
        if (other !== a && rules.has(`${other}|${a}`)) inA += 1;
        if (other !== b && rules.has(`${other}|${b}`)) inB += 1;
      }
      return inA - inB;
    });
    total += ranked[(ranked.length - 1) / 2]!;
  }
  return total;
}

function nextRand(state: { seed: number }): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed;
}

function shuffle<T>(items: T[], rng: { seed: number }): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = nextRand(rng) % (i + 1);
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

function buildSeededTournament(seed: number): string {
  const rng = { seed };
  const n = 5 + (nextRand(rng) % 7);
  const order = shuffle(Array.from({ length: n }, (_, i) => i + 1), rng);
  const rules: string[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) rules.push(`${order[i]}|${order[j]}`);
  const updates: string[] = [];
  const count = 3 + (nextRand(rng) % 6);
  for (let u = 0; u < count; u++) {
    const len = 3 + 2 * (nextRand(rng) % Math.max(1, Math.floor((n - 1) / 2)));
    updates.push(shuffle([...order], rng).slice(0, len).join(','));
  }
  return `${rules.join('\n')}\n\n${updates.join('\n')}`;
}

describe('day05/part2 solver', () => {
  it('solves the official example to 123 with a fake Clock', () => {
    const times = [10, 14.5];
    let idx = 0;
    const fakeClock: Clock = { nowMs: () => times[idx++] ?? 14.5 };
    expect(executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock)).toEqual({
      answer: 123, elapsedMs: 4.5, runtime: 'main-thread',
    });
  });

  it('repairs official invalid updates, valid updates, and sparse partial-order DAGs', () => {
    const queue = solver.parse(OFFICIAL_EXAMPLE);
    expect(repairUpdate(queue.rules, queue.updates[3]!).pages).toEqual([97, 75, 47, 61, 53]);
    expect(repairUpdate(queue.rules, queue.updates[4]!).pages).toEqual([61, 29, 13]);
    expect(repairUpdate(queue.rules, queue.updates[5]!).pages).toEqual([97, 75, 47, 29, 13]);
    expect(repairUpdate(queue.rules, queue.updates[0]!).pages).toEqual([75, 47, 61, 53, 29]);

    const sparse = solver.parse('10|20\n20|30\n\n30,99,20,88,10');
    const repaired = repairUpdate(sparse.rules, sparse.updates[0]!);
    expect(sparse.rules.isValidOrder(repaired.pages)).toBe(true);
    expect([...repaired.pages].sort((a, b) => a - b)).toEqual([10, 20, 30, 88, 99]);
  });

  it('handles all-valid with global cycle, all-invalid, 1-page, induced 3-cycle, and bad raw input', () => {
    expect(sumRepairedMiddlePages(solver.parse('1|2\n2|1\n\n5,6,7\n8,9,10'))).toBe(0);
    expect(sumRepairedMiddlePages(solver.parse('1|2\n2|3\n\n3,2,1\n2,3,1'))).toBe(4);
    expect(sumRepairedMiddlePages(solver.parse('10|20\n\n42'))).toBe(0);
    expect(() => sumRepairedMiddlePages(solver.parse('1|2\n2|3\n3|1\n\n1,2,3'))).toThrow(
      'Cycle detected in directed graph',
    );
    expect(() => solver.parse('')).toThrow();
  });

  it('matches both differential oracles on official, 7-node cyclic tournament, and 30 seeded tournaments', () => {
    expect(sumRepairedMiddlePages(solver.parse(OFFICIAL_EXAMPLE))).toBe(123);
    expect(pairwiseComparatorSortOracle(OFFICIAL_EXAMPLE)).toBe(123);
    expect(tournamentDegreeRankOracle(OFFICIAL_EXAMPLE)).toBe(123);

    const rules: string[] = [];
    for (let u = 0; u < 7; u++) {
      for (const d of [1, 2, 3]) rules.push(`${u + 1}|${((u + d) % 7) + 1}`);
    }
    const cyclic7 = `${rules.join('\n')}\n\n3,2,1\n4,2,1\n7,6,5\n1,2,3`;
    const expected7 = pairwiseComparatorSortOracle(cyclic7);
    expect(expected7).toBe(tournamentDegreeRankOracle(cyclic7));
    expect(sumRepairedMiddlePages(solver.parse(cyclic7))).toBe(expected7);

    for (let i = 1; i <= 30; i++) {
      const raw = buildSeededTournament(i * 7919);
      const ans = sumRepairedMiddlePages(solver.parse(raw));
      expect(ans).toBe(pairwiseComparatorSortOracle(raw));
      expect(ans).toBe(tournamentDegreeRankOracle(raw));
    }
  });

  it('emits frozen trace frames with dynamic getters, zero-invalid, sampling, and maxSteps validation', () => {
    const queue = solver.parse(OFFICIAL_EXAMPLE);
    const frames = tracePrintRepairs(queue);
    expect(frames).toHaveLength(3);
    const f0 = frames[0]!;
    expect(f0).toBeInstanceOf(PrintRepairTraceFrame);
    expect([f0.repairIndex, f0.totalInvalidUpdates, f0.updateIndex, f0.totalUpdates]).toEqual([0, 3, 3, 6]);
    expect([f0.repairedCountSoFar, f0.repairedMiddlePage, f0.violationCount, f0.movedPageCount]).toEqual([1, 47, 1, 2]);
    expect(f0.displacements).toEqual([
      { page: 75, fromIndex: 0, toIndex: 1 }, { page: 97, fromIndex: 1, toIndex: 0 },
      { page: 47, fromIndex: 2, toIndex: 2 }, { page: 61, fromIndex: 3, toIndex: 3 },
      { page: 53, fromIndex: 4, toIndex: 4 },
    ]);
    expect(frames[2]!.middleSumSoFar).toBe(123);
    expect(Object.isFrozen(frames) && Object.isFrozen(f0) && Object.isFrozen(f0.displacements)).toBe(true);
    expect(Object.isFrozen(f0.displacements[0]) && Object.isFrozen(f0.originalRules) && Object.isFrozen(f0.repairedRules)).toBe(true);

    const validOnly = solver.parse('1|2\n2|3\n\n1,2,3');
    expect(tracePrintRepairs(validOnly)).toEqual([]);
    expect(tracePrintRepairs(queue, { maxSteps: 2 }).map((f) => f.repairIndex)).toEqual([0, 2]);
    const one = tracePrintRepairs(queue, { maxSteps: 1 });
    expect(one.map((f) => f.repairIndex)).toEqual([2]);
    expect(one[0]!.middleSumSoFar).toBe(123);

    const many = Array.from({ length: 250 }, () => '53,47,61').join('\n');
    const capped = tracePrintRepairs(solver.parse(`47|53\n53|61\n\n${many}`));
    expect(capped).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(capped[0]!.repairIndex).toBe(0);
    expect(capped[DEFAULT_MAX_TRACE_STEPS - 1]!.repairIndex).toBe(249);
    expect(capped[DEFAULT_MAX_TRACE_STEPS - 1]!.middleSumSoFar).toBe(250 * 53);

    for (const bad of [0, -2, 1.5]) {
      expect(() => tracePrintRepairs(queue, { maxSteps: bad })).toThrow(RangeError);
      expect(() => tracePrintRepairs(validOnly, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
