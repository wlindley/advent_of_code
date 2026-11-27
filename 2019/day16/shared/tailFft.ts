import { assertNonNegativeInt, assertPositiveInt, Signal } from './signal';

/** Validates that `offset` lies in the upper-triangular suffix region and contains `messageLength` digits. */
export function validateTailBounds(totalLength: number, offset: number, messageLength: number): void {
  assertPositiveInt(totalLength, 'totalLength');
  assertNonNegativeInt(offset, 'offset');
  assertPositiveInt(messageLength, 'messageLength');
  const minOffset = Math.floor(totalLength / 2);
  if (offset < minOffset) {
    throw new RangeError(`Offset ${offset} must be >= ${minOffset} (half of ${totalLength})`);
  }
  if (offset + messageLength > totalLength) {
    throw new RangeError(
      `Message window [${offset}, ${offset + messageLength}) exceeds total length ${totalLength}`,
    );
  }
}

/** Allocates and populates the suffix digit buffer `[offset, signal.length * repeatCount)`. */
export function buildTailBuffer(signal: Signal, repeatCount: number, offset: number): Uint8Array {
  assertPositiveInt(repeatCount, 'repeatCount');
  assertNonNegativeInt(offset, 'offset');
  const totalLength = signal.length * repeatCount;
  if (offset >= totalLength) {
    throw new RangeError(`Offset ${offset} must be < total length ${totalLength}`);
  }
  const base = signal.copyToBuffer();
  const baseLength = base.length;
  const tailLength = totalLength - offset;
  const tail = new Uint8Array(tailLength);
  for (let i = 0; i < tailLength; i += 1) {
    tail[i] = base[(offset + i) % baseLength]!;
  }
  return tail;
}

/** Performs one in-place suffix-sum FFT phase on a tail buffer in O(tailLength) time. */
export function stepTailPhaseInPlace(tail: Uint8Array): void {
  if (tail.length === 0) {
    throw new RangeError('Tail buffer must not be empty');
  }
  let running = 0;
  for (let i = tail.length - 1; i >= 0; i -= 1) {
    running = (running + tail[i]!) % 10;
    tail[i] = running;
  }
}

/** Formats the leading `count` digits from `buffer` into a decimal string. */
export function formatPrefixDigits(buffer: Uint8Array, count: number): string {
  assertNonNegativeInt(count, 'count');
  if (count > buffer.length) {
    throw new RangeError(`Prefix count ${count} exceeds buffer length ${buffer.length}`);
  }
  let out = '';
  for (let i = 0; i < count; i += 1) {
    out += String(buffer[i]!);
  }
  return out;
}

/** Executes `phases` suffix-sum FFT iterations from `offset` and returns `messageLength` digits. */
export function runTailFft(
  signal: Signal,
  repeatCount: number,
  offset: number,
  phases: number,
  messageLength: number,
): string {
  assertNonNegativeInt(phases, 'phases');
  validateTailBounds(signal.length * repeatCount, offset, messageLength);
  const tail = buildTailBuffer(signal, repeatCount, offset);
  for (let p = 0; p < phases; p += 1) {
    stepTailPhaseInPlace(tail);
  }
  return formatPrefixDigits(tail, messageLength);
}

/** Solves an offset-indexed repeated FFT message puzzle using the leading `offsetDigits` offset. */
export function solveOffsetMessage(
  signal: Signal,
  repeatCount: number,
  offsetDigits: number,
  phases: number,
  messageLength: number,
): string {
  const offset = signal.readOffset(offsetDigits);
  return runTailFft(signal, repeatCount, offset, phases, messageLength);
}
