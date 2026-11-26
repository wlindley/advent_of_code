import { ALPHABET_SIZE, ASCII_LOWER_A, type DatastreamBuffer } from './buffer';

/** Validates that `windowSize` is an integer within `[1, ALPHABET_SIZE]`. */
export function validateWindowSize(windowSize: number): number {
  if (!Number.isInteger(windowSize) || windowSize < 1 || windowSize > ALPHABET_SIZE) {
    throw new RangeError(
      `windowSize must be an integer between 1 and ${ALPHABET_SIZE}, got ${windowSize}`,
    );
  }
  return windowSize;
}

/**
 * Returns the 1-based end index of the first `windowSize`-character substring
 * with all distinct lowercase letters, using a monotonic jump window (`O(N)` time, `O(1)` space).
 */
export function findMarkerPosition(buffer: DatastreamBuffer, windowSize: number): number {
  const size = validateWindowSize(windowSize);
  if (buffer.length < size) {
    throw new RangeError(`Signal length ${buffer.length} is shorter than windowSize ${size}`);
  }
  const { signal } = buffer;
  const lastSeen = new Int32Array(ALPHABET_SIZE).fill(-1);
  let start = 0;

  for (let i = 0; i < signal.length; i += 1) {
    const code = signal.charCodeAt(i) - ASCII_LOWER_A;
    const prev = lastSeen[code]!;
    if (prev >= start) start = prev + 1;
    lastSeen[code] = i;
    if (i - start + 1 === size) return i + 1;
  }
  throw new RangeError(`No ${size}-character distinct marker found in signal`);
}
