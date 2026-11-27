import { BufferedIoChannel, IntcodeMachine, type IntcodeProgram } from '../../shared/intcode';

export const DEFAULT_MAX_VM_STEPS = 10_000;

/** Read-only tractor beam coordinate probe interface. */
export interface BeamOracle {
  probe(x: number, y: number): boolean;
}

function validateCoord(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer, got ${value}`);
  }
}

function validateLimit(maxVmSteps: number | undefined): number {
  const limit = maxVmSteps ?? DEFAULT_MAX_VM_STEPS;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`maxVmSteps must be a positive integer, got ${limit}`);
  }
  return limit;
}

/**
 * Memoized Intcode VM oracle that evaluates tractor beam pull state at `(x, y)`.
 * Each uncached query boots a fresh VM instance because the Day 19 ROM halts after one coordinate.
 */
export class IntcodeBeamOracle implements BeamOracle {
  private readonly program: IntcodeProgram;
  private readonly maxVmSteps: number;
  private readonly cache = new Map<string, boolean>();
  private misses = 0;

  constructor(program: IntcodeProgram, maxVmSteps?: number) {
    this.program = program;
    this.maxVmSteps = validateLimit(maxVmSteps);
  }

  get probeCount(): number {
    return this.misses;
  }

  probe(x: number, y: number): boolean {
    validateCoord('x', x);
    validateCoord('y', y);
    const key = `${x},${y}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    this.misses += 1;
    const io = new BufferedIoChannel([BigInt(x), BigInt(y)]);
    const machine = IntcodeMachine.fromCompleteProgram(this.program, { io });
    machine.run(this.maxVmSteps);
    if (machine.status !== 'halted') {
      throw new Error(`Beam probe VM did not halt at (${x}, ${y}); status=${machine.status}`);
    }
    const outputs = machine.snapshotOutputs();
    if (outputs.length !== 1) {
      throw new Error(`Beam probe VM must emit exactly 1 output, got ${outputs.length}`);
    }
    const value = outputs[0];
    if (value !== 0n && value !== 1n) {
      throw new Error(`Beam probe output must be 0 or 1, got ${value}`);
    }
    const pulled = value === 1n;
    this.cache.set(key, pulled);
    return pulled;
  }
}
