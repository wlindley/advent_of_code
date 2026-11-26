/** Describes one element's circular relocation in terms of pre-removal and post-removal indices. */
export interface MoveSpan {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly steps: number;
}

/** Computes effective non-negative circular move steps modulo (ringLength - 1). */
export function computeCircularSteps(delta: bigint, ringLength: number): number {
  if (!Number.isSafeInteger(ringLength) || ringLength <= 0) {
    throw new RangeError(`ringLength must be a positive safe integer, got ${ringLength}`);
  }
  if (ringLength <= 2) return 0;
  const period = BigInt(ringLength - 1);
  const rem = delta % period;
  return Number(rem < 0n ? rem + period : rem);
}

interface BlockLocation {
  readonly blockIndex: number;
  readonly offset: number;
}

/**
 * Sqrt-decomposed circular list supporting O(sqrt(N)) index lookup and move operations
 * while preserving original IDs 0..length-1.
 */
export class SqrtCircularList {
  readonly length: number;
  private readonly blockSize: number;
  private readonly blocks: number[][];
  private readonly blockOf: Int32Array;

  constructor(length: number, blockSize?: number) {
    if (!Number.isSafeInteger(length) || length < 1) {
      throw new RangeError(`length must be a positive safe integer, got ${length}`);
    }
    const resolvedBlock = blockSize === undefined ? Math.max(1, Math.ceil(Math.sqrt(length))) : blockSize;
    if (!Number.isSafeInteger(resolvedBlock) || resolvedBlock < 1) {
      throw new RangeError(`blockSize must be a positive safe integer, got ${resolvedBlock}`);
    }
    this.length = length;
    this.blockSize = resolvedBlock;
    this.blocks = [];
    this.blockOf = new Int32Array(length);
    for (let id = 0; id < length; id += 1) {
      const b = Math.floor(id / resolvedBlock);
      if (b === this.blocks.length) this.blocks.push([]);
      this.blocks[b]!.push(id);
      this.blockOf[id] = b;
    }
  }

  private locateId(id: number): BlockLocation {
    if (!Number.isInteger(id) || id < 0 || id >= this.length) {
      throw new RangeError(`Element id out of range [0, ${this.length - 1}]: ${id}`);
    }
    const blockIndex = this.blockOf[id]!;
    return { blockIndex, offset: this.blocks[blockIndex]!.indexOf(id) };
  }

  private globalIndexOf(loc: BlockLocation): number {
    let index = loc.offset;
    for (let b = 0; b < loc.blockIndex; b += 1) {
      index += this.blocks[b]!.length;
    }
    return index;
  }

  private reindexBlocksFrom(startBlock: number): void {
    for (let b = startBlock; b < this.blocks.length; b += 1) {
      for (const item of this.blocks[b]!) {
        this.blockOf[item] = b;
      }
    }
  }

  private splitBlock(blockIndex: number): void {
    const block = this.blocks[blockIndex]!;
    const right = block.splice(Math.floor(block.length / 2));
    this.blocks.splice(blockIndex + 1, 0, right);
    this.reindexBlocksFrom(blockIndex + 1);
  }

  private insertAt(id: number, toIndex: number): void {
    const lastBlock = this.blocks.length - 1;
    let remaining = toIndex;
    let targetBlock = lastBlock;
    for (let b = 0; b < lastBlock; b += 1) {
      const len = this.blocks[b]!.length;
      if (remaining < len) {
        targetBlock = b;
        break;
      }
      remaining -= len;
    }
    const block = this.blocks[targetBlock]!;
    block.splice(remaining, 0, id);
    this.blockOf[id] = targetBlock;
    if (block.length >= 2 * this.blockSize) {
      this.splitBlock(targetBlock);
    }
  }

  indexOf(id: number): number {
    return this.globalIndexOf(this.locateId(id));
  }

  move(id: number, delta: bigint): MoveSpan {
    const loc = this.locateId(id);
    const fromIndex = this.globalIndexOf(loc);
    const steps = computeCircularSteps(delta, this.length);
    if (steps === 0) {
      return Object.freeze({ fromIndex, toIndex: fromIndex, steps: 0 });
    }
    const sourceBlock = this.blocks[loc.blockIndex]!;
    sourceBlock.splice(loc.offset, 1);
    if (sourceBlock.length === 0) {
      this.blocks.splice(loc.blockIndex, 1);
      this.reindexBlocksFrom(loc.blockIndex);
    }
    const period = this.length - 1;
    const rawTarget = (fromIndex + steps) % period;
    const toIndex = rawTarget === 0 ? period : rawTarget;
    this.insertAt(id, toIndex);
    return Object.freeze({ fromIndex, toIndex, steps });
  }

  toOrder(): readonly number[] {
    const order: number[] = [];
    for (const block of this.blocks) {
      order.push(...block);
    }
    return Object.freeze(order);
  }
}
