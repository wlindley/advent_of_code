import {
  CRT_WIDTH,
  INITIAL_REGISTER_X,
  instructionCycles,
  type CpuProgram,
} from './program';

function assertSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
}

function assertMinInt(value: number, min: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new RangeError(`${label} must be an integer >= ${min}, got ${value}`);
  }
}

/** Immutable per-cycle CPU and CRT beam snapshot with dynamically computed getters. */
export class CycleSnapshot {
  readonly cycle: number;
  readonly instructionIndex: number;
  readonly subCycle: 1 | 2;
  readonly xDuring: number;
  readonly xAfter: number;

  constructor(
    cycle: number,
    instructionIndex: number,
    subCycle: 1 | 2,
    xDuring: number,
    xAfter: number,
  ) {
    assertMinInt(cycle, 1, 'cycle');
    assertMinInt(instructionIndex, 0, 'instructionIndex');
    if (subCycle !== 1 && subCycle !== 2) {
      throw new RangeError(`subCycle must be 1 or 2, got ${subCycle}`);
    }
    assertSafeInt(xDuring, 'xDuring');
    assertSafeInt(xAfter, 'xAfter');

    this.cycle = cycle;
    this.instructionIndex = instructionIndex;
    this.subCycle = subCycle;
    this.xDuring = xDuring;
    this.xAfter = xAfter;
    Object.freeze(this);
  }

  /** Zero-based CRT scanline row for this cycle. */
  get crtRow(): number {
    return Math.floor((this.cycle - 1) / CRT_WIDTH);
  }

  /** Zero-based horizontal CRT column (0..39) for this cycle. */
  get crtCol(): number {
    return (this.cycle - 1) % CRT_WIDTH;
  }

  /** True when the 3-pixel sprite centered at xDuring overlaps crtCol. */
  get spriteLit(): boolean {
    return Math.abs(this.crtCol - this.xDuring) <= 1;
  }

  /** Product of 1-based cycle and xDuring, guarded against safe-integer overflow. */
  get signalStrength(): number {
    const product = this.cycle * this.xDuring;
    if (!Number.isSafeInteger(product)) {
      throw new RangeError(`Signal strength overflowed safe integer range at cycle ${this.cycle}`);
    }
    return product;
  }

  /** True when the active instruction retired and modified X after this cycle. */
  get xChanged(): boolean {
    return this.xAfter !== this.xDuring;
  }
}

/** Compact typed-array execution timeline of a CpuProgram. */
export class CpuTimeline {
  private readonly xDuringByCycle: Float64Array;
  private readonly instructionIndexByCycle: Uint32Array;
  private readonly subCycleByCycle: Uint8Array;
  readonly finalX: number;

  private constructor(
    xDuringByCycle: Float64Array,
    instructionIndexByCycle: Uint32Array,
    subCycleByCycle: Uint8Array,
    finalX: number,
  ) {
    // Freeze only the outer wrapper; typed arrays must never be passed to Object.freeze().
    this.xDuringByCycle = xDuringByCycle;
    this.instructionIndexByCycle = instructionIndexByCycle;
    this.subCycleByCycle = subCycleByCycle;
    this.finalX = finalX;
    Object.freeze(this);
  }

  /** Total clock cycles recorded in this timeline. */
  get totalCycles(): number {
    return this.xDuringByCycle.length;
  }

  /** Minimum value reached by register X during or after execution. */
  get minX(): number {
    let min = this.finalX;
    for (let i = 0; i < this.xDuringByCycle.length; i += 1) {
      const value = this.xDuringByCycle[i]!;
      if (value < min) min = value;
    }
    return min;
  }

  /** Maximum value reached by register X during or after execution. */
  get maxX(): number {
    let max = this.finalX;
    for (let i = 0; i < this.xDuringByCycle.length; i += 1) {
      const value = this.xDuringByCycle[i]!;
      if (value > max) max = value;
    }
    return max;
  }

  private assertValidCycle(cycle: number): number {
    if (!Number.isInteger(cycle) || cycle < 1 || cycle > this.totalCycles) {
      throw new RangeError(`Cycle must be an integer in [1, ${this.totalCycles}], got ${cycle}`);
    }
    return cycle - 1;
  }

  /** Returns register X during the given 1-based cycle. */
  xDuringCycle(cycle: number): number {
    const idx = this.assertValidCycle(cycle);
    return this.xDuringByCycle[idx]!;
  }

  /** Returns register X after the given 1-based cycle completes. */
  xAfterCycle(cycle: number): number {
    const idx = this.assertValidCycle(cycle);
    return cycle === this.totalCycles ? this.finalX : this.xDuringByCycle[idx + 1]!;
  }

  /** Builds a frozen CycleSnapshot for the given 1-based cycle. */
  snapshotAt(cycle: number): CycleSnapshot {
    const idx = this.assertValidCycle(cycle);
    const subCycle = this.subCycleByCycle[idx] === 1 ? 1 : 2;
    return new CycleSnapshot(
      cycle,
      this.instructionIndexByCycle[idx]!,
      subCycle,
      this.xDuringByCycle[idx]!,
      this.xAfterCycle(cycle),
    );
  }

  /** Executes a CpuProgram from X = 1 into an immutable CpuTimeline. */
  static execute(program: CpuProgram): CpuTimeline {
    const totalCycles = program.totalCycles;
    const xDuringByCycle = new Float64Array(totalCycles);
    const instructionIndexByCycle = new Uint32Array(totalCycles);
    const subCycleByCycle = new Uint8Array(totalCycles);

    let x = INITIAL_REGISTER_X;
    let cursor = 0;
    for (let i = 0; i < program.instructions.length; i += 1) {
      const instr = program.instructions[i]!;
      const cycles = instructionCycles(instr);
      for (let sub = 1; sub <= cycles; sub += 1) {
        xDuringByCycle[cursor] = x;
        instructionIndexByCycle[cursor] = i;
        subCycleByCycle[cursor] = sub;
        cursor += 1;
      }
      if (instr.kind === 'addx') {
        const nextX = x + instr.delta;
        if (!Number.isSafeInteger(nextX)) {
          throw new RangeError(`Register X overflowed safe integer range at instruction ${i + 1}`);
        }
        x = nextX;
      }
    }
    return new CpuTimeline(xDuringByCycle, instructionIndexByCycle, subCycleByCycle, x);
  }
}
