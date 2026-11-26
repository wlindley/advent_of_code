import { describe, expect, it } from 'vitest';
import { DigStep } from './digPlan';
import { LagoonBounds, LagoonEdge, LagoonPolygon } from './lagoonPolygon';

describe('lagoonPolygon', () => {
  it('constructs frozen LagoonBounds with dynamic spans and rejects inverted bounds', () => {
    const bounds = new LagoonBounds(-2n, 5n, 1n, 9n);
    expect(bounds.spanX).toBe(7n);
    expect(bounds.spanY).toBe(8n);
    expect(Object.isFrozen(bounds)).toBe(true);

    expect(() => new LagoonBounds(3n, 2n, 0n, 5n)).toThrow(RangeError);
    expect(() => new LagoonBounds(0n, 5n, 4n, 1n)).toThrow(RangeError);
  });

  it('constructs frozen LagoonEdge with dynamic end and shoelaceTerm', () => {
    const edge = new LagoonEdge({ x: 6n, y: 0n }, 'D', 5n, '#0dc571');
    expect(edge.end).toEqual({ x: 6n, y: 5n });
    expect(edge.shoelaceTerm).toBe(30n);
    expect(Object.isFrozen(edge)).toBe(true);
    expect(Object.isFrozen(edge.start)).toBe(true);

    expect(() => new LagoonEdge({ x: 0n, y: 0n }, 'U', 0n, '#000000')).toThrow(RangeError);
  });

  it('builds clockwise 2x2 step square (3x3 cells) and computes exact Pick/Shoelace getters', () => {
    const steps = [
      new DigStep('R', 2n, '#111111'),
      new DigStep('D', 2n, '#222222'),
      new DigStep('L', 2n, '#333333'),
      new DigStep('U', 2n, '#444444'),
    ];
    const polygon = LagoonPolygon.fromSteps(steps);
    expect(Object.isFrozen(polygon)).toBe(true);
    expect(Object.isFrozen(polygon.edges)).toBe(true);
    expect(polygon.stepCount).toBe(4);
    expect(polygon.bounds).toEqual(new LagoonBounds(0n, 2n, 0n, 2n));
    expect(polygon.boundaryCount).toBe(8n);
    expect(polygon.signedDoubleArea).toBe(8n);
    expect(polygon.absDoubleArea).toBe(8n);
    expect(polygon.orientation).toBe('cw');
    expect(polygon.interiorCount).toBe(1n);
    expect(polygon.totalVolume).toBe(9n);
  });

  it('handles counter-clockwise orientation and negative coordinates', () => {
    const steps = [
      new DigStep('L', 1n, '#111111'),
      new DigStep('U', 1n, '#222222'),
      new DigStep('R', 1n, '#333333'),
      new DigStep('D', 1n, '#444444'),
    ];
    // L -> U -> R -> D is clockwise in screen coords (dx*dy); let's reverse to D -> R -> U -> L for CCW
    const ccwSteps = [
      new DigStep('D', 1n, '#111111'),
      new DigStep('R', 1n, '#222222'),
      new DigStep('U', 1n, '#333333'),
      new DigStep('L', 1n, '#444444'),
    ];
    const cw = LagoonPolygon.fromSteps(steps);
    expect(cw.bounds).toEqual(new LagoonBounds(-1n, 0n, -1n, 0n));
    expect(cw.totalVolume).toBe(4n);

    const ccw = LagoonPolygon.fromSteps(ccwSteps);
    expect(ccw.signedDoubleArea).toBe(-2n);
    expect(ccw.absDoubleArea).toBe(2n);
    expect(ccw.orientation).toBe('ccw');
    expect(ccw.interiorCount).toBe(0n);
    expect(ccw.totalVolume).toBe(4n);
  });

  it('rejects empty, unclosed, and zero-area step sequences', () => {
    expect(() => LagoonPolygon.fromSteps([])).toThrow(/empty/i);
    expect(() => LagoonPolygon.fromSteps([new DigStep('R', 2n, '#111111')])).toThrow(/closed/i);
    expect(() =>
      LagoonPolygon.fromSteps([
        new DigStep('R', 3n, '#111111'),
        new DigStep('L', 3n, '#222222'),
      ]),
    ).toThrow(/zero area/i);
  });
});
