import { describe, expect, it } from 'vitest';
import { alignScanners, DEFAULT_MIN_OVERLAP } from './aligner';
import {
  BEACON_COUNT_POLICY,
  BeaconScannerPolicy,
  MAX_SCANNER_MANHATTAN_POLICY,
} from './policy';
import { ScannerReport } from './scanner';
import { Vec3 } from './vec3';

describe('BeaconScannerPolicy', () => {
  it('evaluates beacon-count and max-manhattan modes and formats answers', () => {
    const s0 = new ScannerReport(0, [new Vec3(0, 0, 0), new Vec3(1, 2, 3)]);
    const s1 = new ScannerReport(1, [new Vec3(10, 20, 30), new Vec3(11, 22, 33)]);
    const map = alignScanners([s0, s1], 2);

    expect(BEACON_COUNT_POLICY.mode).toBe('beacon-count');
    expect(BEACON_COUNT_POLICY.minOverlap).toBe(DEFAULT_MIN_OVERLAP);
    expect(BEACON_COUNT_POLICY.solve(map)).toBe(2);
    expect(BEACON_COUNT_POLICY.formatAnswer(2)).toBe('2');

    expect(MAX_SCANNER_MANHATTAN_POLICY.mode).toBe('max-manhattan');
    expect(MAX_SCANNER_MANHATTAN_POLICY.minOverlap).toBe(DEFAULT_MIN_OVERLAP);
    expect(MAX_SCANNER_MANHATTAN_POLICY.solve(map)).toBe(60);
    expect(MAX_SCANNER_MANHATTAN_POLICY.formatAnswer(60)).toBe('60');

    const custom = new BeaconScannerPolicy('beacon-count', 'Custom', 3);
    expect(Object.isFrozen(custom)).toBe(true);
    expect(custom.label).toBe('Custom');
    expect(custom.minOverlap).toBe(3);
  });
});
