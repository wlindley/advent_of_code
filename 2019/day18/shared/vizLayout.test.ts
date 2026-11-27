import { describe, expect, it } from 'vitest';
import { SINGLE_EXPLORER_POLICY } from './vaultPolicy';
import { VaultSolver } from './vaultTrace';
import {
  buildKeyRingBadges,
  computeVaultRenderMetrics,
  formatVaultStatus,
  getRobotPositions,
} from './vizLayout';

describe('vizLayout', () => {
  it('computes bounded HiDPI-ready canvas metrics and rejects invalid dimensions', () => {
    expect(computeVaultRenderMetrics(3, 9)).toEqual({
      cellSize: 32,
      pad: 8,
      width: 9 * 32 + 16,
      height: 3 * 32 + 16,
    });
    expect(computeVaultRenderMetrics(81, 81)).toEqual({
      cellSize: 6,
      pad: 8,
      width: 81 * 6 + 16,
      height: 81 * 6 + 16,
    });
    expect(computeVaultRenderMetrics(200, 200).cellSize).toBe(6);
    expect(() => computeVaultRenderMetrics(0, 10)).toThrow(RangeError);
    expect(() => computeVaultRenderMetrics(5, -2)).toThrow(RangeError);
  });

  it('builds key-ring badges, robot positions, and status strings across frames', () => {
    const solver = new VaultSolver(SINGLE_EXPLORER_POLICY);
    const map = solver.parse('#########\n#b.A.@.a#\n#########');
    const frames = solver.trace(map);
    const first = frames[0]!;
    const last = frames[frames.length - 1]!;

    expect(buildKeyRingBadges(map, first.collectedMask)).toEqual([
      { letter: 'a', collected: false },
      { letter: 'b', collected: false },
    ]);
    expect(buildKeyRingBadges(map, last.collectedMask)).toEqual([
      { letter: 'a', collected: true },
      { letter: 'b', collected: true },
    ]);

    expect(getRobotPositions(first)).toEqual([{ row: 1, col: 5 }]);
    expect(getRobotPositions(last)).toEqual([{ row: 1, col: 1 }]);

    expect(formatVaultStatus(first)).toContain('Ready');
    expect(formatVaultStatus(first)).toContain('Keys 0/2');
    expect(formatVaultStatus(last)).toContain('Robot 1');
    expect(formatVaultStatus(last)).toContain('Keys 2/2');
  });
});
