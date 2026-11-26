import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { CrucibleRule } from './crucibleRule';
import { DialBucketQueue } from './dialBucketQueue';
import { HeatMap } from './heatMap';
import { CrucibleSearchResult, CrucibleTraceFrame } from './searchResult';

export const DEFAULT_MAX_TRACE_STEPS = 120;

const UNVISITED = 0x7fffffff;

interface SearchContext {
  readonly heat: Uint8Array;
  readonly height: number;
  readonly width: number;
  readonly goalCell: number;
  readonly minRun: number;
  readonly maxRun: number;
  readonly dist: Int32Array;
  readonly parent: Int32Array;
  readonly cellSettledHeat: Int32Array;
  readonly queue: DialBucketQueue;
}

function createSearchContext(map: HeatMap, minRun: number, maxRun: number): SearchContext {
  const stateCount = 2 * map.size;
  const dist = new Int32Array(stateCount).fill(UNVISITED);
  const parent = new Int32Array(stateCount).fill(-1);
  const cellSettledHeat = new Int32Array(map.size).fill(-1);
  const queue = new DialBucketQueue(stateCount, 9 * maxRun + 1);
  // Seed both outgoing axes (0 = horizontal, 1 = vertical) at the start cell with 0 heat loss.
  dist[0] = 0;
  dist[1] = 0;
  queue.insert(0, 0);
  queue.insert(1, 0);
  return {
    heat: map.copyHeat(), height: map.height, width: map.width, goalCell: map.goalCell,
    minRun, maxRun, dist, parent, cellSettledHeat, queue,
  };
}

function reconstructTurnCells(parent: Int32Array, goalState: number): readonly number[] {
  const reversed: number[] = [];
  let cur = goalState;
  while (cur !== -1) {
    reversed.push(cur >> 1);
    cur = parent[cur]!;
  }
  reversed.reverse();
  return reversed;
}

function marchDirection(
  ctx: SearchContext, fromState: number, baseDist: number,
  startR: number, startC: number, dr: number, dc: number, nextAxis: number,
): void {
  let nr = startR;
  let nc = startC;
  let accHeat = baseDist;
  for (let k = 1; k <= ctx.maxRun; k += 1) {
    nr += dr;
    nc += dc;
    if (nr < 0 || nr >= ctx.height || nc < 0 || nc >= ctx.width) break;
    accHeat += ctx.heat[nr * ctx.width + nc]!;
    if (k < ctx.minRun) continue;
    const nextState = ((nr * ctx.width + nc) << 1) | nextAxis;
    const oldDist = ctx.dist[nextState]!;
    if (accHeat < oldDist) {
      ctx.dist[nextState] = accHeat;
      ctx.parent[nextState] = fromState;
      if (oldDist === UNVISITED) ctx.queue.insert(nextState, accHeat);
      else ctx.queue.decreaseKey(nextState, oldDist, accHeat);
    }
  }
}

function relaxAxis(ctx: SearchContext, state: number, stateDist: number): void {
  const axis = state & 1;
  const cell = state >> 1;
  const r = Math.floor(cell / ctx.width);
  const c = cell % ctx.width;
  const dr = axis;
  const dc = 1 - axis;
  const nextAxis = 1 - axis;
  marchDirection(ctx, state, stateDist, r, c, dr, dc, nextAxis);
  marchDirection(ctx, state, stateDist, r, c, -dr, -dc, nextAxis);
}

function runSearchLoop(ctx: SearchContext): CrucibleSearchResult {
  while (ctx.queue.size > 0) {
    const state = ctx.queue.popMin();
    const stateDist = ctx.dist[state]!;
    const cell = state >> 1;
    if (ctx.cellSettledHeat[cell]! === -1) {
      ctx.cellSettledHeat[cell] = stateDist;
    }
    if (cell === ctx.goalCell) {
      return new CrucibleSearchResult(ctx.cellSettledHeat, ctx.height, ctx.width, reconstructTurnCells(ctx.parent, state));
    }
    relaxAxis(ctx, state, stateDist);
  }
  throw new Error('Goal is unreachable under crucible rule');
}

/** Axis-alternating shortest-path router backed by Dial's bucket queue. */
export class CrucibleRouter {
  readonly rule: CrucibleRule;

  constructor(rule: CrucibleRule) {
    this.rule = rule;
    Object.freeze(this);
  }

  search(map: HeatMap): CrucibleSearchResult {
    if (map.size === 1) {
      return new CrucibleSearchResult(new Int32Array([0]), 1, 1, [0]);
    }
    const effectiveMaxRun = Math.min(this.rule.maxRun, Math.max(map.height, map.width) - 1);
    if (effectiveMaxRun < this.rule.minRun) {
      throw new Error('Goal is unreachable under crucible rule');
    }
    return runSearchLoop(createSearchContext(map, this.rule.minRun, effectiveMaxRun));
  }

  trace(map: HeatMap, options?: TraceOptions): readonly CrucibleTraceFrame[] {
    const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const result = this.search(map);
    const thresholds = sampleTraceIndices(result.goalHeat + 1, limit);
    return Object.freeze(
      thresholds.map((threshold, idx) => new CrucibleTraceFrame(result, threshold, idx, thresholds.length)),
    );
  }
}
