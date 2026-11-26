import { bigintLog2 } from '../../../shared/core';
import type { XmasStream } from './stream';

/** Default maximum number of signal bars rendered simultaneously in the chart. */
export const DEFAULT_VIEWPORT_SLOTS = 48;

/** Frozen bar projection with log2-normalized height in (0, 1]. */
export class SignalBar {
  readonly index: number;
  readonly value: bigint;
  readonly normalizedHeight: number;

  constructor(index: number, value: bigint, normalizedHeight: number) {
    this.index = index;
    this.value = value;
    this.normalizedHeight = normalizedHeight;
    Object.freeze(this);
  }
}

/** Frozen sliced window of XMAS stream bars centered around an active focus range. */
export class SignalViewport {
  readonly startIndex: number;
  readonly bars: readonly SignalBar[];
  readonly maxLog2: number;

  constructor(startIndex: number, bars: readonly SignalBar[], maxLog2: number) {
    this.startIndex = startIndex;
    this.bars = Object.freeze([...bars]);
    this.maxLog2 = maxLog2;
    Object.freeze(this);
  }

  get barCount(): number {
    return this.bars.length;
  }

  get endIndex(): number {
    return this.startIndex + this.bars.length;
  }

  slotOf(index: number): number | null {
    if (index < this.startIndex || index >= this.endIndex) {
      return null;
    }
    return index - this.startIndex;
  }
}

function validateViewportBounds(
  streamLength: number,
  focusStart: number,
  focusEnd: number,
  maxSlots: number,
): void {
  if (!Number.isInteger(maxSlots) || maxSlots < 1) {
    throw new RangeError(`maxSlots must be a positive integer, got ${maxSlots}`);
  }
  if (
    !Number.isInteger(focusStart) ||
    !Number.isInteger(focusEnd) ||
    focusStart < 0 ||
    focusStart > focusEnd ||
    focusEnd > streamLength
  ) {
    throw new RangeError(`Invalid focus range [${focusStart}, ${focusEnd}) for length ${streamLength}`);
  }
}

function resolveSliceRange(
  streamLength: number,
  focusStart: number,
  focusEnd: number,
  maxSlots: number,
): readonly [number, number] {
  if (streamLength <= maxSlots) {
    return [0, streamLength];
  }
  const focusMid = Math.floor((focusStart + focusEnd) / 2);
  const clampedStart = Math.max(0, focusMid - Math.floor(maxSlots / 2));
  const start = Math.min(clampedStart, streamLength - maxSlots);
  return [start, start + maxSlots];
}

/** Projects a stream slice of up to maxSlots bars with log-scaled heights around [focusStart, focusEnd). */
export function computeSignalViewport(
  stream: XmasStream,
  focusStart: number,
  focusEnd: number,
  maxSlots: number,
): SignalViewport {
  validateViewportBounds(stream.length, focusStart, focusEnd, maxSlots);
  const [start, end] = resolveSliceRange(stream.length, focusStart, focusEnd, maxSlots);
  const logs: number[] = [];
  let maxLog = 0;
  for (let i = start; i < end; i += 1) {
    const logVal = bigintLog2(stream.at(i));
    logs.push(logVal);
    if (logVal > maxLog) maxLog = logVal;
  }
  const bars = logs.map((logVal, offset) => {
    const index = start + offset;
    return new SignalBar(index, stream.at(index), (logVal + 1) / (maxLog + 1));
  });
  return new SignalViewport(start, bars, maxLog);
}
