const MACHINE_LINE_RE = /^\[([.#]+)\]\s+((?:\(\d+(?:,\d+)*\)\s+)+)\{(\d+(?:,\d+)*)\}$/;

/**
 * Immutable factory machine specification with indicator target, button wirings, and joltages.
 */
export class FactoryMachine {
  readonly targetLights: readonly boolean[];
  readonly buttons: readonly (readonly number[])[];
  readonly joltageRequirements: readonly number[];

  constructor(
    targetLights: readonly boolean[],
    buttons: readonly (readonly number[])[],
    joltageRequirements: readonly number[],
  ) {
    const lightCount = targetLights.length;
    if (lightCount < 1) throw new RangeError('FactoryMachine requires at least 1 indicator light');
    if (buttons.length < 1) throw new RangeError('FactoryMachine requires at least 1 button');
    if (joltageRequirements.length !== lightCount) {
      throw new RangeError(`Joltage length (${joltageRequirements.length}) must match lightCount (${lightCount})`);
    }
    for (const j of joltageRequirements) {
      if (!Number.isSafeInteger(j) || j < 0) {
        throw new RangeError(`Invalid joltage requirement: ${j}`);
      }
    }
    const frozenButtons = buttons.map((btn, bi) => {
      if (btn.length < 1) throw new RangeError(`Button ${bi} must toggle at least 1 light`);
      const seen = new Set<number>();
      for (const idx of btn) {
        if (!Number.isSafeInteger(idx) || idx < 0 || idx >= lightCount) {
          throw new RangeError(`Button ${bi} light index ${idx} out of bounds [0, ${lightCount})`);
        }
        if (seen.has(idx)) throw new Error(`Button ${bi} contains duplicate light index ${idx}`);
        seen.add(idx);
      }
      return Object.freeze([...btn]);
    });

    this.targetLights = Object.freeze([...targetLights]);
    this.buttons = Object.freeze(frozenButtons);
    this.joltageRequirements = Object.freeze([...joltageRequirements]);
    Object.freeze(this);
  }

  get lightCount(): number { return this.targetLights.length; }
  get buttonCount(): number { return this.buttons.length; }

  /** Bitmask where bit `l` is set iff indicator light `l` must end ON. */
  get targetMask(): bigint {
    let mask = 0n;
    for (let l = 0; l < this.targetLights.length; l += 1) {
      if (this.targetLights[l]) mask |= 1n << BigInt(l);
    }
    return mask;
  }

  /** Bitmasks per button where entry `b` has bit `l` set iff button `b` toggles light `l`. */
  get buttonMasks(): readonly bigint[] {
    return Object.freeze(
      this.buttons.map((btn) => btn.reduce((mask, l) => mask | (1n << BigInt(l)), 0n)),
    );
  }
}

/** Parses newline-delimited factory machine specifications, ignoring blank lines. */
export function parseMachines(raw: string): readonly FactoryMachine[] {
  const machines: FactoryMachine[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '') continue;
    const match = MACHINE_LINE_RE.exec(line);
    if (!match) throw new Error(`Malformed machine specification: ${line}`);
    const lights = [...match[1]!].map((ch) => ch === '#');
    const buttons = match[2]!.trim().split(/\s+/).map((tok) => tok.slice(1, -1).split(',').map(Number));
    const joltages = match[3]!.split(',').map(Number);
    machines.push(new FactoryMachine(lights, buttons, joltages));
  }
  if (machines.length === 0) throw new Error('Input contains no factory machines');
  return Object.freeze(machines);
}
