import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { BlizzardBasin, GridCoord } from './basin';
import { solveLeg } from './legBfs';
import {
  BasinFrame,
  type BasinWaypoint,
  type LegResult,
  type MoveAction,
  TripResult,
} from './types';

export const DEFAULT_TRACE_MAX_STEPS = 120;

function actionBetween(prev: GridCoord, next: GridCoord): MoveAction {
  const dr = next.row - prev.row;
  const dc = next.col - prev.col;
  if (dr === -1) return 'up';
  if (dr === 1) return 'down';
  if (dc === -1) return 'left';
  if (dc === 1) return 'right';
  return 'wait';
}

function appendLegFrames(
  basin: BlizzardBasin,
  leg: LegResult,
  legIndex: number,
  legCount: number,
  frames: BasinFrame[],
): void {
  let prevPos = basin.cellCoord(leg.path[0]!);
  for (let step = 1; step < leg.path.length; step += 1) {
    const pos = basin.cellCoord(leg.path[step]!);
    const action = actionBetween(prevPos, pos);
    frames.push(
      new BasinFrame(leg.startTime + step, legIndex, legCount, pos, action, leg.frontierCounts[step]!),
    );
    prevPos = pos;
  }
}

/** Solves a sequential multi-leg trip across the given `waypoints`. */
export function solveTrip(
  basin: BlizzardBasin,
  waypoints: readonly BasinWaypoint[],
): TripResult {
  if (waypoints.length < 2) {
    throw new RangeError(`waypoints must contain at least 2 stops, got ${waypoints.length}`);
  }
  const legs: LegResult[] = [];
  let currentTime = 0;
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const leg = solveLeg(basin, waypoints[i]!, waypoints[i + 1]!, currentTime);
    legs.push(leg);
    currentTime = leg.arrivalTime;
  }
  return new TripResult(legs);
}

/** Traces a shortest multi-leg trip into a bounded sequence of `BasinFrame` snapshots. */
export function traceTrip(
  basin: BlizzardBasin,
  waypoints: readonly BasinWaypoint[],
  options?: TraceOptions,
): readonly BasinFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const trip = solveTrip(basin, waypoints);
  const firstLeg = trip.legs[0]!;
  const legCount = trip.legs.length;
  const frames: BasinFrame[] = [
    new BasinFrame(
      firstLeg.startTime,
      0,
      legCount,
      basin.cellCoord(firstLeg.startCellId),
      'start',
      firstLeg.frontierCounts[0]!,
    ),
  ];
  for (let i = 0; i < legCount; i += 1) {
    appendLegFrames(basin, trip.legs[i]!, i, legCount, frames);
  }
  const indices = sampleTraceIndices(frames.length, limit);
  return Object.freeze(indices.map((idx) => frames[idx]!));
}
