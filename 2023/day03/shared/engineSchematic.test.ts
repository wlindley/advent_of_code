import { describe, expect, it } from 'vitest';
import { EngineSchematic } from './engineSchematic';
import { SchematicSymbol } from './schematicSymbol';

describe('EngineSchematic', () => {
  it('parses numbers, symbols, and grid dimensions as frozen structures', () => {
    const schematic = EngineSchematic.parse('467..114\n...*....\n');
    expect(schematic.rows).toBe(2);
    expect(schematic.cols).toBe(8);
    expect(schematic.numbers).toHaveLength(2);
    expect(schematic.numbers[0]!.value).toBe(467);
    expect(schematic.numbers[1]!.endCol).toBe(7);
    expect(schematic.symbols).toHaveLength(1);
    expect(schematic.symbols[0]!.char).toBe('*');
    expect(Object.isFrozen(schematic)).toBe(true);
    expect(Object.isFrozen(schematic.numbers)).toBe(true);
    expect(Object.isFrozen(schematic.symbols)).toBe(true);
  });

  it('treats minus signs as symbols and parses unsigned digits only', () => {
    const schematic = EngineSchematic.parse('-42..\n12-34');
    expect(schematic.numbers.map((n) => [n.value, n.startCol, n.endCol])).toEqual([
      [42, 1, 2],
      [12, 0, 1],
      [34, 3, 4],
    ]);
    expect(schematic.symbols.map((s) => [s.char, s.row, s.col])).toEqual([
      ['-', 0, 0],
      ['-', 1, 2],
    ]);
  });

  it('rejects empty, jagged, whitespace-containing, or unsafe-integer inputs', () => {
    expect(() => EngineSchematic.parse('')).toThrow(Error);
    expect(() => EngineSchematic.parse('123\n45')).toThrow(Error);
    expect(() => EngineSchematic.parse('12 3')).toThrow(SyntaxError);
    expect(() => EngineSchematic.parse('12\t3')).toThrow(SyntaxError);
    expect(() => EngineSchematic.parse('9007199254740992.')).toThrow(RangeError);
  });

  it('deduplicates multi-digit numbers touching a symbol across multiple cells', () => {
    const schematic = EngineSchematic.parse('467.\n.*..');
    const adj = schematic.adjacentNumbersOf(schematic.symbols[0]!);
    expect(adj).toHaveLength(1);
    expect(adj[0]!.value).toBe(467);
    expect(Object.isFrozen(adj)).toBe(true);
  });

  it('distinguishes equal numeric values at different positions and handles corners', () => {
    const schematic = EngineSchematic.parse('*7.\n7..\n..#');
    const star = schematic.symbols[0]!;
    const hash = schematic.symbols[1]!;
    expect(schematic.adjacentNumbersOf(star).map((p) => `${p.id}:${p.value}`)).toEqual(['0:7', '1:7']);
    expect(schematic.adjacentNumbersOf(hash)).toEqual([]);
  });

  it('rejects symbols outside the schematic bounds with RangeError', () => {
    const schematic = EngineSchematic.parse('12\n.*');
    expect(() => schematic.adjacentNumbersOf(new SchematicSymbol(9, 2, 0, '*'))).toThrow(RangeError);
    expect(() => schematic.adjacentNumbersOf(new SchematicSymbol(9, 0, 2, '*'))).toThrow(RangeError);
  });
});
