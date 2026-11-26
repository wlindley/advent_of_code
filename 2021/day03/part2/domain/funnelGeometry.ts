import type { LifeSupportTraceFrame } from './lifeSupportTrace';

export const FUNNEL_VIEWBOX = Object.freeze({
  width: 640,
  height: 220,
  padLeft: 48,
  padRight: 20,
  padTop: 22,
  padBottom: 34,
});

export interface FunnelPoint {
  readonly frameIndex: number;
  readonly step: number;
  readonly column: number | null;
  readonly x: number;
  readonly oxygenCount: number;
  readonly oxygenY: number;
  readonly co2Count: number;
  readonly co2Y: number;
  readonly oxygenLocked: boolean;
  readonly co2Locked: boolean;
  readonly isActive: boolean;
}

export interface FunnelGeometry {
  readonly plotLeft: number;
  readonly plotRight: number;
  readonly plotTop: number;
  readonly plotBottom: number;
  readonly initialRowCount: number;
  readonly activeX: number;
  readonly oxygenPath: string;
  readonly co2Path: string;
  readonly points: readonly FunnelPoint[];
}

function validateFunnelInputs(
  frames: readonly LifeSupportTraceFrame[],
  activeIndex: number,
  initialRowCount: number,
): void {
  if (frames.length === 0) {
    throw new RangeError('Funnel chart requires at least one trace frame');
  }
  if (!Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= frames.length) {
    throw new RangeError(`activeIndex out of bounds: ${activeIndex}`);
  }
  if (!Number.isInteger(initialRowCount) || initialRowCount < 1) {
    throw new RangeError(`initialRowCount must be a positive integer, got ${initialRowCount}`);
  }
}

function projectCountY(count: number, initialRowCount: number, plotTop: number, plotBottom: number): number {
  const plotHeight = plotBottom - plotTop;
  return plotBottom - (count / initialRowCount) * plotHeight;
}

function buildFunnelPoint(
  frame: LifeSupportTraceFrame,
  frameIndex: number,
  totalFrames: number,
  activeIndex: number,
  initialRowCount: number,
): FunnelPoint {
  const plotLeft = FUNNEL_VIEWBOX.padLeft;
  const plotRight = FUNNEL_VIEWBOX.width - FUNNEL_VIEWBOX.padRight;
  const plotTop = FUNNEL_VIEWBOX.padTop;
  const plotBottom = FUNNEL_VIEWBOX.height - FUNNEL_VIEWBOX.padBottom;
  const x =
    totalFrames === 1
      ? (plotLeft + plotRight) / 2
      : plotLeft + (frameIndex / (totalFrames - 1)) * (plotRight - plotLeft);
  return Object.freeze({
    frameIndex,
    step: frame.step,
    column: frame.column,
    x,
    oxygenCount: frame.oxygen.candidateCount,
    oxygenY: projectCountY(frame.oxygen.candidateCount, initialRowCount, plotTop, plotBottom),
    co2Count: frame.co2.candidateCount,
    co2Y: projectCountY(frame.co2.candidateCount, initialRowCount, plotTop, plotBottom),
    oxygenLocked: frame.oxygen.status === 'locked',
    co2Locked: frame.co2.status === 'locked',
    isActive: frameIndex === activeIndex,
  });
}

function formatPolylinePoints(points: readonly FunnelPoint[], pickY: 'oxygenY' | 'co2Y'): string {
  const parts: string[] = [];
  for (const pt of points) {
    parts.push(`${pt.x.toFixed(1)},${pt[pickY].toFixed(1)}`);
  }
  return parts.join(' ');
}

/** Projects life-support trace frames into bounded SVG funnel coordinates and polylines. */
export function buildFunnelGeometry(
  frames: readonly LifeSupportTraceFrame[],
  activeIndex: number,
  initialRowCount: number,
): FunnelGeometry {
  validateFunnelInputs(frames, activeIndex, initialRowCount);
  const points: FunnelPoint[] = [];
  for (let i = 0; i < frames.length; i += 1) {
    points.push(buildFunnelPoint(frames[i]!, i, frames.length, activeIndex, initialRowCount));
  }
  const frozenPoints = Object.freeze(points);
  return Object.freeze({
    plotLeft: FUNNEL_VIEWBOX.padLeft,
    plotRight: FUNNEL_VIEWBOX.width - FUNNEL_VIEWBOX.padRight,
    plotTop: FUNNEL_VIEWBOX.padTop,
    plotBottom: FUNNEL_VIEWBOX.height - FUNNEL_VIEWBOX.padBottom,
    initialRowCount,
    activeX: frozenPoints[activeIndex]!.x,
    oxygenPath: formatPolylinePoints(frozenPoints, 'oxygenY'),
    co2Path: formatPolylinePoints(frozenPoints, 'co2Y'),
    points: frozenPoints,
  });
}
