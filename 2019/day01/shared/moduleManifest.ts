import { assertValidMass } from './fuelPolicy';

/** Immutable manifest of validated non-negative integer spacecraft module masses. */
export class ModuleManifest {
  readonly masses: readonly number[];

  constructor(masses: readonly number[]) {
    if (masses.length === 0) {
      throw new Error('Module manifest must contain at least one module mass');
    }
    const validated: number[] = [];
    for (const mass of masses) {
      assertValidMass(mass);
      validated.push(mass);
    }
    this.masses = Object.freeze(validated);
    Object.freeze(this);
  }

  get count(): number {
    return this.masses.length;
  }

  get totalMass(): number {
    let total = 0;
    for (const mass of this.masses) {
      total += mass;
    }
    return total;
  }

  get maxMass(): number {
    let max = 0;
    for (const mass of this.masses) {
      if (mass > max) max = mass;
    }
    return max;
  }
}

/** Parses newline-delimited non-negative integer module masses, ignoring blank lines. */
export function parseModuleMasses(raw: string): ModuleManifest {
  const lines = raw.split(/\r?\n/);
  const masses: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    if (!/^\d+$/.test(trimmed)) {
      throw new Error(`Invalid module mass on line ${i + 1}: "${trimmed}"`);
    }
    masses.push(Number(trimmed));
  }
  return new ModuleManifest(masses);
}
