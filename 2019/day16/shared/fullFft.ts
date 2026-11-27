import { assertNonNegativeInt, Signal } from './signal';

function validatePhaseBuffers(source: Uint8Array, target: Uint8Array, prefix: Int32Array): void {
  const n = source.length;
  if (n === 0) {
    throw new RangeError('FFT signal buffer must not be empty');
  }
  if (target.length !== n) {
    throw new RangeError(`Target buffer length ${target.length} must match source length ${n}`);
  }
  if (prefix.length !== n + 1) {
    throw new RangeError(`Prefix buffer length ${prefix.length} must equal ${n + 1}`);
  }
}

function buildPrefixSums(source: Uint8Array, prefix: Int32Array): void {
  prefix[0] = 0;
  for (let i = 0; i < source.length; i += 1) {
    prefix[i + 1] = prefix[i]! + source[i]!;
  }
}

function computeRowDigit(prefix: Int32Array, n: number, row: number): number {
  const blockSize = row + 1;
  const stride = 4 * blockSize;
  let sum = 0;
  for (let pos = row; pos < n; pos += stride) {
    const posEnd = Math.min(n, pos + blockSize);
    sum += prefix[posEnd]! - prefix[pos]!;
    const negStart = pos + 2 * blockSize;
    if (negStart < n) {
      const negEnd = Math.min(n, negStart + blockSize);
      sum -= prefix[negEnd]! - prefix[negStart]!;
    }
  }
  return Math.abs(sum) % 10;
}

/** Executes one full FFT phase in O(N log N) via harmonic prefix-sum blocks. */
export function stepFftPhase(source: Uint8Array, target: Uint8Array, prefix: Int32Array): void {
  validatePhaseBuffers(source, target, prefix);
  const n = source.length;
  buildPrefixSums(source, prefix);
  for (let row = 0; row < n; row += 1) {
    target[row] = computeRowDigit(prefix, n, row);
  }
}

/** Runs `phases` iterations of the full Flawed Frequency Transmission algorithm. */
export function runFullFft(signal: Signal, phases: number): Signal {
  assertNonNegativeInt(phases, 'phases');
  if (phases === 0) {
    return signal;
  }
  let current: Uint8Array = signal.copyToBuffer();
  let next: Uint8Array = new Uint8Array(signal.length);
  const prefix = new Int32Array(signal.length + 1);
  for (let p = 0; p < phases; p += 1) {
    stepFftPhase(current, next, prefix);
    const swap = current;
    current = next;
    next = swap;
  }
  return Signal.fromDigits(current);
}
