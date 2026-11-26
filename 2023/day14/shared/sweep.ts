import { CELL_CUBE, CELL_EMPTY, CELL_ROUND, type TiltDirection } from './cell';

export interface SweepSpec {
  readonly lineCount: number;
  readonly lineLength: number;
  readonly baseOffset: number;
  readonly lineStride: number;
  readonly stepStride: number;
}

const SWEEP_BUILDERS: Readonly<Record<TiltDirection, (h: number, w: number) => SweepSpec>> = Object.freeze({
  north: (h, w) => ({ lineCount: w, lineLength: h, baseOffset: 0, lineStride: 1, stepStride: w }),
  west: (h, w) => ({ lineCount: h, lineLength: w, baseOffset: 0, lineStride: w, stepStride: 1 }),
  south: (h, w) => ({ lineCount: w, lineLength: h, baseOffset: (h - 1) * w, lineStride: 1, stepStride: -w }),
  east: (h, w) => ({ lineCount: h, lineLength: w, baseOffset: w - 1, lineStride: w, stepStride: -1 }),
});

/** Computes linear stride parameters for tilting a row-major buffer in `direction`. */
export function buildSweepSpec(direction: TiltDirection, height: number, width: number): SweepSpec {
  return SWEEP_BUILDERS[direction](height, width);
}

/** Compacts rounded rocks along one strided line from `src` into `dst`. */
export function sweepLine(
  src: Uint8Array,
  dst: Uint8Array,
  start: number,
  length: number,
  stepStride: number,
): void {
  let writeStep = 0;
  for (let step = 0; step < length; step += 1) {
    const idx = start + step * stepStride;
    const cell = src[idx];
    if (cell === CELL_CUBE) {
      dst[idx] = CELL_CUBE;
      writeStep = step + 1;
    } else if (cell === CELL_ROUND) {
      // Clear current slot first so writeStep === step still ends with CELL_ROUND.
      dst[idx] = CELL_EMPTY;
      dst[start + writeStep * stepStride] = CELL_ROUND;
      writeStep += 1;
    } else {
      dst[idx] = CELL_EMPTY;
    }
  }
}

/** Returns a new row-major buffer with all rounded rocks slid in `direction`. */
export function tiltBuffer(
  src: Uint8Array,
  height: number,
  width: number,
  direction: TiltDirection,
): Uint8Array {
  const dst = new Uint8Array(src.length);
  const spec = buildSweepSpec(direction, height, width);
  for (let line = 0; line < spec.lineCount; line += 1) {
    sweepLine(src, dst, spec.baseOffset + line * spec.lineStride, spec.lineLength, spec.stepStride);
  }
  return dst;
}
