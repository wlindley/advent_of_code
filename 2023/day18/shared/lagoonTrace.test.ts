import { describe, expect, it } from 'vitest';
import { DigStep } from './digPlan';
import { LagoonPolygon } from './lagoonPolygon';
import {
  buildLagoonTrace,
  DEFAULT_MAX_TRACE_STEPS,
  LagoonTraceFrame,
  projectPolygonToSvg,
} from './lagoonTrace';

function makeRectangle(w: bigint, h: bigint): LagoonPolygon {
  return LagoonPolygon.fromSteps([
    new DigStep('R', w, '#111111'),
    new DigStep('D', h, '#222222'),
    new DigStep('L', w, '#333333'),
    new DigStep('U', h, '#444444'),
  ]);
}

describe('lagoonTrace', () => {
  it('constructs frozen LagoonTraceFrame with dynamic cumulative metrics', () => {
    const poly = makeRectangle(4n, 3n);
    const frame2 = new LagoonTraceFrame(poly, 2, 0, 2);
    expect(Object.isFrozen(frame2)).toBe(true);
    expect(frame2.activeEdge).toBe(poly.edges[1]);
    expect(frame2.cumulativeBoundary).toBe(7n);
    expect(frame2.cumulativeSignedDoubleArea).toBe(12n);
    expect(frame2.isComplete).toBe(false);

    const frame4 = new LagoonTraceFrame(poly, 4, 1, 2);
    expect(frame4.isComplete).toBe(true);
    expect(frame4.cumulativeBoundary).toBe(14n);
    expect(frame4.cumulativeSignedDoubleArea).toBe(24n);
  });

  it('rejects out-of-range LagoonTraceFrame indices', () => {
    const poly = makeRectangle(2n, 2n);
    expect(() => new LagoonTraceFrame(poly, 1, 0, 0)).toThrow(RangeError);
    expect(() => new LagoonTraceFrame(poly, 1, -1, 2)).toThrow(RangeError);
    expect(() => new LagoonTraceFrame(poly, 1, 2, 2)).toThrow(RangeError);
    expect(() => new LagoonTraceFrame(poly, 0, 0, 2)).toThrow(RangeError);
    expect(() => new LagoonTraceFrame(poly, 5, 0, 2)).toThrow(RangeError);
  });

  it('builds sampled trace frames bounded by maxSteps and preserving endpoints', () => {
    const steps: DigStep[] = [];
    for (let i = 0; i < 4; i += 1) steps.push(new DigStep('R', 1n, '#111111'));
    for (let i = 0; i < 4; i += 1) steps.push(new DigStep('D', 1n, '#222222'));
    for (let i = 0; i < 4; i += 1) steps.push(new DigStep('L', 1n, '#333333'));
    for (let i = 0; i < 4; i += 1) steps.push(new DigStep('U', 1n, '#444444'));
    const poly = LagoonPolygon.fromSteps(steps);

    const full = buildLagoonTrace(poly);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(full).toHaveLength(16);
    expect(full[0]!.completedEdges).toBe(1);
    expect(full[15]!.completedEdges).toBe(16);
    expect(full[15]!.isComplete).toBe(true);

    const sampled = buildLagoonTrace(poly, { maxSteps: 5 });
    expect(sampled).toHaveLength(5);
    expect(sampled[0]!.completedEdges).toBe(1);
    expect(sampled[0]!.frameIndex).toBe(0);
    expect(sampled[0]!.totalFrames).toBe(5);
    expect(sampled[4]!.completedEdges).toBe(16);
    expect(sampled[4]!.isComplete).toBe(true);
  });

  it('projects width-limited and height-limited BigInt polygons into SVG viewports', () => {
    const wide = makeRectangle(20_000_000n, 5_000_000n);
    const wideProj = projectPolygonToSvg(wide, { width: 440, height: 240, padding: 20 });
    expect(Object.isFrozen(wideProj)).toBe(true);
    expect(wideProj.vertices).toHaveLength(4);
    expect(wideProj.origin).toEqual(wideProj.vertices[0]);
    expect(wideProj.vertices[0]!.x).toBeCloseTo(20, 4);
    expect(wideProj.vertices[1]!.x).toBeCloseTo(420, 4);

    const tall = makeRectangle(2n, 10n);
    const tallProj = projectPolygonToSvg(tall, { width: 440, height: 240, padding: 20 });
    expect(tallProj.vertices[0]!.y).toBeCloseTo(20, 4);
    expect(tallProj.vertices[2]!.y).toBeCloseTo(220, 4);
  });

  it('validates SVG viewport dimensions and padding', () => {
    const poly = makeRectangle(2n, 2n);
    expect(() => projectPolygonToSvg(poly, { width: 0, height: 100, padding: 10 })).toThrow(RangeError);
    expect(() => projectPolygonToSvg(poly, { width: 100, height: Number.NaN, padding: 10 })).toThrow(RangeError);
    expect(() => projectPolygonToSvg(poly, { width: 100, height: 100, padding: -1 })).toThrow(RangeError);
    expect(() => projectPolygonToSvg(poly, { width: 100, height: 100, padding: 50 })).toThrow(RangeError);
    expect(() => projectPolygonToSvg(poly, { width: 200, height: 100, padding: 50 })).toThrow(RangeError);
  });
});
