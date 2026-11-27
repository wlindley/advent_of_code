import type { Direction, GridPoint, RobotPose } from './scaffoldMap';
import type { ScaffoldPolicy, ScaffoldTraceFrame } from './scaffoldSolver';

/** SVG grid cell pixel pitch for Day 17 scaffold visualizations. */
export const CELL_SIZE = 12;
const CELL_INSET = 1;
const CELL_SPAN = CELL_SIZE - 2 * CELL_INSET;
const HALF_CELL = CELL_SIZE / 2;
const INTERSECTION_INSET = 2.5;
const INTERSECTION_SPAN = CELL_SIZE - 2 * INTERSECTION_INSET;

type ArrowTuple = readonly [number, number, number, number, number, number];
const ARROW_OFFSETS: Readonly<Record<Direction, ArrowTuple>> = Object.freeze({
  U: [0, -4, -3.5, 3, 3.5, 3],
  R: [4, 0, -3, -3.5, -3, 3.5],
  D: [0, 4, -3.5, -3, 3.5, -3],
  L: [-4, 0, 3, -3.5, 3, 3.5],
});

/** Precomputed directional marker coordinates for the vacuum robot. */
export interface RobotMarkerLayout {
  readonly center: GridPoint;
  readonly direction: Direction;
  readonly arrowPoints: string;
}

/** Precomputed batched SVG geometry and HUD summary for a single Day 17 trace frame. */
export interface ScaffoldSvgLayout {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly scaffoldPath: string;
  readonly intersectionPath: string;
  readonly intersectionCount: number;
  readonly sweptPolyline: string;
  readonly robotMarker: RobotMarkerLayout | null;
  readonly statusSummary: string;
}

function cellRectPath(x: number, y: number, inset: number, span: number): string {
  return `M${x * CELL_SIZE + inset} ${y * CELL_SIZE + inset}h${span}v${span}h-${span}z`;
}

function buildScaffoldPath(frame: ScaffoldTraceFrame): string {
  const segments: string[] = [];
  const rowLimit = frame.revealedRows;
  for (let y = 0; y < rowLimit; y += 1) {
    for (let x = 0; x < frame.map.width; x += 1) {
      if (frame.map.isScaffold(x, y)) {
        segments.push(cellRectPath(x, y, CELL_INSET, CELL_SPAN));
      }
    }
  }
  return segments.join('');
}

function buildIntersectionLayer(frame: ScaffoldTraceFrame): {
  readonly intersectionPath: string;
  readonly intersectionCount: number;
} {
  const segments: string[] = [];
  for (const pt of frame.map.intersections) {
    if (pt.y < frame.revealedRows - 1) {
      segments.push(cellRectPath(pt.x, pt.y, INTERSECTION_INSET, INTERSECTION_SPAN));
    }
  }
  return { intersectionPath: segments.join(''), intersectionCount: segments.length };
}

function buildRobotMarker(robot: RobotPose | null): RobotMarkerLayout | null {
  if (robot === null) {
    return null;
  }
  const cx = robot.x * CELL_SIZE + HALF_CELL;
  const cy = robot.y * CELL_SIZE + HALF_CELL;
  const [tx, ty, b1x, b1y, b2x, b2y] = ARROW_OFFSETS[robot.direction];
  return Object.freeze({
    center: Object.freeze({ x: cx, y: cy }),
    direction: robot.direction,
    arrowPoints: `${cx + tx},${cy + ty} ${cx + b1x},${cy + b1y} ${cx + b2x},${cy + b2y}`,
  });
}

function formatStatusSummary(
  frame: ScaffoldTraceFrame,
  policy: ScaffoldPolicy,
  intersectionCount: number,
): string {
  if (frame.phase === 'sweep') {
    const dustTag = frame.dust !== null ? ` · Dust ${frame.dust}` : '';
    return `${policy.label} · Sweep step ${frame.stepIndex} / ${frame.totalSteps}${dustTag}`;
  }
  return `${policy.label} · Scanned ${frame.revealedRows} / ${frame.map.height} rows · ${intersectionCount} intersections`;
}

/** Builds batched SVG paths and HUD metrics for a Day 17 trace frame. */
export function buildScaffoldSvgLayout(
  frame: ScaffoldTraceFrame,
  policy: ScaffoldPolicy,
): ScaffoldSvgLayout {
  const width = (frame.map.width + 2) * CELL_SIZE;
  const height = (frame.map.height + 2) * CELL_SIZE;
  const viewBox = `${-CELL_SIZE} ${-CELL_SIZE} ${width} ${height}`;
  const scaffoldPath = buildScaffoldPath(frame);
  const { intersectionPath, intersectionCount } = buildIntersectionLayer(frame);
  const sweptPolyline = frame.sweptPath
    .map((pt) => `${pt.x * CELL_SIZE + HALF_CELL},${pt.y * CELL_SIZE + HALF_CELL}`)
    .join(' ');

  return Object.freeze({
    viewBox,
    width,
    height,
    scaffoldPath,
    intersectionPath,
    intersectionCount,
    sweptPolyline,
    robotMarker: buildRobotMarker(frame.robot),
    statusSummary: formatStatusSummary(frame, policy, intersectionCount),
  });
}
