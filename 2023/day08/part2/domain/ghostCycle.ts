import type { WastelandNetwork } from '../../shared';
import { Congruence } from './crt';

export interface GhostHit {
  readonly step: number;
  readonly nodeId: number;
}

export function isGhostStartLabel(label: string): boolean {
  return label.endsWith('A');
}

export function isGhostTargetLabel(label: string): boolean {
  return label.endsWith('Z');
}

/** Collects all node IDs whose labels end with `"A"` in ascending network order. */
export function collectGhostStartIds(network: WastelandNetwork): readonly number[] {
  const startIds: number[] = [];
  for (let id = 0; id < network.nodeCount; id += 1) {
    if (isGhostStartLabel(network.labelOf(id))) {
      startIds.push(id);
    }
  }
  if (startIds.length === 0) {
    throw new Error('No ghost start nodes ending in "A" found');
  }
  return Object.freeze(startIds);
}

function validateHits(
  hits: readonly GhostHit[],
  minStep: number,
  maxStep: number,
  kind: string,
): readonly GhostHit[] {
  let prev = minStep - 1;
  return Object.freeze(
    hits.map((hit) => {
      if (!Number.isInteger(hit.step) || hit.step <= prev || hit.step > maxStep) {
        throw new RangeError(
          `${kind} hit step ${hit.step} must strictly increase within [${minStep}, ${maxStep}]`,
        );
      }
      prev = hit.step;
      return Object.freeze({ step: hit.step, nodeId: hit.nodeId });
    }),
  );
}

/** Immutable rho-shape walk decomposition (prefix μ, cycle c, and **Z hits) for one ghost. */
export class GhostCycle {
  readonly network: WastelandNetwork;
  readonly startId: number;
  readonly prefixLength: number;
  readonly cycleLength: number;
  readonly preCycleHits: readonly GhostHit[];
  readonly cycleHits: readonly GhostHit[];

  constructor(
    network: WastelandNetwork,
    startId: number,
    prefixLength: number,
    cycleLength: number,
    preCycleHits: readonly GhostHit[],
    cycleHits: readonly GhostHit[],
  ) {
    network.labelOf(startId);
    if (!Number.isInteger(prefixLength) || prefixLength < 0) {
      throw new RangeError(`prefixLength must be a non-negative integer, got ${prefixLength}`);
    }
    if (!Number.isInteger(cycleLength) || cycleLength < 1) {
      throw new RangeError(`cycleLength must be a positive integer, got ${cycleLength}`);
    }
    this.network = network;
    this.startId = startId;
    this.prefixLength = prefixLength;
    this.cycleLength = cycleLength;
    this.preCycleHits = validateHits(preCycleHits, 1, prefixLength - 1, 'pre-cycle');
    this.cycleHits = validateHits(
      cycleHits,
      Math.max(1, prefixLength),
      prefixLength + cycleLength - 1,
      'cycle',
    );
    Object.freeze(this);
  }

  get startLabel(): string {
    return this.network.labelOf(this.startId);
  }

  get cycleEnd(): number {
    return this.prefixLength + this.cycleLength;
  }

  get congruences(): readonly Congruence[] {
    const mod = BigInt(this.cycleLength);
    return Object.freeze(this.cycleHits.map((hit) => new Congruence(BigInt(hit.step), mod)));
  }

  get isAlignedLcm(): boolean {
    return this.cycleHits.length === 1 && this.cycleHits[0]!.step % this.cycleLength === 0;
  }

  isTargetAt(step: number): boolean {
    if (!Number.isInteger(step) || step < 1) return false;
    if (step < this.prefixLength) {
      return this.preCycleHits.some((hit) => hit.step === step);
    }
    const canonical = this.prefixLength + ((step - this.prefixLength) % this.cycleLength);
    return this.cycleHits.some((hit) => hit.step === canonical);
  }
}

/** Extracts the exact `(node, ip)` rho-cycle and all `**Z` hit steps for one ghost start node. */
export function extractGhostCycle(network: WastelandNetwork, startId: number): GhostCycle {
  const startLabel = network.labelOf(startId);
  if (!isGhostStartLabel(startLabel)) {
    throw new Error(`Ghost start node "${startLabel}" must end with "A"`);
  }
  const tapeLen = network.tapeLength;
  const firstSeen = new Int32Array(network.nodeCount * tapeLen).fill(-1);
  const hits: GhostHit[] = [];
  let node = startId;
  let ip = 0;
  let step = 0;

  while (firstSeen[node * tapeLen + ip] === -1) {
    firstSeen[node * tapeLen + ip] = step;
    if (isGhostTargetLabel(network.labelOf(node))) {
      hits.push({ step, nodeId: node });
    }
    node = network.stepFrom(node, ip);
    ip = ip + 1 === tapeLen ? 0 : ip + 1;
    step += 1;
  }

  const prefixLength = firstSeen[node * tapeLen + ip]!;
  const cycleLength = step - prefixLength;
  const preCycleHits = hits.filter((hit) => hit.step < prefixLength);
  const cycleHits = hits.filter((hit) => hit.step >= prefixLength);
  return new GhostCycle(network, startId, prefixLength, cycleLength, preCycleHits, cycleHits);
}
