import { describe, expect, it } from 'vitest';
import { parseReactorGraph } from './reactor';

const EXAMPLE = [
  'aaa: you hhh',
  'you: bbb ccc',
  'bbb: ddd eee',
  'ccc: ddd eee fff',
  'ddd: ggg',
  'eee: out',
  'fff: out',
  'ggg: out',
  'hhh: ccc fff iii',
  'iii: out',
].join('\n');

describe('parseReactorGraph', () => {
  it('parses the official 10-line example into 11 vertices and 17 edges', () => {
    const graph = parseReactorGraph(EXAMPLE);
    expect(graph.nodeCount).toBe(11);
    expect(graph.edgeCount).toBe(17);
    expect(graph.outNeighbors('you')).toEqual(['bbb', 'ccc']);
    expect(graph.outNeighbors('out')).toEqual([]);
  });

  it('ignores blank lines, handles CRLF, and allows explicit sink nodes', () => {
    const graph = parseReactorGraph('  \r\nyou: a_1  b-2\r\n\r\na_1:\r\nb-2: out\r\n');
    expect(graph.nodeCount).toBe(4);
    expect(graph.edgeCount).toBe(3);
    expect(graph.outNeighbors('a_1')).toEqual([]);
    expect(graph.outNeighbors('you')).toEqual(['a_1', 'b-2']);
  });

  it('rejects empty input', () => {
    expect(() => parseReactorGraph('')).toThrow(/empty/i);
    expect(() => parseReactorGraph('   \n\r\n  ')).toThrow(/empty/i);
  });

  it('rejects lines missing a colon', () => {
    expect(() => parseReactorGraph('you bbb ccc')).toThrow(/Invalid reactor line/);
  });

  it('rejects empty source labels', () => {
    expect(() => parseReactorGraph(': bbb')).toThrow(/Invalid reactor line/);
  });

  it('rejects whitespace inside source labels', () => {
    expect(() => parseReactorGraph('you two: bbb')).toThrow(/Invalid reactor line/);
  });

  it('rejects invalid target tokens on RHS', () => {
    expect(() => parseReactorGraph('you: bbb bad!token')).toThrow(/Invalid target token/);
  });

  it('rejects duplicate source definitions', () => {
    expect(() => parseReactorGraph('you: bbb\nyou: ccc')).toThrow(/Duplicate/);
  });
});
