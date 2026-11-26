import { describe, expect, it } from 'vitest';
import {
  BOOST_SENSOR_MODE,
  BOOST_TEST_MODE,
  BoostReport,
  DEFAULT_MAX_MACHINE_STEPS,
  DEFAULT_MAX_TRACE_STEPS,
} from './boostModels';

describe('boostModels constants and modes', () => {
  it('exposes frozen Day 9 BOOST modes and step limits', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(160);
    expect(DEFAULT_MAX_MACHINE_STEPS).toBe(2_000_000);

    expect(Object.isFrozen(BOOST_TEST_MODE)).toBe(true);
    expect(BOOST_TEST_MODE.id).toBe('test');
    expect(BOOST_TEST_MODE.inputSignal).toBe(1n);

    expect(Object.isFrozen(BOOST_SENSOR_MODE)).toBe(true);
    expect(BOOST_SENSOR_MODE.id).toBe('sensor');
    expect(BOOST_SENSOR_MODE.inputSignal).toBe(2n);
  });
});

describe('BoostReport', () => {
  it('computes derived getters for single-output and multi-output runs without storing derived state', () => {
    const single = new BoostReport(BOOST_TEST_MODE, [1219070632396864n], 7, 100n, 3);
    expect(Object.isFrozen(single)).toBe(true);
    expect(Object.isFrozen(single.outputs)).toBe(true);
    expect(single.mode).toBe(BOOST_TEST_MODE);
    expect(single.stepCount).toBe(7);
    expect(single.finalRelativeBase).toBe(100n);
    expect(single.sparseEntryCount).toBe(3);
    expect(single.outputCount).toBe(1);
    expect(single.singleOutput).toBe(true);
    expect(single.hasDiagnosticErrors).toBe(false);
    expect(single.finalOutput).toBe(1219070632396864n);
    expect(single.diagnosticOutputs).toEqual([]);
    expect(Object.isFrozen(single.diagnosticOutputs)).toBe(true);

    const multi = new BoostReport(BOOST_TEST_MODE, [203n, 204n, 999n], 25, 0n, 0);
    expect(multi.outputCount).toBe(3);
    expect(multi.singleOutput).toBe(false);
    expect(multi.hasDiagnosticErrors).toBe(true);
    expect(multi.finalOutput).toBe(999n);
    expect(multi.diagnosticOutputs).toEqual([203n, 204n]);
  });

  it('defensively copies outputs and rejects empty output streams', () => {
    const rawOutputs = [42n];
    const report = new BoostReport(BOOST_SENSOR_MODE, rawOutputs, 2, 0n, 0);
    rawOutputs[0] = 0n;
    expect(report.outputs).toEqual([42n]);

    expect(() => new BoostReport(BOOST_TEST_MODE, [], 1, 0n, 0)).toThrow(Error);
  });
});
