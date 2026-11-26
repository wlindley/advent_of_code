import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS } from '../../shared';
import { solver } from './index';

function bigIntRecursiveOracle(mass: number): number {
  let total = 0n;
  let current = BigInt(mass);
  while (true) {
    const next = current / 3n - 2n;
    if (next <= 0n) return Number(total);
    total += next;
    current = next;
  }
}

function collectBoundaryProbes(): number[] {
  const probes = [Number.MAX_SAFE_INTEGER];
  for (let pow3 = 3; 4 * pow3 <= Number.MAX_SAFE_INTEGER; pow3 *= 3) {
    for (const candidate of [pow3 - 4, pow3 - 3, 4 * pow3 - 4, 4 * pow3 - 3]) {
      if (candidate >= 0) probes.push(candidate);
    }
  }
  return probes;
}

describe('2019 Day 1 Part 2 solver', () => {
  it('solves each official example mass and executeSolver result', () => {
    expect(solver.solve(solver.parse('12'))).toBe(2);
    expect(solver.solve(solver.parse('14'))).toBe(2);
    expect(solver.solve(solver.parse('1969'))).toBe(966);
    expect(solver.solve(solver.parse('100756'))).toBe(50346);
    const result = executeSolver(solver, '12\n14\n1969\n100756');
    expect(result.answer).toBe(51316);
    expect(result.runtime).toBe('main-thread');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('sums fuel per module separately and handles CRLF and blank lines', () => {
    expect(solver.solve(solver.parse('14\n14'))).toBe(4);
    expect(solver.solve(solver.parse('\r\n 14 \r\n\r\n1969\r\n'))).toBe(968);
  });

  it('clamps non-positive fuel and checks exact recursion thresholds', () => {
    for (let mass = 0; mass <= 8; mass += 1) {
      expect(solver.solve(solver.parse(String(mass)))).toBe(0);
    }
    expect(solver.solve(solver.parse('9'))).toBe(1);
    expect(solver.solve(solver.parse('32'))).toBe(8);
    expect(solver.solve(solver.parse('33'))).toBe(10);
  });

  it('matches BigInt recursive oracle across 0..200 and power-of-3 boundaries', () => {
    for (let mass = 0; mass <= 200; mass += 1) {
      expect(solver.solve(solver.parse(String(mass)))).toBe(bigIntRecursiveOracle(mass));
    }
    for (const mass of collectBoundaryProbes()) {
      expect(solver.solve(solver.parse(String(mass)))).toBe(bigIntRecursiveOracle(mass));
    }
  });

  it('emits frozen bounded traces with exact recursive stages and cumulative totals', () => {
    const manifest = solver.parse('12\n14\n1969\n100756');
    const bounded = solver.trace(manifest, { maxSteps: 3 });
    expect(bounded.length).toBe(3);
    expect(Object.isFrozen(bounded)).toBe(true);
    expect(Object.isFrozen(bounded[1])).toBe(true);
    expect(bounded.map((f) => f.moduleIndex)).toEqual([0, 2, 3]);
    expect(bounded[1]!.stages).toEqual([654, 216, 70, 21, 5]);
    expect(bounded[1]!.baseFuel).toBe(654);
    expect(bounded[1]!.extraFuel).toBe(312);
    expect(bounded[1]!.moduleFuel).toBe(966);
    expect(bounded[1]!.cumulativeFuel).toBe(970);
    expect(bounded[2]!.stages).toEqual([33583, 11192, 3728, 1240, 411, 135, 43, 12, 2]);
    expect(bounded[2]!.baseFuel).toBe(33583);
    expect(bounded[2]!.extraFuel).toBe(16763);
    expect(bounded[2]!.moduleFuel).toBe(50346);
    expect(bounded[2]!.cumulativeFuel).toBe(51316);
  });

  it('handles omitted trace options for small and 150-module manifests and rejects maxSteps 0', () => {
    const smallFrames = solver.trace(solver.parse('12\n14\n1969\n100756'));
    expect(smallFrames.length).toBe(4);
    expect(smallFrames[3]!.cumulativeFuel).toBe(51316);
    const largeManifest = solver.parse(Array.from({ length: 150 }, (_, i) => String(i + 12)).join('\n'));
    const sampled = solver.trace(largeManifest);
    expect(sampled.length).toBe(DEFAULT_MAX_TRACE_STEPS);
    expect(sampled[0]!.moduleIndex).toBe(0);
    expect(sampled[sampled.length - 1]!.moduleIndex).toBe(149);
    expect(sampled[sampled.length - 1]!.cumulativeFuel).toBe(solver.solve(largeManifest));
    expect(() => solver.trace(largeManifest, { maxSteps: 0 })).toThrow(RangeError);
  });

  it.each(['', '   \n\t', '-12', '12.5', '12\ninvalid'])(
    'rejects invalid manifest input %j',
    (badInput) => {
      expect(() => solver.parse(badInput)).toThrow(Error);
    },
  );

  it('rejects non-safe-integer mass with RangeError', () => {
    expect(() => solver.parse('9007199254740992')).toThrow(RangeError);
  });
});
