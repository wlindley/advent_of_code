/** Immutable 3-axis submarine navigation state (`horizontal`, `depth`, `aim`). */
export class SubmarinePose {
  static readonly ORIGIN = new SubmarinePose(0n, 0n, 0n);

  readonly horizontal: bigint;
  readonly depth: bigint;
  readonly aim: bigint;

  constructor(horizontal: bigint, depth: bigint, aim: bigint) {
    this.horizontal = horizontal;
    this.depth = depth;
    this.aim = aim;
    Object.freeze(this);
  }

  /** Computes `horizontal * depth` dynamically without storing derived state. */
  get product(): bigint {
    return this.horizontal * this.depth;
  }

  /** Returns a new frozen pose offset by the given axis deltas. */
  withDelta(dh: bigint, dd: bigint, da: bigint): SubmarinePose {
    return new SubmarinePose(this.horizontal + dh, this.depth + dd, this.aim + da);
  }
}
