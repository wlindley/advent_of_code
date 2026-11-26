import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, solver, sumValidMiddlePages, tracePrintQueue } from './solver';

const OFFICIAL_EXAMPLE = [
  '47|53', '97|13', '97|61', '97|47', '75|29', '61|13', '75|53',
  '29|13', '97|29', '53|29', '61|53', '97|53', '61|29', '47|13',
  '75|47', '97|75', '47|61', '75|61', '47|29', '75|13', '53|13',
  '',
  '75,47,61,53,29',
  '97,61,53,29,13',
  '75,29,13',
  '75,97,47,61,53',
  '61,13,29',
  '97,13,75,29,47',
].join('\n');

function ruleScanPositionMapOracle(raw: string): number {
  const [ruleBlock, updateBlock] = raw.trim().split(/\n\s*\n/);
  const rules: [number, number][] = ruleBlock!.split('\n').map((line) => {
    const [a, b] = line.split('|');
    return [Number(a), Number(b)];
  });
  let total = 0;
  for (const line of updateBlock!.split('\n')) {
    const pages = line.split(',').map(Number);
    const pos = new Map<number, number>();
    for (let i = 0; i < pages.length; i++) pos.set(pages[i]!, i);
    let ok = true;
    for (const [before, after] of rules) {
      const bi = pos.get(before);
      const ai = pos.get(after);
      if (bi !== undefined && ai !== undefined && bi > ai) {
        ok = false;
        break;
      }
    }
    if (ok) total += pages[(pages.length - 1) / 2]!;
  }
  return total;
}

function nextRand(state: { seed: number }): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed;
}

function buildSeededInput(seed: number): string {
  const rng = { seed };
  const ruleCount = 4 + (nextRand(rng) % 18);
  const rules: string[] = [];
  for (let r = 0; r < ruleCount; r++) {
    const a = 1 + (nextRand(rng) % 12);
    let b = 1 + (nextRand(rng) % 12);
    if (b === a) b = (a % 12) + 1;
    rules.push(`${a}|${b}`);
  }
  const updateCount = 3 + (nextRand(rng) % 8);
  const updates: string[] = [];
  for (let u = 0; u < updateCount; u++) {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = nextRand(rng) % (i + 1);
      const tmp = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = tmp;
    }
    const len = 1 + 2 * (nextRand(rng) % 4);
    updates.push(pool.slice(0, len).join(','));
  }
  return `${rules.join('\n')}\n\n${updates.join('\n')}`;
}

describe('day05/part1 solver', () => {
  it('solves the official example to 143 and executes cleanly with a fake Clock', () => {
    const times = [10, 14.5];
    let idx = 0;
    const fakeClock: Clock = { nowMs: () => times[idx++] ?? 14.5 };

    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result).toEqual({ answer: 143, elapsedMs: 4.5, runtime: 'main-thread' });
  });

  it('handles all-valid, all-invalid, 1-page, and sparse non-adjacent violations', () => {
    expect(sumValidMiddlePages(solver.parse('1|2\n2|3\n\n1,2,3\n1,3,5'))).toBe(5);
    // Single-page update is trivially valid; two-page rule fails sparse non-adjacent 20,99,10.
    expect(sumValidMiddlePages(solver.parse('10|20\n\n20,99,10\n20,10,99'))).toBe(0);
    expect(sumValidMiddlePages(solver.parse('10|20\n\n42'))).toBe(42);
  });

  it('emits frozen trace frames with dynamic getters and bounded sampling', () => {
    const queue = solver.parse(OFFICIAL_EXAMPLE);
    const full = tracePrintQueue(queue);
    expect(full).toHaveLength(6);
    expect(full[0]?.isValid).toBe(true);
    expect(full[0]?.violationCount).toBe(0);
    expect(full[0]?.middleContribution).toBe(61);
    expect(full[3]?.isValid).toBe(false);
    expect(full[3]?.violationCount).toBe(1);
    expect(full[3]?.middleContribution).toBe(0);
    expect(full[5]?.validCountSoFar).toBe(3);
    expect(full[5]?.middleSumSoFar).toBe(143);
    expect(Object.isFrozen(full)).toBe(true);
    expect(Object.isFrozen(full[0])).toBe(true);
    expect(Object.isFrozen(full[0]?.applicableRules)).toBe(true);

    const sampled3 = tracePrintQueue(queue, { maxSteps: 3 });
    expect(sampled3.map((f) => f.updateIndex)).toEqual([0, 3, 5]);
    expect(sampled3[2]?.middleSumSoFar).toBe(143);

    const sampled1 = tracePrintQueue(queue, { maxSteps: 1 });
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]?.updateIndex).toBe(5);
    expect(sampled1[0]?.middleSumSoFar).toBe(143);

    const manyUpdates = Array.from({ length: 250 }, () => '75,47,61').join('\n');
    const capped = tracePrintQueue(solver.parse(`75|47\n\n${manyUpdates}`));
    expect(capped).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(capped[0]?.updateIndex).toBe(0);
    expect(capped[DEFAULT_MAX_TRACE_STEPS - 1]?.updateIndex).toBe(249);
    expect(capped[DEFAULT_MAX_TRACE_STEPS - 1]?.middleSumSoFar).toBe(250 * 47);

    for (const bad of [0, -2, 1.5]) {
      expect(() => tracePrintQueue(queue, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches the independent rule-scan-position-map oracle across tournaments and random inputs', () => {
    expect(sumValidMiddlePages(solver.parse(OFFICIAL_EXAMPLE))).toBe(
      ruleScanPositionMapOracle(OFFICIAL_EXAMPLE),
    );

    // 5-page regular cyclic tournament (inDeg = outDeg = 2): global cycle, yet [1,2,3] is valid.
    const tournament = [
      '1|2', '1|3', '2|3', '2|4', '3|4', '3|5', '4|5', '4|1', '5|1', '5|2',
      '',
      '1,2,3',
      '1,2,4',
      '1,2,3,4,5',
      '3,4,5',
    ].join('\n');
    const tournamentExpected = ruleScanPositionMapOracle(tournament);
    expect(tournamentExpected).toBe(6);
    expect(sumValidMiddlePages(solver.parse(tournament))).toBe(tournamentExpected);

    for (let i = 1; i <= 30; i++) {
      const raw = buildSeededInput(i * 7919);
      expect(sumValidMiddlePages(solver.parse(raw))).toBe(ruleScanPositionMapOracle(raw));
    }
  });
});
