/** Panel paint color emitted by the robot: 0 = black, 1 = white. */
export type PanelColor = 0 | 1;
/** Turn instruction emitted by the robot: 0 = left 90°, 1 = right 90°. */
export type TurnDirection = 0 | 1;
/** Cardinal heading index: 0 = UP, 1 = RIGHT, 2 = DOWN, 3 = LEFT. */
export type Heading = 0 | 1 | 2 | 3;

export const HEADING_DELTAS: readonly (readonly [number, number])[] = Object.freeze([
  Object.freeze([0, -1] as const), Object.freeze([1, 0] as const),
  Object.freeze([0, 1] as const), Object.freeze([-1, 0] as const),
]);

export const DEFAULT_MAX_VM_STEPS = 5_000_000;
export const DEFAULT_MAX_ROBOT_STEPS = 100_000;

export interface GridPoint { readonly x: number; readonly y: number; }
export interface PaintedPanel {
  readonly x: number; readonly y: number; readonly color: PanelColor; readonly paintCount: number;
}
export interface RobotExecutionLimits { readonly maxVmSteps: number; readonly maxRobotSteps: number; }

/** Immutable visualization frame without stored derived counts. */
export interface HullTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly robotX: number;
  readonly robotY: number;
  readonly heading: Heading;
  readonly lastPaintColor: PanelColor | null;
  readonly lastTurn: TurnDirection | null;
  readonly startPanelColor: PanelColor;
  readonly panels: ReadonlyMap<string, PaintedPanel>;
  readonly trail: readonly GridPoint[];
}

/** Polymorphic policy differentiating Part 1 counting from Part 2 OCR decoding. */
export interface PaintingPolicy<TAnswer> {
  readonly id: string;
  readonly label: string;
  readonly startPanelColor: PanelColor;
  readonly showRegistrationBanner: boolean;
  extractAnswer(report: PaintingReport): TAnswer;
}

export function panelKey(x: number, y: number): string { return `${x},${y}`; }

export function turnHeading(heading: Heading, turn: TurnDirection): Heading {
  return ((turn === 0 ? heading + 3 : heading + 1) & 3) as Heading;
}

export function stepPosition(x: number, y: number, heading: Heading): GridPoint {
  const [dx, dy] = HEADING_DELTAS[heading]!;
  return Object.freeze({ x: x + dx, y: y + dy });
}

export function validateRobotLimits(limits: RobotExecutionLimits): RobotExecutionLimits {
  if (!Number.isInteger(limits.maxVmSteps) || limits.maxVmSteps < 1) {
    throw new RangeError(`maxVmSteps must be a positive integer, got ${limits.maxVmSteps}`);
  }
  if (!Number.isInteger(limits.maxRobotSteps) || limits.maxRobotSteps < 1) {
    throw new RangeError(`maxRobotSteps must be a positive integer, got ${limits.maxRobotSteps}`);
  }
  return Object.freeze({ maxVmSteps: limits.maxVmSteps, maxRobotSteps: limits.maxRobotSteps });
}

/** Immutable axis-aligned hull bounds with dynamically derived dimensions. */
export class HullBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;

  constructor(minX: number, maxX: number, minY: number, maxY: number) {
    this.minX = minX; this.maxX = maxX; this.minY = minY; this.maxY = maxY;
  }

  static empty(): HullBounds { return new HullBounds(0, 0, 0, 0); }
  get width(): number { return this.maxX - this.minX + 1; }
  get height(): number { return this.maxY - this.minY + 1; }

  expand(x: number, y: number): HullBounds {
    return new HullBounds(Math.min(this.minX, x), Math.max(this.maxX, x), Math.min(this.minY, y), Math.max(this.maxY, y));
  }
}

/** Final hull painting report with dynamically derived counts and white panel coordinates. */
export class PaintingReport {
  readonly startPanelColor: PanelColor;
  readonly panels: ReadonlyMap<string, PaintedPanel>;
  readonly finalPosition: GridPoint;
  readonly finalHeading: Heading;
  readonly robotSteps: number;
  readonly vmSteps: number;

  constructor(
    startPanelColor: PanelColor, panels: ReadonlyMap<string, PaintedPanel>, finalPosition: GridPoint,
    finalHeading: Heading, robotSteps: number, vmSteps: number,
  ) {
    this.startPanelColor = startPanelColor;
    this.panels = panels;
    this.finalPosition = Object.freeze({ ...finalPosition });
    this.finalHeading = finalHeading;
    this.robotSteps = robotSteps;
    this.vmSteps = vmSteps;
  }

  get paintedCount(): number { return this.panels.size; }

  get whitePanels(): readonly GridPoint[] {
    const result: GridPoint[] = [];
    for (const panel of this.panels.values()) {
      if (panel.color === 1) result.push(Object.freeze({ x: panel.x, y: panel.y }));
    }
    if (this.startPanelColor === 1 && !this.panels.has(panelKey(0, 0))) {
      result.push(Object.freeze({ x: 0, y: 0 }));
    }
    return Object.freeze(result);
  }

  colorAt(x: number, y: number): PanelColor {
    const panel = this.panels.get(panelKey(x, y));
    if (panel !== undefined) return panel.color;
    return x === 0 && y === 0 ? this.startPanelColor : 0;
  }

  paintCountAt(x: number, y: number): number {
    return this.panels.get(panelKey(x, y))?.paintCount ?? 0;
  }
}
