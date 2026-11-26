import { describe, expect, it } from 'vitest';
import { HeatMap, parseHeatMap } from './heatMap';

describe('HeatMap', () => {
  it('parses CRLF/CR/LF inputs with outer whitespace and exposes dynamic properties', () => {
    const map = parseHeatMap('\r\n 123\r\n456\r789\n\n ');
    expect(map.height).toBe(3);
    expect(map.width).toBe(3);
    expect(map.size).toBe(9);
    expect(map.goalCell).toBe(8);
    expect(Object.isFrozen(map)).toBe(true);
    expect(map.heatAt(0, 0)).toBe(1);
    expect(map.heatAt(1, 2)).toBe(6);
    expect(map.heatAt(2, 1)).toBe(8);
  });

  it('returns an independent copy from copyHeat', () => {
    const map = HeatMap.fromLines(['19', '28']);
    const copy = map.copyHeat();
    expect(Array.from(copy)).toEqual([1, 9, 2, 8]);
    copy[0] = 9;
    expect(map.heatAt(0, 0)).toBe(1);
  });

  it('checks bounds accurately in inBounds and heatAt', () => {
    const map = HeatMap.fromLines(['12', '34']);
    expect(map.inBounds(0, 0)).toBe(true);
    expect(map.inBounds(1, 1)).toBe(true);
    expect(map.inBounds(-1, 0)).toBe(false);
    expect(map.inBounds(2, 0)).toBe(false);
    expect(map.inBounds(0, -1)).toBe(false);
    expect(map.inBounds(0, 2)).toBe(false);
    expect(map.inBounds(0.5, 0)).toBe(false);
    expect(map.inBounds(0, 1.5)).toBe(false);
    expect(() => map.heatAt(-1, 0)).toThrow(RangeError);
    expect(() => map.heatAt(0, 2)).toThrow(RangeError);
  });

  it('rejects empty inputs, empty rows, jagged rows, and invalid characters including 0', () => {
    expect(() => parseHeatMap('   \r\n  ')).toThrow('empty');
    expect(() => HeatMap.fromLines([])).toThrow('empty');
    expect(() => HeatMap.fromLines([''])).toThrow('empty');
    expect(() => HeatMap.fromLines(['12', '123'])).toThrow('width');
    expect(() => HeatMap.fromLines(['10', '23'])).toThrow('digit');
    expect(() => HeatMap.fromLines(['1a', '23'])).toThrow('digit');
  });
});
