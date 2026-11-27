import { describe, expect, it } from 'vitest';
import { CaveSystem } from './cave';
import { contractCaveSystem } from './contract';
import { parseCaveSystem } from './parser';

describe('contractCaveSystem', () => {
  it('contracts direct start-end and big-cave-bridged start-end weights', () => {
    const system = new CaveSystem([
      { a: 'start', b: 'end' },
      { a: 'start', b: 'A' },
      { a: 'A', b: 'end' },
    ]);

    const contracted = contractCaveSystem(system);
    expect(contracted.smallCaves).toEqual([]);
    expect(contracted.startToEndWeight).toBe(2n);
    expect(contracted.startTransitions).toEqual([]);
    expect(contracted.endWeights).toEqual([]);
    expect(contracted.smallTransitions).toEqual([]);
    expect(Object.isFrozen(contracted)).toBe(true);
  });

  it('produces self-loop transitions on small caves via degree-1 big caves', () => {
    const system = parseCaveSystem('start-b\nb-A\nb-end');
    const contracted = contractCaveSystem(system);

    expect(contracted.smallCaves).toEqual(['b']);
    expect(contracted.startToEndWeight).toBe(0n);
    expect(contracted.startTransitions).toEqual([{ target: 0, weight: 1n }]);
    expect(contracted.endWeights).toEqual([1n]);
    expect(contracted.smallTransitions).toEqual([[{ target: 0, weight: 1n }]]);
  });

  it('aggregates direct and multi-big-cave transition weights between small caves', () => {
    const system = parseCaveSystem('start-a\na-A\na-B\nA-c\nB-c\na-c\nc-end');
    const contracted = contractCaveSystem(system);

    expect(contracted.smallCaves).toEqual(['a', 'c']);
    expect(contracted.startTransitions).toEqual([{ target: 0, weight: 1n }]);
    expect(contracted.endWeights).toEqual([0n, 1n]);
    expect(contracted.smallTransitions[0]).toEqual([
      { target: 0, weight: 2n },
      { target: 1, weight: 3n },
    ]);
    expect(contracted.smallTransitions[1]).toEqual([
      { target: 0, weight: 3n },
      { target: 1, weight: 2n },
    ]);
  });

  it('ignores big-cave self-pairs involving start->start or end->end', () => {
    const system = parseCaveSystem('start-A\nstart-end\nB-end');
    const contracted = contractCaveSystem(system);

    expect(contracted.smallCaves).toEqual([]);
    expect(contracted.startToEndWeight).toBe(1n);
  });

  it('contracts the first AoC example accurately', () => {
    const system = parseCaveSystem('start-A\nstart-b\nA-c\nA-b\nb-d\nA-end\nb-end');
    const contracted = contractCaveSystem(system);

    expect(contracted.smallCaves).toEqual(['b', 'c', 'd']);
    expect(contracted.startToEndWeight).toBe(1n);
    expect(contracted.startTransitions).toEqual([
      { target: 0, weight: 2n },
      { target: 1, weight: 1n },
    ]);
    expect(contracted.endWeights).toEqual([2n, 1n, 0n]);
    expect(contracted.smallTransitions[0]).toEqual([
      { target: 0, weight: 1n },
      { target: 1, weight: 1n },
      { target: 2, weight: 1n },
    ]);
  });
});
