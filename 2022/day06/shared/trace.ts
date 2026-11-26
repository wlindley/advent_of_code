import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { ALPHABET_SIZE, ASCII_LOWER_A, DatastreamBuffer, parseDatastream } from './buffer';
import { findMarkerPosition, validateWindowSize } from './marker';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface MarkerSolver extends PuzzleSolver<DatastreamBuffer, number, MarkerTraceFrame> {
  readonly trace: (input: DatastreamBuffer, options?: TraceOptions) => readonly MarkerTraceFrame[];
}

export interface MarkerTraceFrameInit {
  readonly signal: string;
  readonly windowSize: number;
  readonly cursor: number;
  readonly prevWindowStart: number;
  readonly nextWindowStart: number;
  readonly collisionIndex: number | null;
  readonly collisionCount: number;
  readonly lastSeen: readonly number[];
  readonly totalVisited: number;
  readonly totalSteps: number;
}

/** Immutable snapshot of one step in the monotonic jump-window marker scan. */
export class MarkerTraceFrame {
  readonly signal: string;
  readonly windowSize: number;
  readonly cursor: number;
  readonly prevWindowStart: number;
  readonly nextWindowStart: number;
  readonly collisionIndex: number | null;
  readonly collisionCount: number;
  readonly lastSeen: readonly number[];
  readonly totalVisited: number;
  readonly totalSteps: number;

  constructor(init: MarkerTraceFrameInit) {
    this.signal = init.signal;
    this.windowSize = init.windowSize;
    this.cursor = init.cursor;
    this.prevWindowStart = init.prevWindowStart;
    this.nextWindowStart = init.nextWindowStart;
    this.collisionIndex = init.collisionIndex;
    this.collisionCount = init.collisionCount;
    this.lastSeen = Object.freeze([...init.lastSeen]);
    this.totalVisited = init.totalVisited;
    this.totalSteps = init.totalSteps;
    Object.freeze(this);
  }

  get windowStart(): number { return this.nextWindowStart; }
  get windowLength(): number { return this.cursor - this.nextWindowStart + 1; }
  get windowText(): string { return this.signal.slice(this.nextWindowStart, this.cursor + 1); }
  get currentChar(): string { return this.signal.charAt(this.cursor); }
  get position(): number { return this.cursor + 1; }
  get hasCollision(): boolean { return this.collisionIndex !== null; }
  get jumpDistance(): number { return this.nextWindowStart - this.prevWindowStart; }
  get isMarkerFound(): boolean { return this.windowLength === this.windowSize; }
}

function scanSampledFrames(
  signal: string,
  windowSize: number,
  totalVisited: number,
  sampled: readonly number[],
): readonly MarkerTraceFrame[] {
  const lastSeen = new Int32Array(ALPHABET_SIZE).fill(-1);
  const frames: MarkerTraceFrame[] = [];
  let start = 0;
  let collisionCount = 0;
  let samplePtr = 0;

  for (let cursor = 0; cursor < totalVisited; cursor += 1) {
    const code = signal.charCodeAt(cursor) - ASCII_LOWER_A;
    const prev = lastSeen[code]!;
    const prevWindowStart = start;
    const collisionIndex = prev >= start ? prev : null;
    if (collisionIndex !== null) { start = collisionIndex + 1; collisionCount += 1; }
    lastSeen[code] = cursor;
    if (cursor === sampled[samplePtr]) {
      frames.push(new MarkerTraceFrame({
        signal, windowSize, cursor, prevWindowStart, nextWindowStart: start,
        collisionIndex, collisionCount, lastSeen: Array.from(lastSeen),
        totalVisited, totalSteps: sampled.length,
      }));
      samplePtr += 1;
    }
  }
  return Object.freeze(frames);
}

/** Traces the monotonic jump-window search, uniformly sampled up to `maxSteps`. */
export function traceMarkerSearch(
  buffer: DatastreamBuffer,
  windowSize: number,
  options?: TraceOptions,
): readonly MarkerTraceFrame[] {
  const size = validateWindowSize(windowSize);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalVisited = findMarkerPosition(buffer, size);
  const sampled = sampleTraceIndices(totalVisited, maxSteps);
  return scanSampledFrames(buffer.signal, size, totalVisited, sampled);
}

/** Constructs a frozen `MarkerSolver` for a fixed distinct-character window size. */
export function createMarkerSolver(windowSize: number): MarkerSolver {
  const size = validateWindowSize(windowSize);
  return Object.freeze({
    parse: parseDatastream,
    solve: (input: DatastreamBuffer) => findMarkerPosition(input, size),
    trace: (input: DatastreamBuffer, options?: TraceOptions) =>
      traceMarkerSearch(input, size, options),
  });
}
