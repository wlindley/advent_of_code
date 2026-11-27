import { describe, expect, it } from 'vitest';
import { BeaconScannerPolicy } from './policy';
import { ScannerReport } from './scanner';
import { DEFAULT_MAX_TRACE_STEPS, traceBeaconAlignment } from './trace';
import { Vec3 } from './vec3';

const TEST_BEACON_POLICY = new BeaconScannerPolicy('beacon-count', 'Unique Beacons', 3);
const TEST_MANHATTAN_POLICY = new BeaconScannerPolicy('max-manhattan', 'Max Scanner Manhattan', 3);

function makeThreeScannerChain(): readonly ScannerReport[] {
  const s0 = new ScannerReport(0, [new Vec3(0, 0, 0), new Vec3(1, 3, 7), new Vec3(4, 11, 2)]);
  const s1 = new ScannerReport(1, [
    new Vec3(10, 0, 0),
    new Vec3(11, 3, 7),
    new Vec3(14, 11, 2),
    new Vec3(20, 5, 1),
  ]);
  const s2 = new ScannerReport(2, [
    new Vec3(10, 20, 0),
    new Vec3(11, 23, 7),
    new Vec3(14, 31, 2),
    new Vec3(20, 25, 1),
    new Vec3(99, 88, 77),
  ]);
  return [s0, s1, s2];
}

describe('traceBeaconAlignment', () => {
  it('traces progressive alignment frames with omitted options (default cap) and both policies', () => {
    const reports = makeThreeScannerChain();
    const defaultFrames = traceBeaconAlignment(reports, TEST_BEACON_POLICY);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(48);
    expect(Object.isFrozen(defaultFrames)).toBe(true);
    expect(defaultFrames).toHaveLength(3);
    expect(defaultFrames[0]!.activeScanner.isAnchor).toBe(true);
    expect(defaultFrames[0]!.newlyAddedCount).toBe(3);
    expect(defaultFrames[0]!.metricValue).toBe(3);
    expect(defaultFrames[0]!.isComplete).toBe(false);
    expect(defaultFrames[2]!.metricValue).toBe(5);
    expect(defaultFrames[2]!.isComplete).toBe(true);

    const manhattanFrames = traceBeaconAlignment(reports, TEST_MANHATTAN_POLICY);
    expect(manhattanFrames[0]!.metricValue).toBe(0);
    expect(manhattanFrames[2]!.metricValue).toBe(30);
  });

  it('bounds trace frames via maxSteps while preserving first and final frames', () => {
    const reports = makeThreeScannerChain();
    const sampled = traceBeaconAlignment(reports, TEST_BEACON_POLICY, { maxSteps: 2 });
    expect(sampled).toHaveLength(2);
    expect(sampled[0]!.rawIndex).toBe(0);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[0]!.totalRawSteps).toBe(3);
    expect(sampled[1]!.rawIndex).toBe(2);
    expect(sampled[1]!.stepIndex).toBe(1);
    expect(sampled[1]!.isComplete).toBe(true);
    expect(sampled[1]!.metricValue).toBe(5);

    expect(() => traceBeaconAlignment(reports, TEST_BEACON_POLICY, { maxSteps: 0 })).toThrow(RangeError);
  });
});
