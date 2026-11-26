import { describe, expect, it } from 'vitest';
import { parseCircuitBlueprint } from './parser';
import { CircuitSimulator } from './simulator';
import type { PulseEvent } from './types';

const EXAMPLE_1 = [
  'broadcaster -> a, b, c',
  '%a -> b',
  '%b -> c',
  '%c -> inv',
  '&inv -> a',
].join('\n');

const EXAMPLE_2 = [
  'broadcaster -> a',
  '%a -> inv, con',
  '&inv -> b',
  '%b -> con',
  '&con -> output',
].join('\n');

describe('day20 CircuitSimulator', () => {
  it('simulates Example 1 for 1000 presses producing 32000000n', () => {
    const sim = new CircuitSimulator(parseCircuitBlueprint(EXAMPLE_1));
    expect(sim.pressCount).toBe(0);
    expect(sim.totalPulses).toBe(0);

    const summaries = sim.runPresses(1000);
    expect(summaries).toHaveLength(1000);
    expect(summaries[0]).toEqual({ press: 1, lowPulses: 8, highPulses: 4 });
    expect(sim.pressCount).toBe(1000);
    expect(sim.totalLow).toBe(8000);
    expect(sim.totalHigh).toBe(4000);
    expect(sim.totalPulses).toBe(12000);
    expect(sim.product).toBe(32_000_000n);
  });

  it('simulates Example 2 per-press counts and 1000-press product 11687500n', () => {
    const sim = new CircuitSimulator(parseCircuitBlueprint(EXAMPLE_2));
    const firstFour = sim.runPresses(4);
    expect(firstFour).toEqual([
      { press: 1, lowPulses: 4, highPulses: 4 },
      { press: 2, lowPulses: 4, highPulses: 2 },
      { press: 3, lowPulses: 5, highPulses: 3 },
      { press: 4, lowPulses: 4, highPulses: 2 },
    ]);
    expect(sim.snapshotModules().con).toEqual({
      kind: 'conjunction',
      memory: { a: 'low', b: 'low' },
    });

    sim.runPresses(996);
    expect(sim.totalLow).toBe(4250);
    expect(sim.totalHigh).toBe(2750);
    expect(sim.product).toBe(11_687_500n);
  });

  it('notifies onPulse after applying pulse to totals and target state', () => {
    const sim = new CircuitSimulator(parseCircuitBlueprint(EXAMPLE_2));
    const observed: Array<{ event: PulseEvent; totalPulses: number; aState: unknown }> = [];
    sim.pressButton((event) => {
      observed.push({
        event,
        totalPulses: sim.totalPulses,
        aState: sim.snapshotModules().a,
      });
    });

    expect(observed).toHaveLength(8);
    expect(observed[0]).toEqual({
      event: { press: 1, from: 'button', to: 'broadcaster', pulse: 'low' },
      totalPulses: 1,
      aState: { kind: 'flip-flop', isOn: false },
    });
    expect(observed[1]).toEqual({
      event: { press: 1, from: 'broadcaster', to: 'a', pulse: 'low' },
      totalPulses: 2,
      aState: { kind: 'flip-flop', isOn: true },
    });
  });

  it('enforces maxPulsesPerPress and positive integer press counts', () => {
    const bp = parseCircuitBlueprint(EXAMPLE_1);
    expect(() => new CircuitSimulator(bp, 0)).toThrow(RangeError);

    const bounded = new CircuitSimulator(bp, 5);
    expect(() => bounded.pressButton()).toThrow(/Pulse limit/);

    const sim = new CircuitSimulator(bp);
    expect(() => sim.runPresses(0)).toThrow(RangeError);
  });
});
