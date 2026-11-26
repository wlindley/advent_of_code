import { describe, expect, it } from 'vitest';
import {
  BroadcasterNode,
  ConjunctionNode,
  createCircuitNode,
  FlipFlopNode,
  NODE_FACTORIES,
  SinkNode,
} from './nodes';
import type { ModuleDescriptor } from './types';

describe('day20 polymorphic CircuitNode implementations', () => {
  it('BroadcasterNode echoes low and high pulses and snapshots kind', () => {
    const node = new BroadcasterNode('broadcaster', ['a', 'b']);
    expect(node.kind).toBe('broadcaster');
    expect(node.destinations).toEqual(['a', 'b']);
    expect(node.receive('button', 'low')).toBe('low');
    expect(node.receive('a', 'high')).toBe('high');
    expect(node.snapshotState()).toEqual({ kind: 'broadcaster' });
  });

  it('FlipFlopNode ignores high pulses and toggles state on low pulses', () => {
    const node = new FlipFlopNode('a', ['b']);
    expect(node.isOn).toBe(false);
    expect(node.receive('broadcaster', 'high')).toBeNull();
    expect(node.isOn).toBe(false);

    expect(node.receive('broadcaster', 'low')).toBe('high');
    expect(node.isOn).toBe(true);
    expect(node.snapshotState()).toEqual({ kind: 'flip-flop', isOn: true });

    expect(node.receive('broadcaster', 'high')).toBeNull();
    expect(node.isOn).toBe(true);

    expect(node.receive('broadcaster', 'low')).toBe('low');
    expect(node.isOn).toBe(false);
    expect(node.snapshotState()).toEqual({ kind: 'flip-flop', isOn: false });
  });

  it('ConjunctionNode remembers input pulses and emits low only when all inputs are high', () => {
    const node = new ConjunctionNode('con', ['output'], ['a', 'b']);
    expect(node.inputCount).toBe(2);
    expect(node.highCount).toBe(0);
    expect(node.snapshotState()).toEqual({ kind: 'conjunction', memory: { a: 'low', b: 'low' } });

    expect(node.receive('a', 'high')).toBe('high');
    expect(node.highCount).toBe(1);
    expect(node.receive('b', 'high')).toBe('low');
    expect(node.highCount).toBe(2);
    expect(node.receive('a', 'low')).toBe('high');
    expect(node.highCount).toBe(1);
    expect(node.snapshotState()).toEqual({ kind: 'conjunction', memory: { a: 'low', b: 'high' } });

    expect(() => node.receive('unknown', 'low')).toThrow();
  });

  it('SinkNode absorbs pulses without emitting and exposes empty destinations', () => {
    const node = new SinkNode('rx');
    expect(node.destinations).toEqual([]);
    expect(node.receive('con', 'low')).toBeNull();
    expect(node.receive('con', 'high')).toBeNull();
    expect(node.snapshotState()).toEqual({ kind: 'sink' });
  });

  it('createCircuitNode dispatches via NODE_FACTORIES for every ModuleKind', () => {
    const specs: readonly ModuleDescriptor[] = [
      { name: 'broadcaster', kind: 'broadcaster', destinations: ['a'] },
      { name: 'a', kind: 'flip-flop', destinations: ['con'] },
      { name: 'con', kind: 'conjunction', destinations: ['rx'] },
      { name: 'rx', kind: 'sink', destinations: [] },
    ];
    expect(Object.keys(NODE_FACTORIES).sort()).toEqual(['broadcaster', 'conjunction', 'flip-flop', 'sink']);

    const nodes = specs.map((spec) => createCircuitNode(spec, spec.kind === 'conjunction' ? ['a'] : []));
    expect(nodes.map((n) => n.kind)).toEqual(['broadcaster', 'flip-flop', 'conjunction', 'sink']);
    expect(nodes[0]).toBeInstanceOf(BroadcasterNode);
    expect(nodes[1]).toBeInstanceOf(FlipFlopNode);
    expect(nodes[2]).toBeInstanceOf(ConjunctionNode);
    expect(nodes[3]).toBeInstanceOf(SinkNode);
  });
});
