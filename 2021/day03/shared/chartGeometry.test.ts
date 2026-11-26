import { describe, expect, it } from 'vitest';
import {
  CHART_VIEWBOX,
  MAX_VISIBLE_COLUMNS,
  buildColumnChartGeometry,
  formatBitPreview,
} from './chartGeometry';
import { BitTally } from './report';

function makeUniformTallies(count: number): readonly BitTally[] {
  const tallies: BitTally[] = [];
  for (let i = 0; i < count; i += 1) {
    const ones = (i % 5) + 1;
    const zeros = 6 - ones;
    tallies.push(new BitTally(ones, zeros));
  }
  return tallies;
}

describe('formatBitPreview', () => {
  it('returns original bitstring when within maxChars and truncates longer strings', () => {
    expect(formatBitPreview('10110', 10)).toBe('10110');
    expect(formatBitPreview('10110', 5)).toBe('10110');
    expect(formatBitPreview('1011001101', 7)).toBe('1011...');
    expect(formatBitPreview('1011001101', 4)).toBe('1...');
  });

  it('rejects invalid maxChars below 4 or non-integer', () => {
    expect(() => formatBitPreview('1010', 3)).toThrow(RangeError);
    expect(() => formatBitPreview('1010', 0)).toThrow(RangeError);
    expect(() => formatBitPreview('1010', 4.5)).toThrow(RangeError);
  });
});

describe('buildColumnChartGeometry', () => {
  it('builds stacked bar geometry with 50% tie midline for narrow reports', () => {
    expect(CHART_VIEWBOX).toEqual({
      width: 640,
      height: 220,
      padLeft: 44,
      padRight: 16,
      padTop: 22,
      padBottom: 38,
    });
    expect(MAX_VISIBLE_COLUMNS).toBe(64);

    const tallies = [
      new BitTally(9, 3),
      new BitTally(6, 6),
      new BitTally(2, 10),
    ];
    const geom = buildColumnChartGeometry(tallies, 1);

    expect(Object.isFrozen(geom)).toBe(true);
    expect(Object.isFrozen(geom.bars)).toBe(true);
    expect(geom.totalColumns).toBe(3);
    expect(geom.windowStart).toBe(0);
    expect(geom.windowEnd).toBe(3);
    expect(geom.plotLeft).toBe(44);
    expect(geom.plotRight).toBe(624);
    expect(geom.plotTop).toBe(22);
    expect(geom.plotBottom).toBe(182);
    expect(geom.midlineY).toBe(102);

    const [b0, b1, b2] = geom.bars;
    expect(b0?.gammaBit).toBe('1');
    expect(b0?.isActive).toBe(false);
    expect(b0!.onesHeight).toBeCloseTo(120, 6);
    expect(b0!.zerosHeight).toBeCloseTo(40, 6);

    expect(b1?.gammaBit).toBe('1');
    expect(b1?.isActive).toBe(true);
    expect(b1!.onesY).toBeCloseTo(geom.midlineY, 6);

    expect(b2?.gammaBit).toBe('0');
    expect(b2?.isActive).toBe(false);
    expect(b2!.onesHeight).toBeCloseTo(160 * (2 / 12), 6);
  });

  it('clamps sliding window of MAX_VISIBLE_COLUMNS across wide reports', () => {
    const tallies = makeUniformTallies(100);

    const atStart = buildColumnChartGeometry(tallies, 0);
    expect(atStart.windowStart).toBe(0);
    expect(atStart.windowEnd).toBe(64);
    expect(atStart.bars.length).toBe(64);
    expect(atStart.bars[0]?.isActive).toBe(true);

    const atMiddle = buildColumnChartGeometry(tallies, 50);
    expect(atMiddle.windowStart).toBe(18);
    expect(atMiddle.windowEnd).toBe(82);
    expect(atMiddle.bars[32]?.column).toBe(50);
    expect(atMiddle.bars[32]?.isActive).toBe(true);

    const atEnd = buildColumnChartGeometry(tallies, 99);
    expect(atEnd.windowStart).toBe(36);
    expect(atEnd.windowEnd).toBe(100);
    expect(atEnd.bars[63]?.column).toBe(99);
    expect(atEnd.bars[63]?.isActive).toBe(true);
  });

  it('rejects empty tallies and out-of-bounds or non-integer activeColumn', () => {
    const tallies = makeUniformTallies(3);
    expect(() => buildColumnChartGeometry([], 0)).toThrow(RangeError);
    expect(() => buildColumnChartGeometry(tallies, -1)).toThrow(RangeError);
    expect(() => buildColumnChartGeometry(tallies, 3)).toThrow(RangeError);
    expect(() => buildColumnChartGeometry(tallies, 1.5)).toThrow(RangeError);
  });
});
