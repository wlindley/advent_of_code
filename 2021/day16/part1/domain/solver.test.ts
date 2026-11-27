import { describe, expect, it } from 'vitest';
import { VERSION_SUM_POLICY } from '../../shared';
import { solver } from './index';

describe('2021 Day 16 Part 1 solver', () => {
  it('solves official Part 1 version-sum examples using VERSION_SUM_POLICY', () => {
    expect(solver.policy).toBe(VERSION_SUM_POLICY);
    const cases: readonly [string, bigint][] = [
      ['8A004A801A8002F478', 16n],
      ['620080001611562C8802118E34', 12n],
      ['C0015000016115A2E0802F182340', 23n],
      ['A0016C880162017C3686B18A3D4780', 31n],
    ];
    for (const [hex, expected] of cases) {
      const stream = solver.parse(hex);
      const answer = solver.solve(stream);
      expect(answer).toBe(expected);
      expect(solver.formatAnswer(answer)).toBe(expected.toString());
    }
  });

  it('produces bounded decode and reduce trace frames ending at version sum 31', () => {
    const stream = solver.parse('A0016C880162017C3686B18A3D4780');
    const frames = solver.trace(stream, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]!.phase).toBe('decode');
    expect(frames[9]!.phase).toBe('reduce');
    expect(frames[9]!.activeResult).toBe(31n);
    expect(frames[9]!.isComplete).toBe(true);
  });
});
