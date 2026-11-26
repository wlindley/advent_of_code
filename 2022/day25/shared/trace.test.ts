import { describe, expect, it } from 'vitest';
import { parseFuelLedger } from './ledger';
import { SnafuNumber } from './snafu';
import {
  AccumulateFrame,
  buildAccumulateFrames,
  buildEncodeFrames,
  DEFAULT_TRACE_MAX_STEPS,
  EncodeStepFrame,
  traceFuelLedger,
} from './trace';

const OFFICIAL_LEDGER = [
  '1=-0-2', '12111', '2=0=', '21', '2=01', '111', '20012',
  '112', '1=-1=', '1-12', '12', '1=', '122',
].join('\n');

describe('AccumulateFrame and EncodeStepFrame', () => {
  it('validates AccumulateFrame and derives previousDecimal and runningSnafu', () => {
    const entry = new SnafuNumber('21');
    const frame = new AccumulateFrame(3, entry, 100n);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame.kind).toBe('accumulate');
    expect(frame.entryIndex).toBe(3);
    expect(frame.previousDecimal).toBe(89n);
    expect(frame.runningSnafu).toBe('1-00');

    expect(() => new AccumulateFrame(-1, entry, 11n)).toThrow(RangeError);
    expect(() => new AccumulateFrame(1.5, entry, 11n)).toThrow(RangeError);
  });

  it('validates EncodeStepFrame and computes carry=0 and carry=1 getters', () => {
    const step0 = new EncodeStepFrame(0, 4890n, '');
    expect(Object.isFrozen(step0)).toBe(true);
    expect(step0.kind).toBe('encode');
    expect(step0.placeValue).toBe(1n);
    expect(step0.rawQuotient).toBe(978n);
    expect(step0.rawRemainder).toBe(0);
    expect(step0.carry).toBe(0);
    expect(step0.digitValue).toBe(0);
    expect(step0.digit).toBe('0');
    expect(step0.remainingAfter).toBe(978n);
    expect(step0.partialSnafu).toBe('0');
    expect(step0.isFinalStep).toBe(false);

    const step1 = new EncodeStepFrame(1, 978n, '0');
    expect(step1.placeValue).toBe(5n);
    expect(step1.rawQuotient).toBe(195n);
    expect(step1.rawRemainder).toBe(3);
    expect(step1.carry).toBe(1);
    expect(step1.digitValue).toBe(-2);
    expect(step1.digit).toBe('=');
    expect(step1.remainingAfter).toBe(196n);
    expect(step1.partialSnafu).toBe('=0');
    expect(step1.isFinalStep).toBe(false);

    expect(() => new EncodeStepFrame(-1, 5n, '')).toThrow(RangeError);
    expect(() => new EncodeStepFrame(0.5, 5n, '')).toThrow(RangeError);
    expect(() => new EncodeStepFrame(2, 5n, '0')).toThrow(RangeError);
  });
});

describe('buildEncodeFrames and buildAccumulateFrames', () => {
  it('builds complete encode cascades for 0n, 4890n, and negative totals', () => {
    const zeroFrames = buildEncodeFrames(0n);
    expect(zeroFrames).toHaveLength(1);
    expect(zeroFrames[0]!.partialSnafu).toBe('0');
    expect(zeroFrames[0]!.isFinalStep).toBe(true);

    const exampleFrames = buildEncodeFrames(4890n);
    expect(exampleFrames.map((f) => f.partialSnafu)).toEqual(['0', '=0', '1=0', '-1=0', '=-1=0', '2=-1=0']);
    expect(exampleFrames[exampleFrames.length - 1]!.isFinalStep).toBe(true);

    const negFrames = buildEncodeFrames(-12345n);
    expect(negFrames[negFrames.length - 1]!.partialSnafu).toBe('-101110');
  });

  it('preserves exact running prefix sums when sampling accumulate frames', () => {
    const ledger = parseFuelLedger(OFFICIAL_LEDGER);
    const sampled = buildAccumulateFrames(ledger, 4);
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.entryIndex).toBe(0);
    expect(sampled[0]!.runningDecimal).toBe(ledger.entries[0]!.decimal);
    const last = sampled[sampled.length - 1]!;
    expect(last.entryIndex).toBe(ledger.count - 1);
    expect(last.runningDecimal).toBe(4890n);
  });
});

describe('traceFuelLedger', () => {
  it('returns all accumulate and encode frames under default cap', () => {
    expect(DEFAULT_TRACE_MAX_STEPS).toBe(160);
    const ledger = parseFuelLedger(OFFICIAL_LEDGER);
    const frames = traceFuelLedger(ledger);
    expect(frames).toHaveLength(19);
    expect(frames[0]!.kind).toBe('accumulate');
    expect(frames[12]!.kind).toBe('accumulate');
    expect(frames[13]!.kind).toBe('encode');
    const last = frames[frames.length - 1]!;
    expect(last.kind === 'encode' && last.partialSnafu).toBe('2=-1=0');
    expect(last.kind === 'encode' && last.isFinalStep).toBe(true);
  });

  it('caps large traces cleanly including when maxSteps <= encodeFrames.length', () => {
    const ledger = parseFuelLedger(OFFICIAL_LEDGER);

    const cappedWithAccum = traceFuelLedger(ledger, { maxSteps: 10 });
    expect(cappedWithAccum).toHaveLength(10);
    expect(cappedWithAccum.slice(0, 4).every((f) => f.kind === 'accumulate')).toBe(true);
    expect(cappedWithAccum.slice(4).every((f) => f.kind === 'encode')).toBe(true);

    const exactEncodeCap = traceFuelLedger(ledger, { maxSteps: 6 });
    expect(exactEncodeCap).toHaveLength(6);
    expect(exactEncodeCap.every((f) => f.kind === 'encode')).toBe(true);

    const tinyCap = traceFuelLedger(ledger, { maxSteps: 2 });
    expect(tinyCap).toHaveLength(2);
    expect(tinyCap[0]!.kind === 'encode' && tinyCap[0]!.placeIndex).toBe(0);
    expect(tinyCap[1]!.kind === 'encode' && tinyCap[1]!.partialSnafu).toBe('2=-1=0');

    expect(() => traceFuelLedger(ledger, { maxSteps: 0 })).toThrow(RangeError);
  });
});
