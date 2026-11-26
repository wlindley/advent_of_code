import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { BeamWaveFrame } from './beamFrame';
import type { Contraption } from './contraption';
import {
  type BeamDirection,
  type BeamState,
  createBeamState,
  DIR_DC,
  DIR_DR,
  MASK_TO_DIR,
  outgoingMask,
  type TileCode,
} from './optics';

export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Reusable flat-queue wavefront BFS optical beam tracer over a `Contraption`. */
export class BeamTracer {
  readonly #contraption: Contraption;
  readonly #tiles: Uint8Array;
  readonly #width: number;
  readonly #height: number;
  readonly #visited: Uint8Array;
  readonly #queue: Int32Array;
  #head = 0;
  #tail = 0;
  #energized = 0;

  constructor(contraption: Contraption) {
    this.#contraption = contraption;
    this.#tiles = contraption.copyTiles();
    this.#width = contraption.width;
    this.#height = contraption.height;
    this.#visited = new Uint8Array(contraption.size);
    this.#queue = new Int32Array(4 * contraption.size);
  }

  /** Counts total energized cells reachable from `entry`. */
  countEnergized(entry: BeamState): number {
    this.#validateEntry(entry);
    this.#resetQueue(entry);
    while (this.#head < this.#tail) this.#expandWave();
    return this.#energized;
  }

  /** Traces sampled wavefront BFS snapshots from `entry` up to `options.maxSteps`. */
  traceWaves(entry: BeamState, options?: TraceOptions): readonly BeamWaveFrame[] {
    this.#validateEntry(entry);
    const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const totalWaves = this.#countWaves(entry);
    return this.#recordSampledWaves(entry, totalWaves, sampleTraceIndices(totalWaves, limit));
  }

  #validateEntry(entry: BeamState): void {
    if (!this.#contraption.inBounds(entry.row, entry.col)) {
      throw new RangeError(`Entry (${entry.row}, ${entry.col}) out of bounds for ${this.#height}x${this.#width}`);
    }
  }

  #resetQueue(entry: BeamState): void {
    this.#visited.fill(0);
    const idx = entry.row * this.#width + entry.col;
    // Energize the entry tile immediately; Wave 0 applies its optics before stepping.
    this.#visited[idx] = 1 << entry.dir;
    this.#energized = 1;
    this.#queue[0] = (idx << 2) | entry.dir;
    this.#head = 0;
    this.#tail = 1;
  }

  #expandWave(): void {
    const waveEnd = this.#tail;
    for (let i = this.#head; i < waveEnd; i += 1) {
      const packed = this.#queue[i]!;
      const cellIdx = packed >> 2;
      const dir = (packed & 3) as BeamDirection;
      const row = Math.floor(cellIdx / this.#width);
      const col = cellIdx - row * this.#width;
      let mask = outgoingMask(this.#tiles[cellIdx]! as TileCode, dir);
      while (mask !== 0) {
        const bit = mask & -mask;
        mask ^= bit;
        const outDir = MASK_TO_DIR[bit]! as BeamDirection;
        this.#enqueueStep(row + DIR_DR[outDir]!, col + DIR_DC[outDir]!, outDir, bit);
      }
    }
    this.#head = waveEnd;
  }

  #enqueueStep(row: number, col: number, dir: BeamDirection, bit: number): void {
    if (row < 0 || row >= this.#height || col < 0 || col >= this.#width) return;
    const nIdx = row * this.#width + col;
    const prevMask = this.#visited[nIdx]!;
    if ((prevMask & bit) !== 0) return;
    if (prevMask === 0) this.#energized += 1;
    this.#visited[nIdx] = prevMask | bit;
    this.#queue[this.#tail++] = (nIdx << 2) | dir;
  }

  #countWaves(entry: BeamState): number {
    this.#resetQueue(entry);
    let waves = 0;
    while (this.#head < this.#tail) {
      waves += 1;
      this.#expandWave();
    }
    return waves;
  }

  #recordSampledWaves(entry: BeamState, totalWaves: number, sampled: readonly number[]): readonly BeamWaveFrame[] {
    this.#resetQueue(entry);
    const frames: BeamWaveFrame[] = [];
    let cursor = 0;
    for (let wave = 0; wave < totalWaves; wave += 1) {
      if (sampled[cursor] === wave) {
        frames.push(
          new BeamWaveFrame(this.#visited, this.#height, this.#width, wave, totalWaves, entry, this.#snapshotFrontier()),
        );
        cursor += 1;
      }
      this.#expandWave();
    }
    return Object.freeze(frames);
  }

  #snapshotFrontier(): readonly BeamState[] {
    const frontier: BeamState[] = [];
    for (let i = this.#head; i < this.#tail; i += 1) {
      const packed = this.#queue[i]!;
      const cellIdx = packed >> 2;
      const row = Math.floor(cellIdx / this.#width);
      frontier.push(createBeamState(row, cellIdx - row * this.#width, (packed & 3) as BeamDirection));
    }
    return frontier;
  }
}
