import { describe, expect, it } from 'vitest';
import { AdapterChain, MAX_JOLT_STEP, parseAdapterChain } from './chain';

describe('AdapterChain', () => {
  it('builds sorted chain with outlet 0 and device +3', () => {
    const chain = new AdapterChain([16, 10, 15, 5, 1, 11, 7, 19, 6, 12, 4]);
    expect(MAX_JOLT_STEP).toBe(3);
    expect(chain.outletJoltage).toBe(0);
    expect(chain.deviceJoltage).toBe(22);
    expect(chain.adapterCount).toBe(11);
    expect(chain.nodeCount).toBe(13);
    expect(chain.adapters).toEqual([1, 4, 5, 6, 7, 10, 11, 12, 15, 16, 19]);
    expect(chain.ratings).toEqual([0, 1, 4, 5, 6, 7, 10, 11, 12, 15, 16, 19, 22]);
    expect(Object.isFrozen(chain)).toBe(true);
    expect(Object.isFrozen(chain.ratings)).toBe(true);
    expect(Object.isFrozen(chain.adapters)).toBe(true);
  });

  it('provides bounds-checked joltageAt, nodeKind, stepDelta, and predecessorIndices', () => {
    const chain = new AdapterChain([1, 2, 4]);
    expect(chain.joltageAt(0)).toBe(0);
    expect(chain.joltageAt(4)).toBe(7);
    expect(chain.nodeKind(0)).toBe('outlet');
    expect(chain.nodeKind(1)).toBe('adapter');
    expect(chain.nodeKind(4)).toBe('device');
    expect(chain.stepDelta(1)).toBe(1);
    expect(chain.stepDelta(3)).toBe(2);
    expect(chain.stepDelta(4)).toBe(3);
    expect(chain.predecessorIndices(0)).toEqual([]);
    expect(chain.predecessorIndices(1)).toEqual([0]);
    expect(chain.predecessorIndices(2)).toEqual([0, 1]);
    expect(chain.predecessorIndices(3)).toEqual([1, 2]);
    expect(chain.predecessorIndices(4)).toEqual([3]);
    expect(Object.isFrozen(chain.predecessorIndices(2))).toBe(true);

    expect(() => chain.joltageAt(-1)).toThrow(RangeError);
    expect(() => chain.joltageAt(5)).toThrow(RangeError);
    expect(() => chain.joltageAt(1.5)).toThrow(RangeError);
    expect(() => chain.nodeKind(5)).toThrow(RangeError);
    expect(() => chain.stepDelta(0)).toThrow(RangeError);
    expect(() => chain.stepDelta(5)).toThrow(RangeError);
    expect(() => chain.predecessorIndices(-1)).toThrow(RangeError);
  });

  it('rejects empty, non-positive, non-safe-int, duplicate, and gap > 3 inputs', () => {
    expect(() => new AdapterChain([])).toThrow(RangeError);
    expect(() => new AdapterChain([0])).toThrow(RangeError);
    expect(() => new AdapterChain([-2])).toThrow(RangeError);
    expect(() => new AdapterChain([1.5])).toThrow(RangeError);
    expect(() => new AdapterChain([Number.MAX_SAFE_INTEGER + 1])).toThrow(RangeError);
    expect(() => new AdapterChain([1, 1, 2])).toThrow(/Duplicate/);
    expect(() => new AdapterChain([4])).toThrow(/gap 4/);
    expect(() => new AdapterChain([1, 5])).toThrow(/gap 4/);
  });
});

describe('parseAdapterChain', () => {
  it('parses newline/CRLF inputs ignoring blank lines and preserves numeric sort', () => {
    const chain = parseAdapterChain(' 10 \r\n\n2\r\n1\n5\n8\n');
    expect(chain.adapters).toEqual([1, 2, 5, 8, 10]);
    expect(chain.deviceJoltage).toBe(13);
  });

  it('rejects non-integer lines and empty text', () => {
    expect(() => parseAdapterChain('')).toThrow(RangeError);
    expect(() => parseAdapterChain('1\nabc\n2')).toThrow(SyntaxError);
    expect(() => parseAdapterChain('1\n2.5\n')).toThrow(SyntaxError);
  });
});
