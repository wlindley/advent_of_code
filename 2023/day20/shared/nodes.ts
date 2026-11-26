import type { ModuleDescriptor, ModuleKind, NodeStateSnapshot, Pulse } from './types';

export interface CircuitNode {
  readonly kind: ModuleKind;
  readonly name: string;
  readonly destinations: readonly string[];
  receive(from: string, pulse: Pulse): Pulse | null;
  snapshotState(): NodeStateSnapshot;
}

/** Relays any incoming pulse verbatim to every configured destination. */
export class BroadcasterNode implements CircuitNode {
  readonly kind = 'broadcaster' as const;

  constructor(
    readonly name: string,
    readonly destinations: readonly string[],
  ) {}

  receive(_from: string, pulse: Pulse): Pulse {
    return pulse;
  }

  snapshotState(): NodeStateSnapshot {
    return Object.freeze({ kind: 'broadcaster' });
  }
}

/** Toggles on low pulses (initially OFF) and ignores high pulses. */
export class FlipFlopNode implements CircuitNode {
  readonly kind = 'flip-flop' as const;
  private on = false;

  constructor(
    readonly name: string,
    readonly destinations: readonly string[],
  ) {}

  get isOn(): boolean {
    return this.on;
  }

  receive(_from: string, pulse: Pulse): Pulse | null {
    if (pulse === 'high') return null;
    this.on = !this.on;
    return this.on ? 'high' : 'low';
  }

  snapshotState(): NodeStateSnapshot {
    return Object.freeze({ kind: 'flip-flop', isOn: this.on });
  }
}

/** Remembers the most recent pulse per input and emits low iff all are high. */
export class ConjunctionNode implements CircuitNode {
  readonly kind = 'conjunction' as const;
  private readonly memory: Map<string, Pulse>;

  constructor(
    readonly name: string,
    readonly destinations: readonly string[],
    inputs: readonly string[],
  ) {
    this.memory = new Map(inputs.map((input) => [input, 'low']));
  }

  get inputCount(): number {
    return this.memory.size;
  }

  get highCount(): number {
    let count = 0;
    for (const pulse of this.memory.values()) {
      if (pulse === 'high') count += 1;
    }
    return count;
  }

  receive(from: string, pulse: Pulse): Pulse {
    if (!this.memory.has(from)) {
      throw new Error(`Unknown input "${from}" for conjunction "${this.name}"`);
    }
    this.memory.set(from, pulse);
    return this.highCount === this.memory.size ? 'low' : 'high';
  }

  snapshotState(): NodeStateSnapshot {
    const memory = Object.freeze(Object.fromEntries(this.memory));
    return Object.freeze({ kind: 'conjunction', memory });
  }
}

/** Untyped sink module that absorbs incoming pulses without emitting. */
export class SinkNode implements CircuitNode {
  readonly kind = 'sink' as const;
  readonly destinations: readonly string[] = Object.freeze([]);

  constructor(readonly name: string) {}

  receive(_from: string, _pulse: Pulse): null {
    return null;
  }

  snapshotState(): NodeStateSnapshot {
    return Object.freeze({ kind: 'sink' });
  }
}

export type NodeFactory = (spec: ModuleDescriptor, inputs: readonly string[]) => CircuitNode;

export const NODE_FACTORIES: Readonly<Record<ModuleKind, NodeFactory>> = Object.freeze({
  broadcaster: (spec) => new BroadcasterNode(spec.name, spec.destinations),
  'flip-flop': (spec) => new FlipFlopNode(spec.name, spec.destinations),
  conjunction: (spec, inputs) => new ConjunctionNode(spec.name, spec.destinations, inputs),
  sink: (spec) => new SinkNode(spec.name),
});

/** Polymorphically instantiates a runtime CircuitNode from its descriptor and input list. */
export function createCircuitNode(spec: ModuleDescriptor, inputs: readonly string[]): CircuitNode {
  return NODE_FACTORIES[spec.kind](spec, inputs);
}
