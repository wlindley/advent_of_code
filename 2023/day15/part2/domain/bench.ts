import { HASH_BUCKET_COUNT, hashAscii } from '../../shared';

const LENS_LABEL_PATTERN = /^[a-zA-Z]+$/;

/** Validates that a lens label consists exclusively of one or more ASCII letters. */
export function assertValidLensLabel(label: string): void {
  if (!LENS_LABEL_PATTERN.test(label)) {
    throw new RangeError(`Lens label must be non-empty ASCII letters, got "${label}"`);
  }
}

/** Validates that a lens focal length is an integer in `[1, 9]`. */
export function assertValidFocalLength(focalLength: number): void {
  if (!Number.isInteger(focalLength) || focalLength < 1 || focalLength > 9) {
    throw new RangeError(`Focal length must be an integer in [1, 9], got ${focalLength}`);
  }
}

export type LensMutationOutcome =
  | { readonly kind: 'inserted'; readonly slot: number }
  | { readonly kind: 'replaced'; readonly slot: number; readonly previousFocalLength: number }
  | { readonly kind: 'removed'; readonly slot: number; readonly previousFocalLength: number }
  | { readonly kind: 'noop' };

/** Immutable lens value object storing label and focal length. */
export class LensEntry {
  readonly label: string;
  readonly focalLength: number;

  constructor(label: string, focalLength: number) {
    assertValidLensLabel(label);
    assertValidFocalLength(focalLength);
    this.label = label;
    this.focalLength = focalLength;
    Object.freeze(this);
  }
}

/** Immutable snapshot of a single lens box at a point in time. */
export class LensBoxSnapshot {
  readonly boxIndex: number;
  readonly lenses: readonly LensEntry[];

  constructor(boxIndex: number, lenses: readonly LensEntry[]) {
    if (!Number.isInteger(boxIndex) || boxIndex < 0 || boxIndex >= HASH_BUCKET_COUNT) {
      throw new RangeError(`Box index must be an integer in [0, 255], got ${boxIndex}`);
    }
    const seen = new Set<string>();
    for (const lens of lenses) {
      if (seen.has(lens.label)) {
        throw new RangeError(`Duplicate lens label "${lens.label}" in box ${boxIndex}`);
      }
      seen.add(lens.label);
    }
    this.boxIndex = boxIndex;
    this.lenses = Object.freeze([...lenses]);
    Object.freeze(this);
  }

  get focusingPower(): number {
    const boxFactor = this.boxIndex + 1;
    let total = 0;
    for (let i = 0; i < this.lenses.length; i += 1) {
      total += boxFactor * (i + 1) * this.lenses[i]!.focalLength;
    }
    return total;
  }
}

function findLensSlot(
  box: ReadonlyMap<string, number>,
  label: string,
): { readonly slot: number; readonly focalLength: number } | undefined {
  let slot = 0;
  for (const [entryLabel, focalLength] of box) {
    if (entryLabel === label) {
      return { slot, focalLength };
    }
    slot += 1;
  }
  return undefined;
}

/** Encapsulates the 256 ordered HASHMAP lens boxes with in-place replacement and slot shifting. */
export class OpticalBench {
  private readonly boxes: Map<string, number>[];

  constructor() {
    this.boxes = Array.from({ length: HASH_BUCKET_COUNT }, () => new Map<string, number>());
    Object.freeze(this);
  }

  upsert(label: string, focalLength: number): LensMutationOutcome {
    assertValidLensLabel(label);
    assertValidFocalLength(focalLength);
    const box = this.boxes[hashAscii(label)]!;
    const existing = findLensSlot(box, label);
    // Map.set updates in place when the key exists and appends to the back when new.
    box.set(label, focalLength);
    if (existing !== undefined) {
      return Object.freeze({
        kind: 'replaced',
        slot: existing.slot,
        previousFocalLength: existing.focalLength,
      });
    }
    return Object.freeze({ kind: 'inserted', slot: box.size - 1 });
  }

  remove(label: string): LensMutationOutcome {
    assertValidLensLabel(label);
    const box = this.boxes[hashAscii(label)]!;
    const existing = findLensSlot(box, label);
    if (existing === undefined) {
      return Object.freeze({ kind: 'noop' });
    }
    box.delete(label);
    return Object.freeze({
      kind: 'removed',
      slot: existing.slot,
      previousFocalLength: existing.focalLength,
    });
  }

  snapshotOccupiedBoxes(): readonly LensBoxSnapshot[] {
    const snapshots: LensBoxSnapshot[] = [];
    for (let boxIndex = 0; boxIndex < this.boxes.length; boxIndex += 1) {
      const box = this.boxes[boxIndex]!;
      if (box.size === 0) continue;
      const lenses: LensEntry[] = [];
      for (const [label, focalLength] of box) {
        lenses.push(new LensEntry(label, focalLength));
      }
      snapshots.push(new LensBoxSnapshot(boxIndex, lenses));
    }
    return Object.freeze(snapshots);
  }

  get occupiedBoxCount(): number {
    let count = 0;
    for (const box of this.boxes) {
      if (box.size > 0) count += 1;
    }
    return count;
  }

  get totalLensCount(): number {
    let count = 0;
    for (const box of this.boxes) {
      count += box.size;
    }
    return count;
  }

  get focusingPower(): number {
    let total = 0;
    for (let boxIndex = 0; boxIndex < this.boxes.length; boxIndex += 1) {
      let slot = 1;
      for (const focalLength of this.boxes[boxIndex]!.values()) {
        total += (boxIndex + 1) * slot * focalLength;
        slot += 1;
      }
    }
    return total;
  }
}
