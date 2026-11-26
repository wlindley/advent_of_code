import { DIRECTIONAL_KEYPAD, type Keypad, NUMERIC_KEYPAD } from './keypad';
import {
  ChainSolveResult, CodeComplexity, DIRECTIONAL_KEYS,
  type DirectionalKey, type DoorCode, KeypadConfig, type NumericKey,
} from './model';

/** Minimum human-press cost and winning command sequence for one keypad transition. */
export class TransitionChoice {
  readonly cost: bigint;
  readonly bestPath: string;

  constructor(cost: bigint, bestPath: string) {
    if (cost < 1n) throw new RangeError(`TransitionChoice cost must be >= 1n, got ${cost}`);
    if (bestPath.length === 0) throw new RangeError('TransitionChoice bestPath must be non-empty');
    this.cost = cost;
    this.bestPath = bestPath;
    Object.freeze(this);
  }
}

/** Precomputed DP table of optimal directional keypad transitions for depths 0..D. */
export class DirectionalCostTable {
  readonly directionalRobots: number;
  readonly #layers: readonly ReadonlyMap<string, TransitionChoice>[];

  constructor(directionalRobots: number, layers: readonly ReadonlyMap<string, TransitionChoice>[]) {
    this.directionalRobots = directionalRobots;
    this.#layers = Object.freeze([...layers]);
    Object.freeze(this);
  }

  #assertDepth(depth: number): void {
    if (!Number.isSafeInteger(depth) || depth < 0 || depth > this.directionalRobots) {
      throw new RangeError(`depth must be in [0, ${this.directionalRobots}], got ${depth}`);
    }
  }

  choiceOf(from: DirectionalKey, to: DirectionalKey, depth: number): TransitionChoice {
    this.#assertDepth(depth);
    const entry = this.#layers[depth]!.get(`${from}${to}`);
    if (!entry) throw new RangeError(`Unknown directional transition ${from} -> ${to}`);
    return entry;
  }

  costOf(from: DirectionalKey, to: DirectionalKey, depth: number): bigint {
    return this.choiceOf(from, to, depth).cost;
  }

  bestPathOf(from: DirectionalKey, to: DirectionalKey, depth: number): string {
    return this.choiceOf(from, to, depth).bestPath;
  }

  sequenceCost(sequence: string, depth: number): bigint {
    this.#assertDepth(depth);
    let prev: DirectionalKey = DIRECTIONAL_KEYPAD.startKey;
    let total = 0n;
    for (const ch of sequence) {
      const next = ch as DirectionalKey;
      total += this.costOf(prev, next, depth);
      prev = next;
    }
    return total;
  }

  maxCostAt(depth: number): bigint {
    this.#assertDepth(depth);
    let maxCost = 1n;
    for (const from of DIRECTIONAL_KEYS) {
      for (const to of DIRECTIONAL_KEYS) {
        const cost = this.costOf(from, to, depth);
        if (cost > maxCost) maxCost = cost;
      }
    }
    return maxCost;
  }
}

function pickBestPath(paths: readonly string[], table: DirectionalCostTable, depth: number): TransitionChoice {
  let bestPath = paths[0]!;
  let bestCost = table.sequenceCost(bestPath, depth);
  for (let i = 1; i < paths.length; i += 1) {
    const candidate = paths[i]!;
    const cost = table.sequenceCost(candidate, depth);
    if (cost < bestCost) { bestCost = cost; bestPath = candidate; }
  }
  return new TransitionChoice(bestCost, bestPath);
}

function buildDirectionalLayer(
  prevTable: DirectionalCostTable | null,
  depth: number,
  keypad: Keypad<DirectionalKey>,
): ReadonlyMap<string, TransitionChoice> {
  const layer = new Map<string, TransitionChoice>();
  for (const from of DIRECTIONAL_KEYS) {
    for (const to of DIRECTIONAL_KEYS) {
      const choice = prevTable === null
        ? new TransitionChoice(1n, to)
        : pickBestPath(keypad.candidatePaths(from, to), prevTable, depth - 1);
      layer.set(`${from}${to}`, choice);
    }
  }
  return layer;
}

/** Builds bottom-up DP cost table for `directionalRobots` directional robot layers. */
export function buildDirectionalCostTable(directionalRobots: number): DirectionalCostTable {
  const config = new KeypadConfig(directionalRobots);
  const layers: ReadonlyMap<string, TransitionChoice>[] = [buildDirectionalLayer(null, 0, DIRECTIONAL_KEYPAD)];
  for (let depth = 1; depth <= config.directionalRobots; depth += 1) {
    const partial = new DirectionalCostTable(depth - 1, layers);
    layers.push(buildDirectionalLayer(partial, depth, DIRECTIONAL_KEYPAD));
  }
  return new DirectionalCostTable(config.directionalRobots, layers);
}

/** Finds optimal numeric keypad transition from `from` to `to` under `table`. */
export function numericTransition(from: NumericKey, to: NumericKey, table: DirectionalCostTable): TransitionChoice {
  return pickBestPath(NUMERIC_KEYPAD.candidatePaths(from, to), table, table.directionalRobots);
}

/** Computes minimum human command length and complexity for a single `DoorCode`. */
export function solveDoorCode(code: DoorCode, table: DirectionalCostTable): CodeComplexity {
  let prev: NumericKey = NUMERIC_KEYPAD.startKey;
  let total = 0n;
  for (const key of code.keys) { total += numericTransition(prev, key, table).cost; prev = key; }
  return new CodeComplexity(code, total);
}

/** Solves all door codes under `config` and returns the aggregated `ChainSolveResult`. */
export function solveDoorCodes(codes: readonly DoorCode[], config: KeypadConfig): ChainSolveResult {
  const table = buildDirectionalCostTable(config.directionalRobots);
  return new ChainSolveResult(config, codes.map((code) => solveDoorCode(code, table)));
}

/** Reconstructs the optimal numeric keypad command string (Layer 0) for `code`. */
export function buildNumericSequence(code: DoorCode, table: DirectionalCostTable): string {
  let prev: NumericKey = NUMERIC_KEYPAD.startKey;
  let out = '';
  for (const key of code.keys) { out += numericTransition(prev, key, table).bestPath; prev = key; }
  return out;
}

function expandDirectionalLayer(sequence: string, table: DirectionalCostTable, depth: number): string {
  let prev: DirectionalKey = DIRECTIONAL_KEYPAD.startKey;
  let out = '';
  for (const ch of sequence) { const next = ch as DirectionalKey; out += table.bestPathOf(prev, next, depth); prev = next; }
  return out;
}

/** Reconstructs Layer 0..D command strings in descending DP depth order, or `null` past `maxOutputLength`. */
export function reconstructLayerSequences(
  code: DoorCode,
  table: DirectionalCostTable,
  maxOutputLength: number,
): readonly string[] | null {
  if (!Number.isSafeInteger(maxOutputLength) || maxOutputLength < 0) {
    throw new RangeError(`maxOutputLength must be a non-negative integer, got ${maxOutputLength}`);
  }
  const numericSeq = buildNumericSequence(code, table);
  if (table.sequenceCost(numericSeq, table.directionalRobots) > BigInt(maxOutputLength)) return null;
  const layers: string[] = [numericSeq];
  let current = numericSeq;
  for (let depth = table.directionalRobots; depth >= 1; depth -= 1) {
    current = expandDirectionalLayer(current, table, depth);
    layers.push(current);
  }
  return Object.freeze(layers);
}
