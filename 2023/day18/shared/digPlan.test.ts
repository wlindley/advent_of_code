import { describe, expect, it } from 'vitest';
import {
  DIRECT_DIG_PLAN_DECODER,
  DIRECTION_DELTAS,
  DigStep,
  parseDigPlan,
  RawDigEntry,
} from './digPlan';

describe('digPlan', () => {
  it('defines unit deltas for U, D, L, R', () => {
    expect(DIRECTION_DELTAS).toEqual({
      U: { dx: 0n, dy: -1n },
      D: { dx: 0n, dy: 1n },
      L: { dx: -1n, dy: 0n },
      R: { dx: 1n, dy: 0n },
    });
    expect(Object.isFrozen(DIRECTION_DELTAS)).toBe(true);
  });

  it('constructs frozen RawDigEntry with normalized lowercase hexCode and dynamic color', () => {
    const entry = new RawDigEntry('R', 6n, '70C710');
    expect(entry.direction).toBe('R');
    expect(entry.distance).toBe(6n);
    expect(entry.hexCode).toBe('70c710');
    expect(entry.color).toBe('#70c710');
    expect(Object.isFrozen(entry)).toBe(true);
  });

  it('rejects non-positive distance and invalid hexCode in RawDigEntry', () => {
    expect(() => new RawDigEntry('U', 0n, '123456')).toThrow(RangeError);
    expect(() => new RawDigEntry('D', -2n, '123456')).toThrow(RangeError);
    expect(() => new RawDigEntry('L', 1n, '12345')).toThrow();
    expect(() => new RawDigEntry('L', 1n, 'zzzzzz')).toThrow();
  });

  it('constructs frozen DigStep and validates distance and #rrggbb color', () => {
    const step = new DigStep('D', 5n, '#0dc571');
    expect(step.direction).toBe('D');
    expect(step.distance).toBe(5n);
    expect(step.color).toBe('#0dc571');
    expect(Object.isFrozen(step)).toBe(true);

    expect(() => new DigStep('U', 0n, '#0dc571')).toThrow(RangeError);
    expect(() => new DigStep('U', 2n, '0dc571')).toThrow();
    expect(() => new DigStep('U', 2n, '#0DC571')).toThrow();
  });

  it('decodes RawDigEntry directly with DIRECT_DIG_PLAN_DECODER', () => {
    const entry = new RawDigEntry('L', 3n, 'ABCDEF');
    const step = DIRECT_DIG_PLAN_DECODER.decodeStep(entry);
    expect(step).toEqual(new DigStep('L', 3n, '#abcdef'));
  });

  it('parses valid CRLF dig plans and preserves line order', () => {
    const entries = parseDigPlan('R 6 (#70c710)\r\nD 5 (#0DC571)\r\n');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual(new RawDigEntry('R', 6n, '70c710'));
    expect(entries[1]).toEqual(new RawDigEntry('D', 5n, '0dc571'));
    expect(Object.isFrozen(entries)).toBe(true);
  });

  it('rejects empty inputs and malformed lines with 1-based line numbers', () => {
    expect(() => parseDigPlan('   \r\n  ')).toThrow(/empty/i);
    expect(() => parseDigPlan('R 6 (#70c710)\nbad line')).toThrow(/line 2/);
    expect(() => parseDigPlan('X 6 (#70c710)')).toThrow(/line 1/);
  });
});
