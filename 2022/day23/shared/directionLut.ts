import type { Direction } from './types';

export const STAY_DIR = 4;

export const DIR_DR = new Int8Array([-1, 1, 0, 0]);
export const DIR_DC = new Int8Array([0, 0, -1, 1]);

// Neighbor bit layout: 0=NW, 1=N, 2=NE, 3=E, 4=SE, 5=S, 6=SW, 7=W.
export const WEDGE_MASKS = new Uint8Array([7, 112, 193, 28]);

const ROTATED_ORDERS: readonly (readonly Direction[])[] = Object.freeze([
  Object.freeze([0, 1, 2, 3] as const),
  Object.freeze([1, 2, 3, 0] as const),
  Object.freeze([2, 3, 0, 1] as const),
  Object.freeze([3, 0, 1, 2] as const),
]);

function resolveDirection(rot: number, mask: number): number {
  if (mask === 0) return STAY_DIR;
  for (let k = 0; k < 4; k += 1) {
    const dir = (rot + k) & 3;
    if ((mask & WEDGE_MASKS[dir]!) === 0) return dir;
  }
  return STAY_DIR;
}

function buildDirectionLut(): Uint8Array {
  const lut = new Uint8Array(1024);
  for (let rot = 0; rot < 4; rot += 1) {
    for (let mask = 0; mask < 256; mask += 1) {
      lut[(rot << 8) | mask] = resolveDirection(rot, mask);
    }
  }
  return lut;
}

/** 1024-byte lookup table mapping ((roundMod4 << 8) | neighborMask) to Direction | STAY_DIR. */
export const DIR_LUT = buildDirectionLut();

/** Returns the 4-direction proposal priority order for a 1-indexed round. */
export function priorityOrderForRound(round: number): readonly Direction[] {
  if (!Number.isInteger(round) || round < 1) {
    throw new RangeError(`round must be a positive integer, got ${round}`);
  }
  return ROTATED_ORDERS[(round - 1) & 3]!;
}
