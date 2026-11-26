import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { MainLoop } from './loop';
import type { GridCoord } from './pipes';

/** Default cap on sampled wavefront frames for browser playback. */
export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface PipeMazeTraceFrame {
  readonly distance: number;
  readonly frontA: GridCoord;
  readonly frontB: GridCoord;
  readonly discoveredTiles: number;
}

function buildFrameAtDistance(loop: MainLoop, distance: number): PipeMazeTraceFrame {
  const frontA = loop.tiles[distance]!;
  const frontB = distance === 0 ? frontA : loop.tiles[loop.length - distance]!;
  return Object.freeze({
    distance,
    frontA,
    frontB,
    discoveredTiles: Math.min(loop.length, 1 + 2 * distance),
  });
}

/** Builds a bounded sequence of wavefront frames along `loop` from `S` to the farthest tile. */
export function buildLoopWalkTrace(
  loop: MainLoop,
  options?: TraceOptions,
): readonly PipeMazeTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledDistances = sampleTraceIndices(loop.farthestDistance + 1, limit);
  const frames = sampledDistances.map((distance) => buildFrameAtDistance(loop, distance));
  return Object.freeze(frames);
}
