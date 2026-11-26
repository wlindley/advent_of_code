import type { BeamState } from './optics';

/** Immutable snapshot of a single wavefront BFS step over a contraption grid. */
export class BeamWaveFrame {
  readonly #visitedMasks: Uint8Array;
  readonly height: number;
  readonly width: number;
  readonly wave: number;
  readonly totalWaves: number;
  readonly entry: BeamState;
  readonly frontier: readonly BeamState[];

  constructor(
    visitedMasks: Uint8Array,
    height: number,
    width: number,
    wave: number,
    totalWaves: number,
    entry: BeamState,
    frontier: readonly BeamState[],
  ) {
    if (!Number.isInteger(height) || height < 1 || !Number.isInteger(width) || width < 1) {
      throw new RangeError(`Dimensions must be positive integers, got ${height}x${width}`);
    }
    if (visitedMasks.length !== height * width) {
      throw new RangeError(
        `visitedMasks length ${visitedMasks.length} does not match ${height * width}`,
      );
    }
    if (!Number.isInteger(totalWaves) || totalWaves < 1) {
      throw new RangeError(`totalWaves must be a positive integer, got ${totalWaves}`);
    }
    if (!Number.isInteger(wave) || wave < 0 || wave >= totalWaves) {
      throw new RangeError(`wave ${wave} out of range [0, ${totalWaves})`);
    }
    this.#visitedMasks = visitedMasks.slice();
    this.height = height;
    this.width = width;
    this.wave = wave;
    this.totalWaves = totalWaves;
    this.entry = entry;
    this.frontier = Object.freeze(frontier.slice());
    Object.freeze(this);
  }

  /** Dynamically counts energized cells from the underlying visited bitmask buffer. */
  get energizedCount(): number {
    let count = 0;
    for (let i = 0; i < this.#visitedMasks.length; i += 1) {
      if (this.#visitedMasks[i]! !== 0) count += 1;
    }
    return count;
  }

  /** Returns the incoming-direction bitmask accumulated at `(row, col)`. */
  maskAt(row: number, col: number): number {
    if (
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      row >= this.height ||
      col < 0 ||
      col >= this.width
    ) {
      throw new RangeError(`Cell (${row}, ${col}) out of bounds for ${this.height}x${this.width}`);
    }
    return this.#visitedMasks[row * this.width + col]!;
  }

  /** Returns `true` when at least one beam has entered `(row, col)`. */
  isEnergized(row: number, col: number): boolean {
    return this.maskAt(row, col) !== 0;
  }
}
