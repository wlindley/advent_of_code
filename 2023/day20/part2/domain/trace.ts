import { sampleTraceIndices } from '../../../../shared/core';
import type { CircuitSimulator, PulseEvent, PulseTraceFrame } from '../../shared';
import type { FeederCycleTracker, FeederHitRecord } from './cycles';

export interface RxSearchObserver {
  onInitial(sim: CircuitSimulator, tracker: FeederCycleTracker | null): void;
  onFeederHit(
    sim: CircuitSimulator,
    event: PulseEvent,
    hit: FeederHitRecord,
    tracker: FeederCycleTracker,
  ): void;
  onDirectHit(sim: CircuitSimulator, event: PulseEvent): void;
  onCyclesComplete(sim: CircuitSimulator, tracker: FeederCycleTracker, lcm: bigint): void;
}

export const NOOP_OBSERVER: RxSearchObserver = Object.freeze({
  onInitial() {},
  onFeederHit() {},
  onDirectHit() {},
  onCyclesComplete() {},
});

type TraceDraft = Omit<PulseTraceFrame, 'stepIndex' | 'totalRawSteps'>;

/** Records milestone frames during rx pulse search and samples them to a bounded trace. */
export class Part2TraceRecorder implements RxSearchObserver {
  private readonly drafts: TraceDraft[] = [];

  private pushDraft(
    sim: CircuitSimulator,
    press: number,
    activePulse: PulseEvent | null,
    highlightedNodes: readonly string[],
    caption: string,
  ): void {
    this.drafts.push({
      press,
      activePulse,
      lowTotal: sim.totalLow,
      highTotal: sim.totalHigh,
      nodeStates: sim.snapshotModules(),
      highlightedNodes: Object.freeze([...highlightedNodes]),
      caption,
    });
  }

  onInitial(sim: CircuitSimulator, tracker: FeederCycleTracker | null): void {
    const caption = tracker
      ? `Initial state: tracking ${tracker.inputs.length} inputs to &${tracker.feeder} -> ${tracker.target}`
      : 'Initial state: searching for direct low pulse to target';
    this.pushDraft(sim, 0, null, [], caption);
  }

  onFeederHit(
    sim: CircuitSimulator,
    event: PulseEvent,
    hit: FeederHitRecord,
    tracker: FeederCycleTracker,
  ): void {
    const detail = hit.kind === 'first' ? '1st high' : `period ${hit.period}`;
    const caption = `Press ${hit.press}: ${hit.input} -> ${tracker.feeder} HIGH (${detail}) [${tracker.formatPeriods()}]`;
    this.pushDraft(sim, event.press, Object.freeze({ ...event }), [event.from, event.to], caption);
  }

  onDirectHit(sim: CircuitSimulator, event: PulseEvent): void {
    const caption = `Press ${event.press}: ${event.from} -low-> ${event.to} (target reached)`;
    this.pushDraft(sim, event.press, Object.freeze({ ...event }), [event.from, event.to], caption);
  }

  onCyclesComplete(sim: CircuitSimulator, tracker: FeederCycleTracker, lcm: bigint): void {
    const nodes = [tracker.feeder, ...tracker.inputs, tracker.target];
    const caption = `Feeder cycles verified (${tracker.formatPeriods()}) -> LCM = ${lcm}`;
    this.pushDraft(sim, sim.pressCount, null, nodes, caption);
  }

  finalize(maxSteps: number): readonly PulseTraceFrame[] {
    const totalRawSteps = this.drafts.length;
    const sampled = sampleTraceIndices(totalRawSteps, maxSteps);
    const frames: PulseTraceFrame[] = [];
    for (const idx of sampled) {
      const draft = this.drafts[idx]!;
      frames.push(Object.freeze({ ...draft, stepIndex: idx, totalRawSteps }));
    }
    return Object.freeze(frames);
  }
}
