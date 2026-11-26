/** Immutable shortest-path search outcome and per-cell settled heat map. */
export class CrucibleSearchResult {
  readonly #cellSettledHeat: Int32Array;
  readonly height: number;
  readonly width: number;
  readonly turnCells: readonly number[];

  constructor(cellSettledHeat: Int32Array, height: number, width: number, turnCells: readonly number[]) {
    if (!Number.isInteger(height) || height < 1 || !Number.isInteger(width) || width < 1) {
      throw new RangeError(`Invalid grid dimensions ${height}x${width}`);
    }
    if (cellSettledHeat.length !== height * width) {
      throw new RangeError(`Expected ${height * width} settled entries, got ${cellSettledHeat.length}`);
    }
    if (turnCells.length < 1) {
      throw new RangeError('turnCells must contain at least the start cell');
    }
    this.#cellSettledHeat = cellSettledHeat.slice();
    this.height = height;
    this.width = width;
    this.turnCells = Object.freeze([...turnCells]);
    Object.freeze(this);
  }

  get goalHeat(): number {
    return this.#cellSettledHeat[this.height * this.width - 1]!;
  }

  get legCount(): number {
    return this.turnCells.length - 1;
  }

  get turnCount(): number {
    return Math.max(0, this.turnCells.length - 2);
  }

  settledHeatAt(r: number, c: number): number {
    if (r < 0 || r >= this.height || c < 0 || c >= this.width) {
      throw new RangeError(`Cell (${r}, ${c}) is out of bounds for ${this.height}x${this.width}`);
    }
    return this.#cellSettledHeat[r * this.width + c]!;
  }

  copySettledHeat(): Int32Array {
    return this.#cellSettledHeat.slice();
  }

  countSettledAt(threshold: number): number {
    let count = 0;
    for (let i = 0; i < this.#cellSettledHeat.length; i += 1) {
      const heat = this.#cellSettledHeat[i]!;
      if (heat >= 0 && heat <= threshold) count += 1;
    }
    return count;
  }

  expandPath(): readonly number[] {
    const cells: number[] = [this.turnCells[0]!];
    for (let i = 1; i < this.turnCells.length; i += 1) {
      appendLegCells(cells, this.turnCells[i - 1]!, this.turnCells[i]!, this.width);
    }
    return Object.freeze(cells);
  }
}

function appendLegCells(cells: number[], fromCell: number, toCell: number, width: number): void {
  let r = Math.floor(fromCell / width);
  let c = fromCell % width;
  const endR = Math.floor(toCell / width);
  const endC = toCell % width;
  const dr = Math.sign(endR - r);
  const dc = Math.sign(endC - c);
  while (r !== endR || c !== endC) {
    r += dr;
    c += dc;
    cells.push(r * width + c);
  }
}

/** Single sampled wavefront snapshot at a cumulative heat threshold. */
export class CrucibleTraceFrame {
  readonly result: CrucibleSearchResult;
  readonly heatThreshold: number;
  readonly stepIndex: number;
  readonly totalSteps: number;

  constructor(result: CrucibleSearchResult, heatThreshold: number, stepIndex: number, totalSteps: number) {
    this.result = result;
    this.heatThreshold = heatThreshold;
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    Object.freeze(this);
  }

  get settledCount(): number {
    return this.result.countSettledAt(this.heatThreshold);
  }

  get isComplete(): boolean {
    return this.stepIndex === this.totalSteps - 1;
  }
}
