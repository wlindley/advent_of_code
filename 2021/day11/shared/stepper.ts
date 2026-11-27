import { DIRS_8, Grid2D } from '../../../shared/core';
import { FLASH_THRESHOLD, OctopusGrid } from './grid';

/** Mutable BFS flash-cascade simulator operating on flat typed arrays. */
export class OctopusStepper {
  readonly rows: number;
  readonly cols: number;
  private readonly energy: Uint8Array;
  private readonly queue: Int32Array;
  private steps = 0;

  constructor(grid: OctopusGrid) {
    this.rows = grid.rows;
    this.cols = grid.cols;
    this.energy = new Uint8Array(grid.size);
    this.queue = new Int32Array(grid.size);
    for (let r = 0; r < grid.rows; r += 1) {
      for (let c = 0; c < grid.cols; c += 1) {
        this.energy[r * grid.cols + c] = grid.at(r, c);
      }
    }
  }

  get size(): number {
    return this.rows * this.cols;
  }

  get stepCount(): number {
    return this.steps;
  }

  step(): number {
    const initialTail = this.seedInitialFlashes();
    const totalFlashes = this.propagateFlashes(initialTail);
    for (let i = 0; i < totalFlashes; i += 1) {
      this.energy[this.queue[i]!] = 0;
    }
    this.steps += 1;
    return totalFlashes;
  }

  snapshot(): OctopusGrid {
    return new OctopusGrid(new Grid2D(this.rows, this.cols, Array.from(this.energy)));
  }

  private seedInitialFlashes(): number {
    let tail = 0;
    for (let idx = 0; idx < this.energy.length; idx += 1) {
      const next = this.energy[idx]! + 1;
      this.energy[idx] = next;
      // Enqueue only on the exact crossing into FLASH_THRESHOLD so each cell flashes at most once.
      if (next === FLASH_THRESHOLD) {
        this.queue[tail] = idx;
        tail += 1;
      }
    }
    return tail;
  }

  private propagateFlashes(initialTail: number): number {
    let head = 0;
    let tail = initialTail;
    while (head < tail) {
      const idx = this.queue[head]!;
      head += 1;
      const row = Math.floor(idx / this.cols);
      const col = idx - row * this.cols;
      for (const [dr, dc] of DIRS_8) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
        const nIdx = nr * this.cols + nc;
        const next = this.energy[nIdx]! + 1;
        this.energy[nIdx] = next;
        if (next === FLASH_THRESHOLD) {
          this.queue[tail] = nIdx;
          tail += 1;
        }
      }
    }
    return tail;
  }
}
