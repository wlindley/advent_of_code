import { describe, expect, it } from 'vitest';
import { parseCupLabels } from './model';
import { CupRing } from './ring';
import {
  captureTraceFrame,
  CrabCupsTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  FULL_RING_MAX_CUPS,
  LOCAL_WINDOW_CUPS,
} from './trace';

describe('2020 Day 23 trace', () => {
  it('captures full-ring initial and post-move frames with dynamic getters', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(FULL_RING_MAX_CUPS).toBe(20);
    expect(LOCAL_WINDOW_CUPS).toBe(12);

    const ring = new CupRing(parseCupLabels('389125467'), 9);
    const f0 = captureTraceFrame(ring, 0, 100, null);
    expect(f0).toBeInstanceOf(CrabCupsTraceFrame);
    expect(f0.isFullRing).toBe(true);
    expect(f0.isFinal).toBe(false);
    expect(f0.didWrap).toBe(false);
    expect(f0.firstAfterOne).toBe(2);
    expect(f0.secondAfterOne).toBe(5);
    expect(f0.productAfterOne).toBe(10n);
    expect(f0.labelsAfterOne).toBe('25467389');
    expect(Object.isFrozen(f0)).toBe(true);
    expect(Object.isFrozen(f0.windowFromOne)).toBe(true);
    expect(Object.isFrozen(f0.windowFromCurrent)).toBe(true);

    // Move 1 on 389125467: source 3, dest 2 -> didWrap = false
    const rec1 = ring.advance(1);
    const f1 = captureTraceFrame(ring, 1, 100, rec1);
    expect(f1.didWrap).toBe(false);

    // Move 2 on 389125467: source 2, picked [8, 9, 1], dest 7 -> didWrap = true
    const rec2 = ring.advance(1);
    const f2 = captureTraceFrame(ring, 2, 2, rec2);
    expect(f2.didWrap).toBe(true);
    expect(f2.isFinal).toBe(true);
  });

  it('captures bounded 12-cup windows when cupCount exceeds FULL_RING_MAX_CUPS', () => {
    const ring = new CupRing(parseCupLabels('389125467'), 25);
    const rec = ring.advance(1);
    const frame = captureTraceFrame(ring, 1, 10, rec);
    expect(frame.isFullRing).toBe(false);
    expect(frame.windowFromOne.length).toBe(LOCAL_WINDOW_CUPS);
    expect(frame.windowFromCurrent.length).toBe(LOCAL_WINDOW_CUPS);
    expect(frame.labelsAfterOne).toBeNull();
    expect(frame.productAfterOne).toBe(BigInt(frame.firstAfterOne) * BigInt(frame.secondAfterOne));
  });
});
