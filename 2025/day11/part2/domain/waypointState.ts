export type WaypointMask = 0 | 1 | 2 | 3;

export const MASK_NEITHER: WaypointMask = 0;
export const MASK_DAC: WaypointMask = 1;
export const MASK_FFT: WaypointMask = 2;
export const MASK_BOTH: WaypointMask = 3;

/** Immutable 4-state path-count tuple partitioned by visited waypoint bitmask. */
export class WaypointCounts {
  static readonly ZERO = new WaypointCounts(0n, 0n, 0n, 0n);

  readonly neither: bigint;
  readonly dacOnly: bigint;
  readonly fftOnly: bigint;
  readonly both: bigint;

  constructor(neither: bigint, dacOnly: bigint, fftOnly: bigint, both: bigint) {
    if (neither < 0n || dacOnly < 0n || fftOnly < 0n || both < 0n) {
      throw new RangeError('WaypointCounts components must be non-negative');
    }
    this.neither = neither;
    this.dacOnly = dacOnly;
    this.fftOnly = fftOnly;
    this.both = both;
    Object.freeze(this);
  }

  get total(): bigint {
    return this.neither + this.dacOnly + this.fftOnly + this.both;
  }

  static unit(mask: WaypointMask): WaypointCounts {
    const counts: [bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n];
    counts[mask] = 1n;
    return new WaypointCounts(counts[0], counts[1], counts[2], counts[3]);
  }

  /** Folds incoming counts into this node while promoting each bucket by enterMask. */
  accumulate(incoming: WaypointCounts, enterMask: WaypointMask): WaypointCounts {
    const out: [bigint, bigint, bigint, bigint] = [this.neither, this.dacOnly, this.fftOnly, this.both];
    const src: readonly [bigint, bigint, bigint, bigint] = [incoming.neither, incoming.dacOnly, incoming.fftOnly, incoming.both];
    for (let m = 0; m < 4; m++) {
      out[(m | enterMask) as WaypointMask] += src[m]!;
    }
    return new WaypointCounts(out[0], out[1], out[2], out[3]);
  }
}

/** Returns the 2-bit waypoint mask unlocked upon entering `node`. */
export function waypointMaskFor(node: string, dac: string, fft: string): WaypointMask {
  return ((node === dac ? MASK_DAC : 0) | (node === fft ? MASK_FFT : 0)) as WaypointMask;
}

/** Computes an accurate log2 for arbitrarily large positive bigints using the top 53 bits. */
export function bigintLog2(value: bigint): number {
  if (value <= 0n) {
    throw new RangeError(`bigintLog2 requires a positive bigint, got ${value}`);
  }
  // Right-shifting down to 53 bits avoids Number(value) Infinity overflow for huge DAG path counts.
  const shift = Math.max(0, value.toString(2).length - 53);
  return shift + Math.log2(Number(value >> BigInt(shift)));
}
