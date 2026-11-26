import { hashAscii, parseInitSequence } from '../../shared';
import {
  assertValidFocalLength,
  assertValidLensLabel,
  type LensMutationOutcome,
  type OpticalBench,
} from './bench';

const REMOVE_PATTERN = /^([a-zA-Z]+)-$/;
const UPSERT_PATTERN = /^([a-zA-Z]+)=([1-9])$/;

/** Polymorphic HASHMAP instruction acting on an `OpticalBench`. */
export interface LensInstruction {
  readonly label: string;
  readonly rawToken: string;
  readonly boxIndex: number;
  apply(bench: OpticalBench): LensMutationOutcome;
}

/** Instruction removing a lens with the matching label from its hashed box. */
export class RemoveLensInstruction implements LensInstruction {
  readonly label: string;

  constructor(label: string) {
    assertValidLensLabel(label);
    this.label = label;
    Object.freeze(this);
  }

  get boxIndex(): number {
    return hashAscii(this.label);
  }

  get rawToken(): string {
    return `${this.label}-`;
  }

  apply(bench: OpticalBench): LensMutationOutcome {
    return bench.remove(this.label);
  }
}

/** Instruction inserting or replacing a lens with a focal length in its hashed box. */
export class UpsertLensInstruction implements LensInstruction {
  readonly label: string;
  readonly focalLength: number;

  constructor(label: string, focalLength: number) {
    assertValidLensLabel(label);
    assertValidFocalLength(focalLength);
    this.label = label;
    this.focalLength = focalLength;
    Object.freeze(this);
  }

  get boxIndex(): number {
    return hashAscii(this.label);
  }

  get rawToken(): string {
    return `${this.label}=${this.focalLength}`;
  }

  apply(bench: OpticalBench): LensMutationOutcome {
    return bench.upsert(this.label, this.focalLength);
  }
}

/** Parses a single HASHMAP instruction token (`label-` or `label=focalLength`). */
export function parseLensInstruction(token: string): LensInstruction {
  const removeMatch = REMOVE_PATTERN.exec(token);
  if (removeMatch !== null) {
    return new RemoveLensInstruction(removeMatch[1]!);
  }
  const upsertMatch = UPSERT_PATTERN.exec(token);
  if (upsertMatch !== null) {
    return new UpsertLensInstruction(upsertMatch[1]!, Number(upsertMatch[2]!));
  }
  throw new RangeError(`Invalid lens instruction token "${token}"`);
}

/** Parses a comma-separated HASHMAP initialization sequence into frozen instructions. */
export function parseLensInstructions(raw: string): readonly LensInstruction[] {
  const tokens = parseInitSequence(raw);
  return Object.freeze(tokens.map(parseLensInstruction));
}
