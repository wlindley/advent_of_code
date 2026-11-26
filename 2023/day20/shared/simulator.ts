import type { CircuitBlueprint } from './blueprint';
import type { CircuitNode } from './nodes';
import {
  BROADCASTER_NAME,
  BUTTON_NAME,
  DEFAULT_MAX_PULSES_PER_PRESS,
  type NodeStateSnapshot,
  type PressSummary,
  type PulseEvent,
  validatePositiveInt,
} from './types';

export type PulseListener = (event: PulseEvent) => void;

/** Stateful FIFO pulse-propagation simulator for a validated CircuitBlueprint. */
export class CircuitSimulator {
  private readonly nodes: Map<string, CircuitNode>;
  private readonly maxPulsesPerPress: number;
  private presses = 0;
  private lowCount = 0;
  private highCount = 0;

  constructor(blueprint: CircuitBlueprint, maxPulsesPerPress = DEFAULT_MAX_PULSES_PER_PRESS) {
    this.maxPulsesPerPress = validatePositiveInt(maxPulsesPerPress, 'maxPulsesPerPress');
    this.nodes = blueprint.instantiateNodes();
  }

  get pressCount(): number {
    return this.presses;
  }

  get totalLow(): number {
    return this.lowCount;
  }

  get totalHigh(): number {
    return this.highCount;
  }

  get totalPulses(): number {
    return this.lowCount + this.highCount;
  }

  get product(): bigint {
    return BigInt(this.lowCount) * BigInt(this.highCount);
  }

  snapshotModules(): Readonly<Record<string, NodeStateSnapshot>> {
    const snapshots: Record<string, NodeStateSnapshot> = {};
    for (const [name, node] of this.nodes) {
      snapshots[name] = node.snapshotState();
    }
    return Object.freeze(snapshots);
  }

  pressButton(onPulse?: PulseListener): PressSummary {
    const press = (this.presses += 1);
    const queue: PulseEvent[] = [{ press, from: BUTTON_NAME, to: BROADCASTER_NAME, pulse: 'low' }];
    let lowPulses = 0;
    let highPulses = 0;

    for (let head = 0; head < queue.length; head += 1) {
      const event = queue[head]!;
      const pulsesThisPress = lowPulses + highPulses + 1;
      if (pulsesThisPress > this.maxPulsesPerPress) {
        throw new Error(`Pulse limit (${this.maxPulsesPerPress}) exceeded on press ${press}`);
      }
      if (event.pulse === 'low') {
        lowPulses += 1;
        this.lowCount += 1;
      } else {
        highPulses += 1;
        this.highCount += 1;
      }
      const target = this.nodes.get(event.to)!;
      const emitted = target.receive(event.from, event.pulse);
      if (onPulse !== undefined) onPulse(event);
      if (emitted !== null) {
        for (const dest of target.destinations) {
          queue.push({ press, from: event.to, to: dest, pulse: emitted });
        }
      }
    }

    return Object.freeze({ press, lowPulses, highPulses });
  }

  runPresses(count: number, onPulse?: PulseListener): readonly PressSummary[] {
    const validated = validatePositiveInt(count, 'count');
    const summaries: PressSummary[] = [];
    for (let i = 0; i < validated; i += 1) {
      summaries.push(this.pressButton(onPulse));
    }
    return Object.freeze(summaries);
  }
}
