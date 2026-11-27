import type { ScanTraceFrame, SquareTraceFrame, TractorBeamTraceFrame } from './beamSolver';

export const VIEWBOX_SIZE = 420;
const PADDING = 24;
const INNER_SIZE = VIEWBOX_SIZE - PADDING * 2;
const VIEWBOX_STR = `0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`;

/** Projected 2D coordinate inside the SVG viewBox. */
export interface SvgPoint {
  readonly x: number;
  readonly y: number;
}

/** Projected SVG rectangle bounds. */
export interface SvgRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** SVG geometry layout for Part 1 50x50 area scan frames. */
export interface ScanSvgLayout {
  readonly kind: 'scan';
  readonly viewBox: string;
  readonly bars: readonly SvgRect[];
  readonly scanlineY: number;
  readonly emitter: SvgPoint;
  readonly statusSummary: string;
}

/** SVG geometry layout for Part 2 100x100 closest-square search frames. */
export interface SquareSvgLayout {
  readonly kind: 'square';
  readonly viewBox: string;
  readonly maxCoord: number;
  readonly emitter: SvgPoint;
  readonly anchor: SvgPoint;
  readonly leftEdgePoints: string;
  readonly candidateRect: SvgRect | null;
  readonly probeDot: SvgPoint;
  readonly statusSummary: string;
}

export type TractorBeamSvgLayout = ScanSvgLayout | SquareSvgLayout;

function projectCoord(value: number, scale: number): number {
  return Number((PADDING + value * scale).toFixed(2));
}

function buildScanLayout(frame: ScanTraceFrame): ScanSvgLayout {
  const scale = INNER_SIZE / frame.gridSize;
  const barHeight = Number(Math.max(1, scale).toFixed(2));
  const bars: SvgRect[] = [];
  for (const span of frame.spans) {
    if (span !== null) {
      bars.push(Object.freeze({
        x: projectCoord(span.left, scale),
        y: projectCoord(span.y, scale),
        width: Number(((span.right - span.left + 1) * scale).toFixed(2)),
        height: barHeight,
      }));
    }
  }
  const halfCell = scale * 0.5;
  return Object.freeze({
    kind: 'scan',
    viewBox: VIEWBOX_STR,
    bars: Object.freeze(bars),
    scanlineY: Number((PADDING + frame.activeY * scale + halfCell).toFixed(2)),
    emitter: Object.freeze({ x: Number((PADDING + halfCell).toFixed(2)), y: Number((PADDING + halfCell).toFixed(2)) }),
    statusSummary: `Row ${frame.activeY + 1} / ${frame.gridSize} · Affected ${frame.affectedCount} · Probes ${frame.probeCount}`,
  });
}

function computeSquareMaxCoord(frame: SquareTraceFrame): number {
  let maxVal = Math.max(10, frame.anchor.x, frame.anchor.y, frame.probePoint.x, frame.probePoint.y);
  if (frame.candidate !== null) {
    maxVal = Math.max(maxVal, frame.candidate.rightX, frame.candidate.bottomY);
  }
  for (const pt of frame.leftEdge) {
    maxVal = Math.max(maxVal, pt.x, pt.y);
  }
  return Math.ceil(maxVal * 1.06);
}

function buildSquareLayout(frame: SquareTraceFrame): SquareSvgLayout {
  const maxCoord = computeSquareMaxCoord(frame);
  const scale = INNER_SIZE / maxCoord;
  const leftEdgePoints = frame.leftEdge
    .map((pt) => `${projectCoord(pt.x, scale)},${projectCoord(pt.y, scale)}`)
    .join(' ');
  const candidateRect = frame.candidate !== null
    ? Object.freeze({
        x: projectCoord(frame.candidate.x, scale),
        y: projectCoord(frame.candidate.y, scale),
        width: Number((frame.candidate.size * scale).toFixed(2)),
        height: Number((frame.candidate.size * scale).toFixed(2)),
      })
    : null;
  const statusSummary = frame.fits && frame.candidate !== null
    ? `Found (${frame.candidate.x}, ${frame.candidate.y}) -> ${frame.candidate.answerCode} · Probes ${frame.probeCount}`
    : `Phase ${frame.phase} · Probe (${frame.probePoint.x}, ${frame.probePoint.y}) · Probes ${frame.probeCount}`;

  return Object.freeze({
    kind: 'square',
    viewBox: VIEWBOX_STR,
    maxCoord,
    emitter: Object.freeze({ x: PADDING, y: PADDING }),
    anchor: Object.freeze({ x: projectCoord(frame.anchor.x, scale), y: projectCoord(frame.anchor.y, scale) }),
    leftEdgePoints,
    candidateRect,
    probeDot: Object.freeze({ x: projectCoord(frame.probePoint.x, scale), y: projectCoord(frame.probePoint.y, scale) }),
    statusSummary,
  });
}

/** Computes pure SVG projection geometry for either Part 1 scan or Part 2 square frames. */
export function buildTractorBeamSvgLayout(frame: TractorBeamTraceFrame): TractorBeamSvgLayout {
  if (frame.kind === 'scan') {
    return buildScanLayout(frame);
  }
  return buildSquareLayout(frame);
}
