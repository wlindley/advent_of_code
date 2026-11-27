import type { BeamPoint } from './beamGrid';
import type { BeamOracle } from './beamProbe';

/** Search bounds protecting against malformed or divergent beam programs. */
export interface SquareSearchLimits {
  readonly maxAnchorDist: number;
  readonly maxY: number;
}

export const DEFAULT_SQUARE_LIMITS: SquareSearchLimits = Object.freeze({ maxAnchorDist: 64, maxY: 5_000 });

function validateInt(name: string, value: number, min: number): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${name} must be an integer >= ${min}, got ${value}`);
  }
}

/** Immutable top-left placement of a fitted `size x size` square in the tractor beam. */
export class SquarePlacement {
  readonly x: number;
  readonly y: number;
  readonly size: number;

  constructor(x: number, y: number, size: number) {
    validateInt('x', x, 0);
    validateInt('y', y, 0);
    validateInt('size', size, 1);
    this.x = x;
    this.y = y;
    this.size = size;
    Object.freeze(this);
  }

  get rightX(): number { return this.x + this.size - 1; }
  get bottomY(): number { return this.y + this.size - 1; }
  get answerCode(): number { return this.x * 10_000 + this.y; }
}

/** Step telemetry recorded during Phase 1 doubling jump and Phase 2 monotonic walk. */
export interface SquareSearchStep {
  readonly y: number;
  readonly left: number;
  readonly topRightX: number;
  readonly topRightY: number;
  readonly fits: boolean;
  readonly phase: 'jump' | 'walk' | 'found';
  readonly probeCount: number;
}

/** Result of locating the closest `size x size` square fitting inside the tractor beam. */
export interface BeamSquareResult {
  readonly placement: SquarePlacement;
  readonly anchor: BeamPoint;
  readonly leftEdge: readonly BeamPoint[];
  readonly steps: readonly SquareSearchStep[];
  readonly probeCount: number;
}

class CounterOracle implements BeamOracle {
  private readonly inner: BeamOracle;
  count = 0;
  constructor(inner: BeamOracle) { this.inner = inner; }
  probe(x: number, y: number): boolean { this.count += 1; return this.inner.probe(x, y); }
}

/** Finds a beam anchor via expanding L-shells `d = 1..maxDist`: `(0..d, d)` then `(d, 1..d-1)`. */
export function findBeamAnchor(oracle: BeamOracle, maxDist: number): BeamPoint {
  validateInt('maxDist', maxDist, 1);
  for (let d = 1; d <= maxDist; d += 1) {
    for (let x = 0; x <= d; x += 1) if (oracle.probe(x, d)) return Object.freeze({ x, y: d });
    for (let y = 1; y < d; y += 1) if (oracle.probe(d, y)) return Object.freeze({ x: d, y });
  }
  throw new Error(`No tractor beam anchor found within distance ${maxDist}`);
}

/** Finds the leftmost pulled `x` on row `y` near `approxLeft`, returning `-1` if empty up to `maxX`. */
export function locateRowLeft(oracle: BeamOracle, y: number, approxLeft: number, maxX: number): number {
  if (oracle.probe(approxLeft, y)) {
    let x = approxLeft;
    while (x > 0 && oracle.probe(x - 1, y)) x -= 1;
    return x;
  }
  for (let x = approxLeft + 1; x <= maxX; x += 1) if (oracle.probe(x, y)) return x;
  return -1;
}

interface SearchCtx {
  readonly oracle: CounterOracle;
  readonly size: number;
  readonly maxY: number;
  y: number;
  left: number;
  readonly leftEdge: BeamPoint[];
  readonly steps: SquareSearchStep[];
}

function maxRowX(left: number, prevY: number, nextY: number, baseApprox: number): number {
  return Math.max(baseApprox + 8, Math.ceil(((left + 2) * nextY) / prevY));
}

function runJumpPhase(ctx: SearchCtx): void {
  let step = 1;
  let overshot = false;
  while (step >= 1) {
    const yNext = ctx.y + step;
    if (yNext > ctx.maxY) { overshot = true; step = Math.floor(step / 2); continue; }
    const approxLeft = Math.max(ctx.left, Math.floor((ctx.left * yNext) / ctx.y) - 2);
    const leftNext = locateRowLeft(ctx.oracle, yNext, approxLeft, maxRowX(ctx.left, ctx.y, yNext, approxLeft));
    if (leftNext === -1) break;
    const topY = yNext - ctx.size + 1;
    const checkX = leftNext + ctx.size - 3;
    // gap <= -3 guarantees no earlier y <= yNext can fit despite +/-2 rounding oscillation.
    if (yNext >= ctx.size - 1 && ctx.oracle.probe(checkX, topY)) {
      overshot = true; step = Math.floor(step / 2); continue;
    }
    ctx.y = yNext; ctx.left = leftNext;
    ctx.leftEdge.push(Object.freeze({ x: leftNext, y: yNext }));
    ctx.steps.push(Object.freeze({
      y: yNext, left: leftNext, topRightX: checkX, topRightY: topY, fits: false, phase: 'jump', probeCount: ctx.oracle.count,
    }));
    step = overshot ? Math.floor(step / 2) : step * 2;
  }
}

function runWalkPhase(ctx: SearchCtx, anchor: BeamPoint): BeamSquareResult {
  const startY = ctx.size >= 4 && ctx.y >= ctx.size - 1 ? ctx.y + 1 : Math.max(ctx.y, ctx.size - 1);
  for (let walkY = startY; walkY <= ctx.maxY; walkY += 1) {
    if (walkY > ctx.y) {
      const leftNext = locateRowLeft(ctx.oracle, walkY, ctx.left, maxRowX(ctx.left, ctx.y, walkY, ctx.left));
      if (leftNext === -1) continue;
      ctx.y = walkY; ctx.left = leftNext;
      ctx.leftEdge.push(Object.freeze({ x: leftNext, y: walkY }));
    }
    const topY = walkY - ctx.size + 1;
    const topRightX = ctx.left + ctx.size - 1;
    const fits = ctx.oracle.probe(topRightX, topY);
    ctx.steps.push(Object.freeze({
      y: walkY, left: ctx.left, topRightX, topRightY: topY, fits, phase: fits ? 'found' : 'walk', probeCount: ctx.oracle.count,
    }));
    if (fits) {
      return Object.freeze({
        placement: new SquarePlacement(ctx.left, topY, ctx.size),
        anchor, leftEdge: Object.freeze(ctx.leftEdge), steps: Object.freeze(ctx.steps), probeCount: ctx.oracle.count,
      });
    }
  }
  throw new Error(`No ${ctx.size}x${ctx.size} square fits within maxY=${ctx.maxY}`);
}

/** Finds the closest `squareSize x squareSize` square completely contained within the tractor beam. */
export function findClosestSquare(
  oracle: BeamOracle,
  squareSize: number,
  limits?: SquareSearchLimits,
): BeamSquareResult {
  validateInt('squareSize', squareSize, 1);
  const resolved = limits ?? DEFAULT_SQUARE_LIMITS;
  validateInt('maxAnchorDist', resolved.maxAnchorDist, 1);
  validateInt('maxY', resolved.maxY, 1);
  const counter = new CounterOracle(oracle);

  if (squareSize === 1 && counter.probe(0, 0)) {
    const anchor = Object.freeze({ x: 0, y: 0 });
    const step: SquareSearchStep = Object.freeze({
      y: 0, left: 0, topRightX: 0, topRightY: 0, fits: true, phase: 'found', probeCount: counter.count,
    });
    return Object.freeze({
      placement: new SquarePlacement(0, 0, 1), anchor, leftEdge: Object.freeze([anchor]), steps: Object.freeze([step]), probeCount: counter.count,
    });
  }

  const anchor = findBeamAnchor(counter, resolved.maxAnchorDist);
  const left = locateRowLeft(counter, anchor.y, anchor.x, anchor.x);
  const ctx: SearchCtx = {
    oracle: counter, size: squareSize, maxY: resolved.maxY, y: anchor.y, left,
    leftEdge: [Object.freeze({ x: left, y: anchor.y })], steps: [],
  };
  if (squareSize >= 4) runJumpPhase(ctx);
  return runWalkPhase(ctx, anchor);
}
