import { describe, expect, it } from 'vitest';
import { MOVE_DELTAS, parseWarehouseSpec } from './parse';

describe('MOVE_DELTAS', () => {
  it('exposes deep-frozen row/col deltas for all four directions', () => {
    expect(Object.isFrozen(MOVE_DELTAS)).toBe(true);
    expect(MOVE_DELTAS['^']).toEqual([-1, 0]);
    expect(MOVE_DELTAS['v']).toEqual([1, 0]);
    expect(MOVE_DELTAS['<']).toEqual([0, -1]);
    expect(MOVE_DELTAS['>']).toEqual([0, 1]);
    expect(Object.isFrozen(MOVE_DELTAS['^'])).toBe(true);
  });
});

describe('parseWarehouseSpec', () => {
  it('parses a valid warehouse map and multiline moves with CRLF normalization', () => {
    const raw = [
      '#####',
      '#@O.#',
      '#####',
      ' \t ',
      '^v',
      '<>',
      '',
    ].join('\r\n');

    const spec = parseWarehouseSpec(`\n${raw}`);
    expect(Object.isFrozen(spec)).toBe(true);
    expect(Object.isFrozen(spec.rows)).toBe(true);
    expect(Object.isFrozen(spec.moves)).toBe(true);
    expect(spec.rows).toEqual(['#####', '#@O.#', '#####']);
    expect(spec.moves).toEqual(['^', 'v', '<', '>']);
  });

  it('rejects missing or extra blank-line sections', () => {
    expect(() => parseWarehouseSpec('')).toThrow(/two sections/i);
    expect(() => parseWarehouseSpec('###\n#@#\n###')).toThrow(/two sections/i);
    expect(() => parseWarehouseSpec('###\n#@#\n###\n\n^\n\nv')).toThrow(/two sections/i);
  });

  it('rejects non-rectangular rows and invalid map characters', () => {
    expect(() => parseWarehouseSpec('###\n#@\n###\n\n^')).toThrow(/rectangular/i);
    expect(() => parseWarehouseSpec('###\n#@X\n###\n\n^')).toThrow(/invalid map character/i);
  });

  it('requires exactly one robot on the map', () => {
    expect(() => parseWarehouseSpec('###\n#.#\n###\n\n^')).toThrow(/exactly one robot/i);
    expect(() => parseWarehouseSpec('###\n@@#\n###\n\n^')).toThrow(/exactly one robot/i);
  });

  it('rejects invalid move characters', () => {
    expect(() => parseWarehouseSpec('###\n#@#\n###\n\n^x')).toThrow(/invalid move/i);
    expect(() => parseWarehouseSpec('###\n#@#\n###\n\n^ >')).toThrow(/invalid move/i);
  });
});
