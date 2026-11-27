import { describe, expect, it } from 'vitest';
import { buildVaultKeyGraph, reconstructSegmentPath } from './keyGraph';
import { parseVaultMap } from './vaultMap';

describe('keyGraph', () => {
  it('computes edges with doorsMask and intermediateKeysMask recorded before target key', () => {
    const map = parseVaultMap('#b.A.@.a.c#');
    const graph = buildVaultKeyGraph(map);
    const atEdges = graph.adjacency[map.keys.length]!;
    const byTarget = new Map(atEdges.map((e) => [map.keys[e.toKeyId]!.letter, e]));

    expect(byTarget.get('a')).toEqual({
      toKeyId: 0,
      toKeyBit: 1 << 0,
      distance: 2,
      doorsMask: 0,
      intermediateKeysMask: 0,
    });
    expect(byTarget.get('c')).toEqual({
      toKeyId: 2,
      toKeyBit: 1 << 2,
      distance: 4,
      doorsMask: 0,
      intermediateKeysMask: 1 << 0,
    });
    expect(byTarget.get('b')).toEqual({
      toKeyId: 1,
      toKeyBit: 1 << 1,
      distance: 4,
      doorsMask: 1 << 0,
      intermediateKeysMask: 0,
    });

    const aEdges = graph.adjacency[0]!;
    expect(aEdges.some((e) => e.toKeyId === 0)).toBe(false);
  });

  it('keeps Pareto-minimal door variants in cyclic mazes and handles open borders', () => {
    const cyclic = parseVaultMap([
      '@.A.b',
      '.....',
      '..#..',
      '.....',
    ].join('\n'));
    const graph = buildVaultKeyGraph(cyclic);
    const atToB = graph.adjacency[1]!.filter((e) => e.toKeyId === 0);

    expect(atToB).toEqual([
      { toKeyId: 0, toKeyBit: 1 << 1, distance: 4, doorsMask: 1 << 0, intermediateKeysMask: 0 },
      { toKeyId: 0, toKeyBit: 1 << 1, distance: 6, doorsMask: 0, intermediateKeysMask: 0 },
    ]);
  });

  it('avoids uncollected intermediate keys and locked doors in reconstructSegmentPath', () => {
    const diamond = parseVaultMap([
      '.xa',
      '@..',
    ].join('\n'));
    const start = diamond.entrances[0]!;
    const keyA = diamond.keys[0]!;
    const keyX = diamond.keys[1]!;

    const pathNoX = reconstructSegmentPath(diamond, start, keyA.pos, 0);
    expect(pathNoX).toEqual([
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 0, col: 2 },
    ]);

    const pathWithX = reconstructSegmentPath(diamond, start, keyA.pos, keyX.bit);
    expect(pathWithX).toEqual([
      { row: 1, col: 0 },
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);

    const doorMap = parseVaultMap('#####\n#@Aa#\n#####');
    expect(() => reconstructSegmentPath(doorMap, doorMap.entrances[0]!, doorMap.keys[0]!.pos, 0)).toThrow(
      /No unlocked path/,
    );
    expect(
      reconstructSegmentPath(doorMap, doorMap.entrances[0]!, doorMap.keys[0]!.pos, doorMap.keys[0]!.bit),
    ).toEqual([
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
    ]);
  });
});
