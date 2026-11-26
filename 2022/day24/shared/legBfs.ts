import { euclideanMod } from '../../../shared/core';
import { BlizzardBasin, START_CELL_ID } from './basin';
import { type BasinWaypoint, LegResult } from './types';

const ACTION_WAIT = 0;
const ACTION_UP = 1;
const ACTION_DOWN = 2;
const ACTION_LEFT = 3;
const ACTION_RIGHT = 4;
const START_MARK = 6;

interface LayerContext {
  readonly basin: BlizzardBasin;
  readonly tr: number;
  readonly tc: number;
  readonly phaseOffset: number;
  readonly visited: Uint8Array;
  readonly nextFrontier: number[];
}

function resolveWaypointCell(basin: BlizzardBasin, waypoint: BasinWaypoint): number {
  return waypoint === 'start' ? basin.startCellId : basin.endCellId;
}

function tryVisit(ctx: LayerContext, cell: number, action: number): void {
  const stateIdx = ctx.phaseOffset + cell;
  if (ctx.visited[stateIdx] !== 0) return;
  ctx.visited[stateIdx] = action + 1;
  ctx.nextFrontier.push(cell);
}

function tryMove(ctx: LayerContext, cell: number, action: number): void {
  if (ctx.basin.isCellFreeAtMod(cell, ctx.tr, ctx.tc)) tryVisit(ctx, cell, action);
}

function expandInterior(ctx: LayerContext, cell: number): void {
  const { basin } = ctx;
  const h = basin.innerHeight;
  const w = basin.innerWidth;
  const idx = cell - 1;
  const ir = Math.floor(idx / w);
  const ic = idx % w;
  tryMove(ctx, cell, ACTION_WAIT);
  if (ir > 0) tryMove(ctx, cell - w, ACTION_UP);
  else if (cell === basin.startEntryId) tryVisit(ctx, START_CELL_ID, ACTION_UP);
  if (ir < h - 1) tryMove(ctx, cell + w, ACTION_DOWN);
  else if (cell === basin.endEntryId) tryVisit(ctx, basin.endCellId, ACTION_DOWN);
  if (ic > 0) tryMove(ctx, cell - 1, ACTION_LEFT);
  if (ic < w - 1) tryMove(ctx, cell + 1, ACTION_RIGHT);
}

function expandCell(ctx: LayerContext, cell: number): void {
  if (cell === START_CELL_ID) {
    tryVisit(ctx, START_CELL_ID, ACTION_WAIT);
    tryMove(ctx, ctx.basin.startEntryId, ACTION_DOWN);
    return;
  }
  if (cell === ctx.basin.endCellId) {
    tryVisit(ctx, ctx.basin.endCellId, ACTION_WAIT);
    tryMove(ctx, ctx.basin.endEntryId, ACTION_UP);
    return;
  }
  expandInterior(ctx, cell);
}

function undoAction(basin: BlizzardBasin, cell: number, action: number): number {
  if (action === ACTION_WAIT) return cell;
  if (action === ACTION_LEFT) return cell + 1;
  if (action === ACTION_RIGHT) return cell - 1;
  if (action === ACTION_DOWN) {
    if (cell === basin.endCellId) return basin.endEntryId;
    if (cell === basin.startEntryId) return START_CELL_ID;
    return cell - basin.innerWidth;
  }
  if (cell === START_CELL_ID) return basin.startEntryId;
  if (cell === basin.endEntryId) return basin.endCellId;
  return cell + basin.innerWidth;
}

function reconstructPath(
  basin: BlizzardBasin,
  startTime: number,
  depth: number,
  targetCell: number,
  visited: Uint8Array,
): Int32Array {
  const path = new Int32Array(depth + 1);
  const period = basin.period;
  const numCells = basin.numCells;
  let cell = targetCell;
  path[depth] = cell;
  for (let step = depth; step >= 1; step -= 1) {
    const phase = (startTime + step) % period;
    cell = undoAction(basin, cell, visited[phase * numCells + cell]! - 1);
    path[step - 1] = cell;
  }
  return path;
}

function stepBfsLayer(
  basin: BlizzardBasin,
  frontier: readonly number[],
  nextTime: number,
  visited: Uint8Array,
): number[] {
  const ctx: LayerContext = {
    basin,
    tr: euclideanMod(nextTime, basin.innerHeight),
    tc: euclideanMod(nextTime, basin.innerWidth),
    phaseOffset: euclideanMod(nextTime, basin.period) * basin.numCells,
    visited,
    nextFrontier: [],
  };
  for (let i = 0; i < frontier.length; i += 1) expandCell(ctx, frontier[i]!);
  return ctx.nextFrontier;
}

/** Finds a shortest time-layered BFS crossing between two waypoints starting at `startTime`. */
export function solveLeg(
  basin: BlizzardBasin,
  from: BasinWaypoint,
  to: BasinWaypoint,
  startTime: number,
): LegResult {
  if (!Number.isSafeInteger(startTime) || startTime < 0) {
    throw new RangeError(`startTime must be a non-negative safe integer, got ${startTime}`);
  }
  const startCell = resolveWaypointCell(basin, from);
  const targetCell = resolveWaypointCell(basin, to);
  if (startCell === targetCell) {
    return new LegResult(startTime, new Int32Array([startCell]), new Int32Array([1]));
  }
  const visited = new Uint8Array(basin.period * basin.numCells);
  visited[euclideanMod(startTime, basin.period) * basin.numCells + startCell] = START_MARK;
  let frontier: number[] = [startCell];
  const counts: number[] = [1];
  for (let depth = 1; frontier.length > 0; depth += 1) {
    const nextTime = startTime + depth;
    const nextFrontier = stepBfsLayer(basin, frontier, nextTime, visited);
    counts.push(nextFrontier.length);
    const targetOffset = euclideanMod(nextTime, basin.period) * basin.numCells + targetCell;
    if (visited[targetOffset] !== 0) {
      const path = reconstructPath(basin, startTime, depth, targetCell, visited);
      return new LegResult(startTime, path, new Int32Array(counts));
    }
    frontier = nextFrontier;
  }
  throw new Error(`No valid path found from '${from}' to '${to}' starting at minute ${startTime}`);
}
