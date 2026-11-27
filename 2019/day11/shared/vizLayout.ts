import { HullBounds, panelKey, type Heading, type HullTraceFrame } from './robotModels';

export const CELL_SIZE = 16;
const CELL_INSET = 1;
const CELL_SPAN = CELL_SIZE - 2 * CELL_INSET;
const TRAIL_POINT_LIMIT = 32;
const HEADING_LABELS: readonly string[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

const ROBOT_ARROW_OFFSETS: readonly (readonly (readonly [number, number])[])[] = [
  [[0, -6], [4.5, 4.5], [-4.5, 4.5]],
  [[6, 0], [-4.5, 4.5], [-4.5, -4.5]],
  [[0, 6], [-4.5, -4.5], [4.5, -4.5]],
  [[-6, 0], [4.5, -4.5], [4.5, 4.5]],
];

/** Precomputed batched SVG layers and HUD summary for a single trace frame. */
export interface HullSvgLayout {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly blackOncePath: string;
  readonly blackMultiPath: string;
  readonly whiteOncePath: string;
  readonly whiteMultiPath: string;
  readonly trailPoints: string;
  readonly robotPolygonPoints: string;
  readonly bounds: HullBounds;
  readonly paintedCount: number;
  readonly whiteCount: number;
  readonly multiPaintedCount: number;
  readonly headingLabel: string;
  readonly actionSummary: string;
}

export function formatHeadingLabel(heading: Heading): string {
  return HEADING_LABELS[heading]!;
}

export function formatRobotPolygon(x: number, y: number, heading: Heading): string {
  const cx = x * CELL_SIZE + CELL_SIZE / 2;
  const cy = y * CELL_SIZE + CELL_SIZE / 2;
  return ROBOT_ARROW_OFFSETS[heading]!.map(([dx, dy]) => `${cx + dx},${cy + dy}`).join(' ');
}

function cellRectPath(x: number, y: number): string {
  return `M${x * CELL_SIZE + CELL_INSET} ${y * CELL_SIZE + CELL_INSET}h${CELL_SPAN}v${CELL_SPAN}h-${CELL_SPAN}z`;
}

function formatActionSummary(frame: HullTraceFrame): string {
  if (frame.lastPaintColor === null) {
    return `Initial state (facing ${formatHeadingLabel(frame.heading)})`;
  }
  const colorWord = frame.lastPaintColor === 1 ? 'white' : 'black';
  const turnWord = frame.lastTurn === 0 ? 'left' : 'right';
  return `Painted ${colorWord}, turned ${turnWord}`;
}

function collectPanelLayers(frame: HullTraceFrame) {
  let bounds = HullBounds.empty().expand(frame.robotX, frame.robotY);
  let blackOncePath = '', blackMultiPath = '', whiteOncePath = '', whiteMultiPath = '';
  let whiteCount = 0, multiPaintedCount = 0;

  for (const panel of frame.panels.values()) {
    bounds = bounds.expand(panel.x, panel.y);
    const segment = cellRectPath(panel.x, panel.y);
    const isMulti = panel.paintCount > 1;
    if (isMulti) multiPaintedCount += 1;
    if (panel.color === 1) {
      whiteCount += 1;
      if (isMulti) whiteMultiPath += segment;
      else whiteOncePath += segment;
    } else if (isMulti) {
      blackMultiPath += segment;
    } else {
      blackOncePath += segment;
    }
  }
  if (frame.startPanelColor === 1 && !frame.panels.has(panelKey(0, 0))) {
    whiteOncePath += cellRectPath(0, 0);
    whiteCount += 1;
  }
  return { bounds, blackOncePath, blackMultiPath, whiteOncePath, whiteMultiPath, whiteCount, multiPaintedCount };
}

/** Builds 4-layer batched SVG path geometry, robot arrow, trail, and HUD metrics. */
export function buildHullSvgLayout(frame: HullTraceFrame): HullSvgLayout {
  const layers = collectPanelLayers(frame);
  const trailPoints = frame.trail
    .slice(-TRAIL_POINT_LIMIT)
    .map((pt) => `${pt.x * CELL_SIZE + CELL_SIZE / 2},${pt.y * CELL_SIZE + CELL_SIZE / 2}`)
    .join(' ');
  const width = (layers.bounds.width + 2) * CELL_SIZE;
  const height = (layers.bounds.height + 2) * CELL_SIZE;
  const viewBox = `${(layers.bounds.minX - 1) * CELL_SIZE} ${(layers.bounds.minY - 1) * CELL_SIZE} ${width} ${height}`;

  return Object.freeze({
    viewBox,
    width,
    height,
    ...layers,
    trailPoints,
    robotPolygonPoints: formatRobotPolygon(frame.robotX, frame.robotY, frame.heading),
    paintedCount: frame.panels.size,
    headingLabel: formatHeadingLabel(frame.heading),
    actionSummary: formatActionSummary(frame),
  });
}
