/** Union-Find (Disjoint Set Union) with union-by-size and iterative path compression. */
export class DisjointSet {
  // Negative values store -componentSize at roots; non-negative values store parent index.
  private readonly nodes: Int32Array;
  private components: number;

  constructor(count: number) {
    if (!Number.isSafeInteger(count) || count < 0 || count > 0x7fffffff) {
      throw new RangeError(`DisjointSet count must be an integer in [0, 2^31 - 1], got ${count}`);
    }
    this.nodes = new Int32Array(count).fill(-1);
    this.components = count;
  }

  get size(): number {
    return this.nodes.length;
  }

  get componentCount(): number {
    return this.components;
  }

  find(index: number): number {
    if (!Number.isInteger(index) || index < 0 || index >= this.nodes.length) {
      throw new RangeError(`Index ${index} out of bounds for size ${this.nodes.length}`);
    }
    let root = index;
    while (this.nodes[root]! >= 0) {
      root = this.nodes[root]!;
    }
    let curr = index;
    while (curr !== root) {
      const parent = this.nodes[curr]!;
      this.nodes[curr] = root;
      curr = parent;
    }
    return root;
  }

  union(a: number, b: number): boolean {
    let rootA = this.find(a);
    let rootB = this.find(b);
    if (rootA === rootB) return false;

    // More negative means larger component size; attach smaller tree under larger root.
    if (this.nodes[rootA]! > this.nodes[rootB]!) {
      const tmp = rootA;
      rootA = rootB;
      rootB = tmp;
    }
    this.nodes[rootA]! += this.nodes[rootB]!;
    this.nodes[rootB] = rootA;
    this.components -= 1;
    return true;
  }

  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b);
  }

  sizeOf(index: number): number {
    return -this.nodes[this.find(index)]!;
  }

  componentSizes(): number[] {
    const sizes: number[] = [];
    for (let i = 0; i < this.nodes.length; i += 1) {
      const val = this.nodes[i]!;
      if (val < 0) sizes.push(-val);
    }
    return sizes;
  }
}
