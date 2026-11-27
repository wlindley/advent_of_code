import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import {
  EnhancementAlgorithm,
  TrenchImage,
  type PixelBit,
  type TrenchMapInput,
  type TrenchTraceFrame,
} from './types';

/** Default trace frame cap covering 50 enhancement steps plus the initial frame. */
export const DEFAULT_MAX_TRACE_STEPS = 51;

function assertNonNegativeInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer, got ${value}`);
  }
}

function stampHalo(
  buf: Uint8Array,
  bufW: number,
  top: number,
  bot: number,
  left: number,
  right: number,
  val: PixelBit,
): void {
  const spanStart = left - 2;
  const spanEnd = right + 3;
  for (const r of [top - 2, top - 1, bot + 1, bot + 2]) {
    buf.fill(val, r * bufW + spanStart, r * bufW + spanEnd);
  }
  for (let r = top; r <= bot; r += 1) {
    const base = r * bufW;
    buf[base + left - 2] = val;
    buf[base + left - 1] = val;
    buf[base + right + 1] = val;
    buf[base + right + 2] = val;
  }
}

function copyInitialToBuffer(
  image: TrenchImage,
  buf: Uint8Array,
  bufW: number,
  top: number,
  left: number,
): void {
  const pixels = image.copyPixels();
  for (let r = 0; r < image.height; r += 1) {
    const srcStart = r * image.width;
    buf.set(pixels.subarray(srcStart, srcStart + image.width), (top + r) * bufW + left);
  }
}

function enhanceStep(
  src: Uint8Array,
  dst: Uint8Array,
  table: Uint8Array,
  bufW: number,
  newTop: number,
  newBot: number,
  newLeft: number,
  newRight: number,
): void {
  for (let r = newTop; r <= newBot; r += 1) {
    const rowAbove = (r - 1) * bufW;
    const rowCurr = r * bufW;
    const rowBelow = (r + 1) * bufW;
    let w0 = (src[rowAbove + newLeft - 1]! << 1) | src[rowAbove + newLeft]!;
    let w1 = (src[rowCurr + newLeft - 1]! << 1) | src[rowCurr + newLeft]!;
    let w2 = (src[rowBelow + newLeft - 1]! << 1) | src[rowBelow + newLeft]!;
    for (let c = newLeft; c <= newRight; c += 1) {
      w0 = ((w0 << 1) & 7) | src[rowAbove + c + 1]!;
      w1 = ((w1 << 1) & 7) | src[rowCurr + c + 1]!;
      w2 = ((w2 << 1) & 7) | src[rowBelow + c + 1]!;
      dst[rowCurr + c] = table[(w0 << 6) | (w1 << 3) | w2]!;
    }
  }
}

function extractImage(
  buf: Uint8Array,
  bufW: number,
  top: number,
  bot: number,
  left: number,
  right: number,
  bg: PixelBit,
): TrenchImage {
  const height = bot - top + 1;
  const width = right - left + 1;
  const pixels = new Uint8Array(height * width);
  for (let r = 0; r < height; r += 1) {
    const start = (top + r) * bufW + left;
    pixels.set(buf.subarray(start, start + width), r * width);
  }
  return new TrenchImage(height, width, pixels, bg);
}

function runEnhancement(
  image: TrenchImage,
  algorithm: EnhancementAlgorithm,
  steps: number,
  captureSet: ReadonlySet<number>,
): TrenchTraceFrame[] {
  if (steps === 0) return [{ step: 0, totalSteps: 0, image }];
  const table = algorithm.copyTable();
  const bufH = image.height + 2 * steps + 4;
  const bufW = image.width + 2 * steps + 4;
  let src = new Uint8Array(bufH * bufW);
  let dst = new Uint8Array(bufH * bufW);
  let [top, bot] = [steps + 2, steps + 1 + image.height];
  let [left, right] = [steps + 2, steps + 1 + image.width];
  let bg = image.background;
  copyInitialToBuffer(image, src, bufW, top, left);
  stampHalo(src, bufW, top, bot, left, right, bg);
  const frames: TrenchTraceFrame[] = [];
  if (captureSet.has(0)) frames.push({ step: 0, totalSteps: steps, image });
  for (let step = 1; step <= steps; step += 1) {
    top -= 1; bot += 1; left -= 1; right += 1;
    enhanceStep(src, dst, table, bufW, top, bot, left, right);
    bg = algorithm.nextBackground(bg);
    stampHalo(dst, bufW, top, bot, left, right, bg);
    const next = src; src = dst; dst = next;
    if (captureSet.has(step)) {
      frames.push({ step, totalSteps: steps, image: extractImage(src, bufW, top, bot, left, right, bg) });
    }
  }
  return frames;
}

/** Applies `steps` simultaneous 3x3 enhancement passes over the infinite trench image. */
export function enhanceImage(
  image: TrenchImage,
  algorithm: EnhancementAlgorithm,
  steps: number,
): TrenchImage {
  assertNonNegativeInt(steps, 'steps');
  return runEnhancement(image, algorithm, steps, new Set([steps]))[0]!.image;
}

/** Runs `totalSteps` enhancements and returns uniformly sampled trace frames. */
export function traceEnhancement(
  input: TrenchMapInput,
  totalSteps: number,
  options?: TraceOptions,
): readonly TrenchTraceFrame[] {
  assertNonNegativeInt(totalSteps, 'totalSteps');
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(totalSteps + 1, limit);
  return runEnhancement(input.image, input.algorithm, totalSteps, new Set(sampled));
}
