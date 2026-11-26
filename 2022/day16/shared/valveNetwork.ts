export const START_VALVE_NAME = 'AA';

const VALVE_LINE_RE =
  /^Valve ([A-Z]+) has flow rate=(-?\d+); tunnels? leads? to valves? ([A-Z]+(?:, [A-Z]+)*)$/;

export interface ValveNode {
  readonly name: string;
  readonly flowRate: number;
  readonly tunnels: readonly string[];
}

function freezeNode(node: ValveNode, index: number, byName: Map<string, ValveNode>, indices: Map<string, number>): ValveNode {
  if (!node.name) throw new Error('Valve name must be non-empty');
  if (byName.has(node.name)) throw new Error(`Duplicate valve name: ${node.name}`);
  if (!Number.isSafeInteger(node.flowRate) || node.flowRate < 0) {
    throw new RangeError(`Invalid flow rate for ${node.name}: ${node.flowRate}`);
  }
  if (node.tunnels.length === 0) throw new Error(`Valve ${node.name} must have at least one tunnel`);
  const frozen: ValveNode = Object.freeze({
    name: node.name,
    flowRate: node.flowRate,
    tunnels: Object.freeze([...node.tunnels]),
  });
  byName.set(frozen.name, frozen);
  indices.set(frozen.name, index);
  return frozen;
}

/** Immutable validated valve-tunnel graph parsed from puzzle input. */
export class ValveNetwork {
  private readonly ordered: readonly ValveNode[];
  private readonly byName: Map<string, ValveNode>;
  private readonly indices: Map<string, number>;

  constructor(nodes: readonly ValveNode[]) {
    if (nodes.length === 0) throw new Error('ValveNetwork requires at least one valve');
    this.byName = new Map();
    this.indices = new Map();
    this.ordered = Object.freeze(nodes.map((n, i) => freezeNode(n, i, this.byName, this.indices)));
    for (const node of this.ordered) {
      for (const target of node.tunnels) {
        if (!this.byName.has(target)) {
          throw new Error(`Valve ${node.name} references unknown tunnel target: ${target}`);
        }
      }
    }
    Object.freeze(this);
  }

  get size(): number {
    return this.ordered.length;
  }

  get valves(): readonly ValveNode[] {
    return this.ordered;
  }

  has(name: string): boolean {
    return this.byName.has(name);
  }

  valve(name: string): ValveNode {
    const found = this.byName.get(name);
    if (!found) throw new Error(`Unknown valve: ${name}`);
    return found;
  }

  indexOf(name: string): number {
    const idx = this.indices.get(name);
    if (idx === undefined) throw new Error(`Unknown valve: ${name}`);
    return idx;
  }
}

function parseValveLine(line: string): ValveNode {
  const match = VALVE_LINE_RE.exec(line);
  if (!match) throw new Error(`Invalid valve line: ${line}`);
  return {
    name: match[1]!,
    flowRate: Number(match[2]!),
    tunnels: match[3]!.split(', '),
  };
}

/** Parses raw puzzle lines into a validated `ValveNetwork` containing `AA`. */
export function parseValveNetwork(raw: string): ValveNetwork {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) throw new Error('Valve input cannot be empty');
  const network = new ValveNetwork(lines.map(parseValveLine));
  if (!network.has(START_VALVE_NAME)) {
    throw new Error(`Missing required start valve: ${START_VALVE_NAME}`);
  }
  return network;
}
