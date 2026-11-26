/** Mutable memory abstraction backing an Intcode VM instance. */
export interface MemoryAccess {
  readonly size: number;
  read(address: bigint): bigint;
  write(address: bigint, value: bigint): void;
  snapshot(): readonly bigint[];
}

/** Encapsulated mutable BigInt memory tape with BigInt-first bounds checking. */
export class IntcodeMemory implements MemoryAccess {
  private readonly cells: bigint[];

  constructor(initialCells: readonly bigint[]) {
    if (initialCells.length < 1) {
      throw new RangeError('Intcode memory must contain at least one cell');
    }
    this.cells = [...initialCells];
  }

  get size(): number {
    return this.cells.length;
  }

  private assertAddress(address: bigint): number {
    if (address < 0n || address >= BigInt(this.cells.length)) {
      throw new RangeError(`Memory address out of bounds: ${address}`);
    }
    return Number(address);
  }

  read(address: bigint): bigint {
    return this.cells[this.assertAddress(address)]!;
  }

  write(address: bigint, value: bigint): void {
    this.cells[this.assertAddress(address)] = value;
  }

  snapshot(): readonly bigint[] {
    return Object.freeze([...this.cells]);
  }
}
