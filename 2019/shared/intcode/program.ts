const INTEGER_TOKEN_RE = /^-?\d+$/;

/** Address-value pair used to patch an immutable Intcode program before execution. */
export interface MemoryPatch {
  readonly address: bigint;
  readonly value: bigint;
}

function assertProgramAddress(address: bigint, length: number): number {
  if (address < 0n || address >= BigInt(length)) {
    throw new RangeError(`Program address out of bounds: ${address}`);
  }
  return Number(address);
}

/** Immutable parsed Intcode memory image with BigInt-indexed reads and non-mutating patches. */
export class IntcodeProgram {
  readonly cells: readonly bigint[];

  constructor(cells: readonly bigint[]) {
    if (cells.length < 1) {
      throw new RangeError('Intcode program must contain at least one cell');
    }
    this.cells = Object.freeze([...cells]);
    Object.freeze(this);
  }

  get length(): number {
    return this.cells.length;
  }

  at(address: bigint): bigint {
    return this.cells[assertProgramAddress(address, this.cells.length)]!;
  }

  withPatches(patches: readonly MemoryPatch[]): IntcodeProgram {
    const next = [...this.cells];
    for (const patch of patches) {
      next[assertProgramAddress(patch.address, next.length)] = patch.value;
    }
    return new IntcodeProgram(next);
  }
}

/** Parses a comma-separated Intcode integer tape into a frozen IntcodeProgram. */
export function parseIntcodeProgram(raw: string): IntcodeProgram {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Intcode input is empty');
  }
  const tokens = trimmed.split(',');
  const cells: bigint[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!.trim();
    if (!INTEGER_TOKEN_RE.test(token)) {
      throw new Error(`Invalid Intcode integer at position ${i}: "${token}"`);
    }
    cells.push(BigInt(token));
  }
  return new IntcodeProgram(cells);
}
