export type Turn = 'L' | 'R';

export interface NetworkNodeSpec {
  readonly label: string;
  readonly leftId: number;
  readonly rightId: number;
}

interface IndexedNodes {
  readonly labels: readonly string[];
  readonly leftIds: Int32Array;
  readonly rightIds: Int32Array;
  readonly labelToId: ReadonlyMap<string, number>;
}

function validateIndex(index: number, length: number, name: string): number {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new RangeError(`${name} ${index} out of bounds [0, ${length - 1}]`);
  }
  return index;
}

function encodeTurns(turns: readonly Turn[]): Uint8Array {
  if (turns.length === 0) throw new Error('Instruction tape must not be empty');
  const encoded = new Uint8Array(turns.length);
  for (let i = 0; i < turns.length; i += 1) {
    const turn = turns[i];
    if (turn !== 'L' && turn !== 'R') {
      throw new Error(`Invalid turn "${String(turn)}" at index ${i}`);
    }
    encoded[i] = turn === 'L' ? 0 : 1;
  }
  return encoded;
}

function indexNodes(nodes: readonly NetworkNodeSpec[]): IndexedNodes {
  const count = nodes.length;
  if (count === 0) throw new Error('Network must contain at least one node');
  const labels: string[] = [];
  const leftIds = new Int32Array(count);
  const rightIds = new Int32Array(count);
  const labelToId = new Map<string, number>();

  for (let i = 0; i < count; i += 1) {
    const { label, leftId, rightId } = nodes[i]!;
    if (label.length === 0) throw new Error(`Node at index ${i} must have a non-empty label`);
    if (labelToId.has(label)) throw new Error(`Duplicate node label "${label}"`);
    labelToId.set(label, i);
    labels.push(label);
    leftIds[i] = validateIndex(leftId, count, `leftId for "${label}"`);
    rightIds[i] = validateIndex(rightId, count, `rightId for "${label}"`);
  }

  return { labels: Object.freeze(labels), leftIds, rightIds, labelToId };
}

/** Immutable compact graph + cyclic L/R instruction tape for Haunted Wasteland walks. */
export class WastelandNetwork {
  readonly #turns: Uint8Array;
  readonly #labels: readonly string[];
  readonly #leftIds: Int32Array;
  readonly #rightIds: Int32Array;
  readonly #labelToId: ReadonlyMap<string, number>;

  constructor(turns: readonly Turn[], nodes: readonly NetworkNodeSpec[]) {
    this.#turns = encodeTurns(turns);
    const indexed = indexNodes(nodes);
    this.#labels = indexed.labels;
    this.#leftIds = indexed.leftIds;
    this.#rightIds = indexed.rightIds;
    this.#labelToId = indexed.labelToId;
    Object.freeze(this);
  }

  get tapeLength(): number {
    return this.#turns.length;
  }

  get nodeCount(): number {
    return this.#labels.length;
  }

  get labels(): readonly string[] {
    return this.#labels;
  }

  turnAt(ip: number): Turn {
    const idx = validateIndex(ip, this.#turns.length, 'Tape index');
    return this.#turns[idx] === 0 ? 'L' : 'R';
  }

  leftOf(nodeId: number): number {
    return this.#leftIds[validateIndex(nodeId, this.#labels.length, 'Node id')]!;
  }

  rightOf(nodeId: number): number {
    return this.#rightIds[validateIndex(nodeId, this.#labels.length, 'Node id')]!;
  }

  labelOf(nodeId: number): string {
    return this.#labels[validateIndex(nodeId, this.#labels.length, 'Node id')]!;
  }

  idOf(label: string): number | undefined {
    return this.#labelToId.get(label);
  }

  requireId(label: string): number {
    const id = this.#labelToId.get(label);
    if (id === undefined) throw new Error(`Required node "${label}" not found`);
    return id;
  }

  stepFrom(nodeId: number, ip: number): number {
    return this.turnAt(ip) === 'L' ? this.leftOf(nodeId) : this.rightOf(nodeId);
  }

  /** Walks from `startId` until `isTarget(node)` holds, detecting unreachable `(node, ip)` cycles. */
  findFirstTarget(startId: number, isTarget: (nodeId: number) => boolean): number {
    let current = validateIndex(startId, this.#labels.length, 'Start node id');
    const tapeLen = this.#turns.length;
    const visited = new Uint8Array(this.#labels.length * tapeLen);
    let ip = 0;
    let steps = 0;

    while (!isTarget(current)) {
      const stateKey = current * tapeLen + ip;
      if (visited[stateKey] === 1) {
        throw new Error(`Target unreachable from "${this.#labels[startId]}" (cycle at "${this.#labels[current]}" ip=${ip})`);
      }
      visited[stateKey] = 1;
      current = this.#turns[ip] === 0 ? this.#leftIds[current]! : this.#rightIds[current]!;
      ip = ip + 1 === tapeLen ? 0 : ip + 1;
      steps += 1;
    }

    return steps;
  }
}
