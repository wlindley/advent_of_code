import {
  SENSOR_ORDER,
  type SensorWindow,
  type SpringscriptEvaluation,
  type SpringscriptProgram,
} from './springscript';

export const JUMP_DISTANCE = 4;

export interface HullTick {
  readonly tickIndex: number;
  readonly position: number;
  readonly sensors: SensorWindow;
  readonly evaluation: SpringscriptEvaluation;
  readonly nextPosition: number;
  readonly landedSafe: boolean;
}

export interface HullSimulationResult {
  readonly hull: string;
  readonly crossed: boolean;
  readonly failedAt: number | null;
  readonly ticks: readonly HullTick[];
}

function validateHull(hull: string): void {
  if (hull.length === 0 || hull[0] !== '#') {
    throw new RangeError('Hull must be non-empty and start with "#"');
  }
  for (let i = 0; i < hull.length; i += 1) {
    const ch = hull[i];
    if (ch !== '#' && ch !== '.') {
      throw new RangeError(`Invalid hull tile "${ch}" at index ${i}`);
    }
  }
}

function isHullTileSafe(hull: string, index: number): boolean {
  return index >= hull.length || hull[index] === '#';
}

/** Reads the 9-tile forward sensor window (`A..I`) from a validated hull position. */
export function readSensorWindow(hull: string, position: number): SensorWindow {
  validateHull(hull);
  if (!Number.isInteger(position) || position < 0) {
    throw new RangeError(`Position must be a non-negative integer, got ${position}`);
  }
  const sensors: Record<string, boolean> = {};
  for (let i = 0; i < SENSOR_ORDER.length; i += 1) {
    const reg = SENSOR_ORDER[i]!;
    sensors[reg] = isHullTileSafe(hull, position + i + 1);
  }
  return Object.freeze(sensors) as SensorWindow;
}

/** Simulates a Springscript program stepping across a hull segment until safe exit or fall. */
export function simulateHullCrossing(hull: string, program: SpringscriptProgram): HullSimulationResult {
  validateHull(hull);
  const ticks: HullTick[] = [];
  let position = 0;
  let tickIndex = 0;

  while (position < hull.length) {
    const sensors = readSensorWindow(hull, position);
    const evaluation = program.evaluate(sensors);
    const nextPosition = evaluation.registerJ ? position + JUMP_DISTANCE : position + 1;
    const landedSafe = isHullTileSafe(hull, nextPosition);
    ticks.push(Object.freeze({ tickIndex, position, sensors, evaluation, nextPosition, landedSafe }));
    if (!landedSafe) {
      return Object.freeze({ hull, crossed: false, failedAt: nextPosition, ticks: Object.freeze(ticks) });
    }
    position = nextPosition;
    tickIndex += 1;
  }

  return Object.freeze({ hull, crossed: true, failedAt: null, ticks: Object.freeze(ticks) });
}
