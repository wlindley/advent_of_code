/** Immutable leaf node of a flat-depth-encoded snailfish binary pair tree. */
export class SnailfishLeaf {
  constructor(
    readonly value: number,
    readonly depth: number,
  ) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`Snailfish leaf value must be a non-negative safe integer, got ${value}`);
    }
    if (!Number.isSafeInteger(depth) || depth < 1) {
      throw new RangeError(`Snailfish leaf depth must be an integer >= 1, got ${depth}`);
    }
    Object.freeze(this);
  }
}

/** Computes snailfish tree magnitude directly from flat value and depth buffers. */
export function computeBufferMagnitude(
  values: readonly number[],
  depths: readonly number[],
): number {
  if (values.length !== depths.length) {
    throw new RangeError('Value and depth buffers must have identical length');
  }
  const valStack: number[] = [];
  const depthStack: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    valStack.push(values[i]!);
    depthStack.push(depths[i]!);
    while (depthStack.length >= 2 && depthStack[depthStack.length - 1] === depthStack[depthStack.length - 2]) {
      const right = valStack.pop()!;
      const left = valStack.pop()!;
      const depth = depthStack.pop()!;
      depthStack.pop();
      valStack.push(3 * left + 2 * right);
      depthStack.push(depth - 1);
    }
  }
  if (depthStack.length !== 1 || depthStack[0] !== 0) {
    throw new RangeError('Buffer does not represent a complete binary pair tree');
  }
  return valStack[0]!;
}

/** Formats a validated flat-depth leaf sequence back into bracketed `[L,R]` notation. */
export function formatSnailfish(leaves: readonly SnailfishLeaf[]): string {
  const textStack: string[] = [];
  const depthStack: number[] = [];
  for (const leaf of leaves) {
    textStack.push(String(leaf.value));
    depthStack.push(leaf.depth);
    while (depthStack.length >= 2 && depthStack[depthStack.length - 1] === depthStack[depthStack.length - 2]) {
      const right = textStack.pop()!;
      const left = textStack.pop()!;
      const depth = depthStack.pop()!;
      depthStack.pop();
      textStack.push(`[${left},${right}]`);
      depthStack.push(depth - 1);
    }
  }
  if (depthStack.length !== 1 || depthStack[0] !== 0) {
    throw new RangeError('Leaf sequence does not represent a complete binary pair tree');
  }
  return textStack[0]!;
}

function validateLeafTree(leaves: readonly SnailfishLeaf[]): void {
  const depthStack: number[] = [];
  for (const leaf of leaves) {
    depthStack.push(leaf.depth);
    while (depthStack.length >= 2 && depthStack[depthStack.length - 1] === depthStack[depthStack.length - 2]) {
      const depth = depthStack.pop()!;
      depthStack.pop();
      depthStack.push(depth - 1);
    }
  }
  if (depthStack.length !== 1 || depthStack[0] !== 0) {
    throw new RangeError('Snailfish leaf sequence does not form a valid binary pair tree');
  }
}

/** Immutable flat-depth representation of a snailfish number pair tree. */
export class SnailfishNumber {
  readonly leaves: readonly SnailfishLeaf[];

  constructor(leaves: readonly SnailfishLeaf[]) {
    validateLeafTree(leaves);
    this.leaves = Object.freeze([...leaves]);
    Object.freeze(this);
  }

  get leafCount(): number {
    return this.leaves.length;
  }

  get maxDepth(): number {
    let max = 0;
    for (const leaf of this.leaves) {
      if (leaf.depth > max) max = leaf.depth;
    }
    return max;
  }

  get magnitude(): number {
    return computeBufferMagnitude(
      this.leaves.map((leaf) => leaf.value),
      this.leaves.map((leaf) => leaf.depth),
    );
  }

  toString(): string {
    return formatSnailfish(this.leaves);
  }
}

/** Immutable non-empty list of snailfish numbers from a homework assignment. */
export class SnailfishHomework {
  readonly numbers: readonly SnailfishNumber[];

  constructor(numbers: readonly SnailfishNumber[]) {
    if (numbers.length === 0) {
      throw new RangeError('Snailfish homework must contain at least one number');
    }
    this.numbers = Object.freeze([...numbers]);
    Object.freeze(this);
  }

  get count(): number {
    return this.numbers.length;
  }
}
