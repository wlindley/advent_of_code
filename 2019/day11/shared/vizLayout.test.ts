import { describe, expect, it } from 'vitest';
import { panelKey, type Heading, type HullTraceFrame, type PaintedPanel } from './robotModels';
import { buildHullSvgLayout, formatHeadingLabel, formatRobotPolygon } from './vizLayout';

describe('vizLayout', () => {
  it('formats heading labels and distinct robot arrow polygons for all 4 headings', () => {
    const headings: readonly Heading[] = [0, 1, 2, 3];
    expect(headings.map(formatHeadingLabel)).toEqual(['UP', 'RIGHT', 'DOWN', 'LEFT']);
    const polygons = headings.map((h) => formatRobotPolygon(0, 0, h));
    expect(new Set(polygons).size).toBe(4);
  });

  it('batches panels into 4 path layers, includes unpainted Part 2 (0,0) white, and caps trail to 32', () => {
    const panels = new Map<string, PaintedPanel>([
      [panelKey(1, 0), { x: 1, y: 0, color: 0, paintCount: 1 }],
      [panelKey(2, 0), { x: 2, y: 0, color: 0, paintCount: 2 }],
      [panelKey(3, 0), { x: 3, y: 0, color: 1, paintCount: 1 }],
      [panelKey(4, 0), { x: 4, y: 0, color: 1, paintCount: 3 }],
    ]);
    const longTrail = Array.from({ length: 40 }, (_, i) => ({ x: i, y: 0 }));
    const frame: HullTraceFrame = {
      stepIndex: 5,
      totalSteps: 10,
      robotX: 4,
      robotY: 0,
      heading: 1,
      lastPaintColor: 1,
      lastTurn: 0,
      startPanelColor: 1,
      panels,
      trail: longTrail,
    };

    const layout = buildHullSvgLayout(frame);
    expect(layout.blackOncePath).not.toBe('');
    expect(layout.blackMultiPath).not.toBe('');
    expect(layout.whiteOncePath.split('M').length - 1).toBe(2); // (3,0) + unpainted (0,0)
    expect(layout.whiteMultiPath).not.toBe('');
    expect(layout.trailPoints.split(' ')).toHaveLength(32);
    expect(layout.paintedCount).toBe(4);
    expect(layout.whiteCount).toBe(3); // (3,0), (4,0), and unpainted (0,0)
    expect(layout.multiPaintedCount).toBe(2);
    expect(layout.headingLabel).toBe('RIGHT');
    expect(layout.actionSummary).toBe('Painted white, turned left');
    expect(layout.bounds.minX).toBe(0);
    expect(layout.bounds.maxX).toBe(4);
  });

  it('handles initial step (null last action) and painted origin on Part 2 without duplicating white (0,0)', () => {
    const panels = new Map<string, PaintedPanel>([
      [panelKey(0, 0), { x: 0, y: 0, color: 0, paintCount: 1 }],
    ]);
    const initialFrame: HullTraceFrame = {
      stepIndex: 0,
      totalSteps: 0,
      robotX: 0,
      robotY: 0,
      heading: 0,
      lastPaintColor: null,
      lastTurn: null,
      startPanelColor: 0,
      panels: new Map(),
      trail: [{ x: 0, y: 0 }],
    };
    const initLayout = buildHullSvgLayout(initialFrame);
    expect(initLayout.actionSummary).toBe('Initial state (facing UP)');
    expect(initLayout.whiteOncePath).toBe('');
    expect(initLayout.whiteCount).toBe(0);

    const paintedOriginLayout = buildHullSvgLayout({
      ...initialFrame,
      stepIndex: 1,
      totalSteps: 1,
      lastPaintColor: 0,
      lastTurn: 1,
      startPanelColor: 1,
      panels,
    });
    expect(paintedOriginLayout.actionSummary).toBe('Painted black, turned right');
    expect(paintedOriginLayout.whiteOncePath).toBe('');
    expect(paintedOriginLayout.whiteCount).toBe(0);
  });
});
