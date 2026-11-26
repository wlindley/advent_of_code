import { describe, expect, it } from 'vitest';
import { CircuitSimulator, parseCircuitBlueprint, type PulseEvent } from '../../shared';
import { FeederCycleTracker } from './cycles';
import { NOOP_OBSERVER, Part2TraceRecorder } from './trace';

const TWO_INPUT_CIRCUIT = [
  'broadcaster -> a, b',
  '%a -> agg',
  '%b -> agg',
  '&agg -> rx',
].join('\n');

describe('day20 part2 Part2TraceRecorder & NOOP_OBSERVER', () => {
  it('provides a frozen NOOP_OBSERVER whose callbacks are safe no-ops', () => {
    const bp = parseCircuitBlueprint(TWO_INPUT_CIRCUIT);
    const sim = new CircuitSimulator(bp);
    const tracker = FeederCycleTracker.forTarget(bp, 'rx')!;
    const ev: PulseEvent = { press: 1, from: 'a', to: 'agg', pulse: 'high' };

    expect(Object.isFrozen(NOOP_OBSERVER)).toBe(true);
    NOOP_OBSERVER.onInitial(sim, tracker);
    NOOP_OBSERVER.onFeederHit(sim, ev, { kind: 'first', input: 'a', press: 1 }, tracker);
    NOOP_OBSERVER.onDirectHit(sim, { press: 1, from: 'agg', to: 'rx', pulse: 'low' });
    NOOP_OBSERVER.onCyclesComplete(sim, tracker, 1n);
  });

  it('captures frozen milestone frames for cycle search and samples via finalize', () => {
    const bp = parseCircuitBlueprint(TWO_INPUT_CIRCUIT);
    const sim = new CircuitSimulator(bp);
    const tracker = FeederCycleTracker.forTarget(bp, 'rx')!;
    const rec = new Part2TraceRecorder();

    expect(rec.finalize(10)).toEqual([]);
    rec.onInitial(sim, tracker);

    const e1: PulseEvent = { press: 3, from: 'a', to: 'agg', pulse: 'high' };
    const h1 = tracker.record(e1)!;
    rec.onFeederHit(sim, e1, h1, tracker);

    const e2: PulseEvent = { press: 6, from: 'a', to: 'agg', pulse: 'high' };
    const h2 = tracker.record(e2)!;
    rec.onFeederHit(sim, e2, h2, tracker);

    const e3: PulseEvent = { press: 5, from: 'b', to: 'agg', pulse: 'high' };
    const h3 = tracker.record(e3)!;
    rec.onFeederHit(sim, e3, h3, tracker);

    const e4: PulseEvent = { press: 10, from: 'b', to: 'agg', pulse: 'high' };
    const h4 = tracker.record(e4)!;
    rec.onFeederHit(sim, e4, h4, tracker);
    rec.onCyclesComplete(sim, tracker, tracker.computeLcm());

    const allFrames = rec.finalize(20);
    expect(allFrames).toHaveLength(6);
    expect(Object.isFrozen(allFrames)).toBe(true);
    expect(Object.isFrozen(allFrames[0])).toBe(true);
    expect(allFrames[0]!.stepIndex).toBe(0);
    expect(allFrames[0]!.totalRawSteps).toBe(6);
    expect(allFrames[0]!.activePulse).toBeNull();
    expect(allFrames[0]!.highlightedNodes).toEqual([]);
    expect(allFrames[1]!.activePulse).toEqual(e1);
    expect(Object.isFrozen(allFrames[1]!.activePulse)).toBe(true);
    expect(allFrames[1]!.highlightedNodes).toEqual(['a', 'agg']);
    expect(allFrames[2]!.caption).toContain('period 3');
    expect(allFrames[5]!.activePulse).toBeNull();
    expect(allFrames[5]!.highlightedNodes).toEqual(['agg', 'a', 'b', 'rx']);
    expect(allFrames[5]!.caption).toContain('15');

    const sampled = rec.finalize(2);
    expect(sampled.map((f) => f.stepIndex)).toEqual([0, 5]);
    expect(() => rec.finalize(0)).toThrow(RangeError);
  });

  it('captures initial and direct-hit frames when no aggregator tracker exists', () => {
    const bp = parseCircuitBlueprint('broadcaster -> rx');
    const sim = new CircuitSimulator(bp);
    const rec = new Part2TraceRecorder();
    rec.onInitial(sim, null);
    sim.pressButton();
    rec.onDirectHit(sim, { press: 1, from: 'broadcaster', to: 'rx', pulse: 'low' });

    const frames = rec.finalize(10);
    expect(frames).toHaveLength(2);
    expect(frames[0]!.highlightedNodes).toEqual([]);
    expect(frames[1]!.activePulse).toEqual({ press: 1, from: 'broadcaster', to: 'rx', pulse: 'low' });
    expect(frames[1]!.highlightedNodes).toEqual(['broadcaster', 'rx']);
    expect(frames[1]!.caption).toContain('rx');
  });
});
