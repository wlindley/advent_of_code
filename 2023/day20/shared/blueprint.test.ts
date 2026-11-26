import { describe, expect, it } from 'vitest';
import { CircuitBlueprint, ModuleSpec } from './blueprint';

describe('day20 ModuleSpec and CircuitBlueprint', () => {
  it('freezes ModuleSpec and preserves destination order and duplicates', () => {
    const spec = new ModuleSpec('a', 'flip-flop', ['b', 'a', 'b']);
    expect(Object.isFrozen(spec)).toBe(true);
    expect(Object.isFrozen(spec.destinations)).toBe(true);
    expect(spec.destinations).toEqual(['b', 'a', 'b']);
  });

  it('rejects invalid ModuleSpec configurations', () => {
    expect(() => new ModuleSpec('a', 'broadcaster', ['b'])).toThrow();
    expect(() => new ModuleSpec('broadcaster', 'flip-flop', ['a'])).toThrow();
    expect(() => new ModuleSpec('rx', 'sink', ['a'])).toThrow();
    expect(() => new ModuleSpec('a', 'flip-flop', ['button'])).toThrow();
    expect(() => new ModuleSpec('1a', 'flip-flop', ['b'])).toThrow();
  });

  it('synthesizes implicit sink specs and deduplicates inputs preserving first-seen order', () => {
    const bp = new CircuitBlueprint([
      new ModuleSpec('broadcaster', 'broadcaster', ['a', 'b']),
      new ModuleSpec('a', 'flip-flop', ['con', 'con']),
      new ModuleSpec('b', 'flip-flop', ['con']),
      new ModuleSpec('con', 'conjunction', ['rx', 'output']),
    ]);

    expect(Object.isFrozen(bp)).toBe(true);
    expect(bp.moduleCount).toBe(6);
    expect(bp.nodeOrder).toEqual(['broadcaster', 'a', 'b', 'con', 'rx', 'output']);
    expect(bp.hasModule('rx')).toBe(true);
    expect(bp.hasModule('missing')).toBe(false);
    expect(bp.specOf('rx').kind).toBe('sink');
    expect(bp.inputsOf('con')).toEqual(['a', 'b']);
    expect(bp.outputsOf('a')).toEqual(['con', 'con']);
    expect(bp.moduleSpecs.map((s) => s.name)).toEqual(['broadcaster', 'a', 'b', 'con', 'rx', 'output']);

    const nodes = bp.instantiateNodes();
    expect(nodes.size).toBe(6);
    expect(nodes.get('con')?.snapshotState()).toEqual({
      kind: 'conjunction',
      memory: { a: 'low', b: 'low' },
    });
  });

  it('rejects duplicate module names, missing broadcaster, and unknown queries', () => {
    expect(
      () =>
        new CircuitBlueprint([
          new ModuleSpec('broadcaster', 'broadcaster', ['a']),
          new ModuleSpec('a', 'flip-flop', ['b']),
          new ModuleSpec('a', 'conjunction', ['b']),
        ]),
    ).toThrow();

    expect(() => new CircuitBlueprint([new ModuleSpec('a', 'flip-flop', ['b'])])).toThrow();

    const bp = new CircuitBlueprint([new ModuleSpec('broadcaster', 'broadcaster', ['rx'])]);
    expect(() => bp.specOf('unknown')).toThrow();
    expect(() => bp.inputsOf('unknown')).toThrow();
    expect(() => bp.outputsOf('unknown')).toThrow();
  });
});
