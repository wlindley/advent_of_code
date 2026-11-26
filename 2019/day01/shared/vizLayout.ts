/** Visible slice [start, end) of module indices centered around the active step. */
export interface ModuleWindow {
  readonly start: number;
  readonly end: number;
}

/** Proportional SVG segment descriptor for a single fuel stage. */
export interface StageSegment {
  readonly stageIndex: number;
  readonly fuel: number;
  readonly x: number;
  readonly width: number;
}

/** Computes a clamped [0, 1] fill ratio for telemetry bars and gauges. */
export function computeGaugeRatio(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0;
  return Math.min(1, value / max);
}

/** Computes a bounded [start, end) window around activeIndex for long module lists. */
export function computeModuleWindow(
  totalCount: number,
  activeIndex: number,
  maxVisible: number,
): ModuleWindow {
  if (!Number.isInteger(totalCount) || totalCount < 0) {
    throw new RangeError(`totalCount must be a non-negative integer, got ${totalCount}`);
  }
  if (!Number.isInteger(maxVisible) || maxVisible < 1) {
    throw new RangeError(`maxVisible must be a positive integer, got ${maxVisible}`);
  }
  if (totalCount === 0) return Object.freeze({ start: 0, end: 0 });
  const clampedActive = Math.max(0, Math.min(activeIndex, totalCount - 1));
  const half = Math.floor(maxVisible / 2);
  const start = Math.max(0, Math.min(clampedActive - half, totalCount - maxVisible));
  const end = Math.min(totalCount, start + maxVisible);
  return Object.freeze({ start, end });
}

/** Maps positive fuel stages onto proportional contiguous segments across trackWidth. */
export function computeStageSegments(
  stages: readonly number[],
  trackWidth: number,
): readonly StageSegment[] {
  if (trackWidth <= 0 || stages.length === 0) return Object.freeze([]);
  let total = 0;
  for (const fuel of stages) {
    total += Math.max(0, fuel);
  }
  if (total === 0) return Object.freeze([]);
  const segments: StageSegment[] = [];
  let cursorX = 0;
  for (let i = 0; i < stages.length; i += 1) {
    const fuel = Math.max(0, stages[i]!);
    const width = (fuel / total) * trackWidth;
    segments.push(Object.freeze({ stageIndex: i, fuel, x: cursorX, width }));
    cursorX += width;
  }
  return Object.freeze(segments);
}
