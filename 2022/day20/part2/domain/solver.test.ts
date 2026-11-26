import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const KEY = 811589153n;
const ROUNDS = 10;
const OFFICIAL_EXAMPLE = ['1', '2', '-3', '3', '-2', '0', '4'].join('\n');

class FakeClock implements Clock {
  private tick = 100;
  nowMs(): number {
    this.tick += 12;
    return this.tick;
  }
}

function rotateFromZero(order: readonly number[], zeroId: number): number[] {
  const start = order.indexOf(zeroId);
  return [...order.slice(start), ...order.slice(0, start)];
}

function runNaiveTenRoundOracle(values: readonly bigint[]): { order: number[]; sum: bigint } {
  const n = values.length;
  const order = Array.from({ length: n }, (_, i) => i);
  if (n > 2) {
    const period = BigInt(n - 1);
    for (let round = 0; round < ROUNDS; round += 1) {
      for (let id = 0; id < n; id += 1) {
        const rem = (values[id]! * KEY) % period;
        const steps = Number(rem < 0n ? rem + period : rem);
        if (steps === 0) continue;
        const from = order.indexOf(id);
        order.splice(from, 1);
        const raw = (from + steps) % (n - 1);
        order.splice(raw === 0 ? n - 1 : raw, 0, id);
      }
    }
  }
  const zeroIdx = order.indexOf(values.indexOf(0n));
  let sum = 0n;
  for (const offset of [1000, 2000, 3000]) {
    sum += values[order[(zeroIdx + offset) % n]!]! * KEY;
  }
  return { order, sum };
}

function assertMatchesOracle(raw: string, expectedSum?: bigint): void {
  const file = solver.parse(raw);
  const oracle = runNaiveTenRoundOracle(file.values);
  const actualSum = solver.solve(file);
  const frames = solver.trace(file);
  const lastFrame = frames[frames.length - 1]!;
  expect(actualSum).toBe(oracle.sum);
  if (expectedSum !== undefined) expect(actualSum).toBe(expectedSum);
  expect(rotateFromZero(lastFrame.slots.map((s) => s.id), file.zeroId)).toEqual(
    rotateFromZero(oracle.order, file.zeroId),
  );
}

describe('2022 Day 20 Part 2 solver', () => {
  it('solves the official example via executeSolver with FakeClock', () => {
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, new FakeClock());
    expect(exec.answer).toBe(1623178306n);
    expect(exec.elapsedMs).toBe(12);
    expect(exec.runtime).toBe('main-thread');
  });

  it('matches naive 10-round splice oracle across official, duplicate, boundary, and BigInt cases', () => {
    assertMatchesOracle(OFFICIAL_EXAMPLE, 1623178306n);
    assertMatchesOracle(['2', '2', '-2', '0', '2', '-2', '3', '-3'].join('\n'));
    assertMatchesOracle('0', 0n);
    assertMatchesOracle(['5', '0'].join('\n'), 0n);
    assertMatchesOracle(['-1', '0', '1'].join('\n'));
    assertMatchesOracle(['11098227', '-11098229', '0', '11098231', '-11098233'].join('\n'));
  });

  it('preserves trace metadata and endpoints with omitted options and maxSteps cap', () => {
    const file = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(file);
    expect(full).toHaveLength(71);
    expect(full[0]).toMatchObject({
      round: 0,
      moveCount: 0,
      totalRounds: 10,
      totalMoves: 70,
      finalSum: 1623178306n,
      isSampled: false,
    });
    expect(full[70]).toMatchObject({ round: 10, moveCount: 70 });
    expect(full[70]!.coordinates.sum).toBe(1623178306n);

    const capped = solver.trace(file, { maxSteps: 10 });
    expect(capped).toHaveLength(10);
    expect(capped[0]!.moveCount).toBe(0);
    expect(capped[9]!.moveCount).toBe(70);
    expect(capped[9]!.round).toBe(10);
    expect(capped[9]!.coordinates.sum).toBe(1623178306n);
  });

  it('rejects non-integer input with SyntaxError', () => {
    expect(() => solver.parse('1\n2.5\n0')).toThrow(SyntaxError);
  });

  it('rejects empty input with RangeError', () => {
    expect(() => solver.parse('   \n  ')).toThrow(RangeError);
  });

  it('rejects input missing zero with RangeError', () => {
    expect(() => solver.parse('1\n2\n3')).toThrow(RangeError);
  });

  it('rejects input with duplicate zeros with RangeError', () => {
    expect(() => solver.parse('0\n1\n0')).toThrow(RangeError);
  });
});
