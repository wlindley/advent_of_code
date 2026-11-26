import { describe, expect, it } from 'vitest';
import { CompressedValveNetwork } from './compressedNetwork';
import { findOptimalSchedule, ValveSchedule } from './pressureSearch';
import { buildValveTimeline, DEFAULT_MAX_TRACE_STEPS } from './timeline';
import { ValveNetwork } from './valveNetwork';

describe('buildValveTimeline', () => {
  it('traces moving, opening, idle states, activeFlowRate, and cumulativePressure per minute', () => {
    const net = new ValveNetwork([
      { name: 'AA', flowRate: 0, tunnels: ['BB'] },
      { name: 'BB', flowRate: 10, tunnels: ['AA', 'CC'] },
      { name: 'CC', flowRate: 5, tunnels: ['BB'] },
    ]);
    const compressed = CompressedValveNetwork.fromNetwork(net);
    const schedule = findOptimalSchedule(compressed, 6);
    // AA -> BB (travel 1, open at 2, flow 10) -> CC (travel 1, open at 4, flow 5)
    // Total at min 6: 10*(6-2) + 5*(6-4) = 40 + 10 = 50
    const frames = buildValveTimeline(compressed, [{ label: 'You', schedule }], 6);

    expect(frames).toHaveLength(7);
    expect(frames[0]).toMatchObject({
      minute: 0,
      openedMask: 0,
      activeFlowRate: 0,
      cumulativePressure: 0,
      agents: [{ label: 'You', status: 'idle', fromIndex: 2, toIndex: 2, progress: 0, openedCount: 0 }],
    });
    expect(frames[1]).toMatchObject({
      minute: 1,
      activeFlowRate: 0,
      cumulativePressure: 0,
      agents: [{ label: 'You', status: 'moving', fromIndex: 2, toIndex: 0, progress: 1, openedCount: 0 }],
    });
    expect(frames[2]).toMatchObject({
      minute: 2,
      openedMask: 1,
      activeFlowRate: 10,
      cumulativePressure: 0,
      agents: [{ label: 'You', status: 'opening', fromIndex: 0, toIndex: 0, progress: 1, openedCount: 1 }],
    });
    expect(frames[6]).toMatchObject({
      minute: 6,
      openedMask: 3,
      activeFlowRate: 15,
      cumulativePressure: 50,
      agents: [{ label: 'You', status: 'idle', fromIndex: 1, toIndex: 1, progress: 0, openedCount: 2 }],
    });
  });

  it('supports multi-step edge interpolation, start-node opening (travel=0), and multi-agent traces', () => {
    const net = new ValveNetwork([
      { name: 'AA', flowRate: 20, tunnels: ['BB'] },
      { name: 'BB', flowRate: 0, tunnels: ['AA', 'CC'] },
      { name: 'CC', flowRate: 10, tunnels: ['BB'] },
    ]);
    const compressed = CompressedValveNetwork.fromNetwork(net);
    // AA=0 (flow 20), CC=1 (flow 10), BB=2 (flow 0)
    const you = new ValveSchedule(5, [
      { valveIndex: 0, valveName: 'AA', flowRate: 20, travelMinutes: 0, openedAtMinute: 1 },
    ]);
    const elephant = new ValveSchedule(5, [
      { valveIndex: 1, valveName: 'CC', flowRate: 10, travelMinutes: 2, openedAtMinute: 3 },
    ]);
    const frames = buildValveTimeline(
      compressed,
      [
        { label: 'You', schedule: you },
        { label: 'Elephant', schedule: elephant },
      ],
      5,
    );

    expect(frames[1]!.agents[0]).toMatchObject({ status: 'opening', fromIndex: 0, toIndex: 0, progress: 1 });
    expect(frames[1]!.agents[1]).toMatchObject({ status: 'moving', fromIndex: 0, toIndex: 1, progress: 0.5 });
    expect(frames[2]!.agents[1]).toMatchObject({ status: 'moving', fromIndex: 0, toIndex: 1, progress: 1 });
    expect(frames[5]!.cumulativePressure).toBe(20 * 4 + 10 * 2);
  });

  it('bounds trace length via sampleTraceIndices and validates inputs', () => {
    const net = new ValveNetwork([
      { name: 'AA', flowRate: 0, tunnels: ['BB'] },
      { name: 'BB', flowRate: 10, tunnels: ['AA'] },
    ]);
    const compressed = CompressedValveNetwork.fromNetwork(net);
    const schedule = findOptimalSchedule(compressed, 100);
    const capped = buildValveTimeline(compressed, [{ label: 'You', schedule }], 100);
    expect(capped.length).toBe(DEFAULT_MAX_TRACE_STEPS);
    expect(capped[0]!.minute).toBe(0);
    expect(capped[capped.length - 1]!.minute).toBe(100);

    const custom = buildValveTimeline(compressed, [{ label: 'You', schedule }], 100, { maxSteps: 5 });
    expect(custom.length).toBe(5);

    expect(() => buildValveTimeline(compressed, [], 100)).toThrow(/at least one route/i);
    expect(() => buildValveTimeline(compressed, [{ label: 'You', schedule }], 30)).toThrow(/timeLimit/i);
    expect(() =>
      buildValveTimeline(
        compressed,
        [
          { label: 'A', schedule },
          { label: 'B', schedule },
        ],
        100,
      ),
    ).toThrow(/disjoint/i);
  });
});
