export const REQUIRED_PASSPORT_FIELDS = Object.freeze([
  'byr',
  'iyr',
  'eyr',
  'hgt',
  'hcl',
  'ecl',
  'pid',
] as const);

export type RequiredPassportField = (typeof REQUIRED_PASSPORT_FIELDS)[number];

export const OPTIONAL_PASSPORT_FIELD = 'cid' as const;

export const STANDARD_PASSPORT_FIELDS = Object.freeze([
  ...REQUIRED_PASSPORT_FIELDS,
  OPTIONAL_PASSPORT_FIELD,
] as const);

export type StandardPassportField = (typeof STANDARD_PASSPORT_FIELDS)[number];

const TOKEN_PART_PATTERN = /^[^\s:]+$/;

function assertValidFieldToken(kind: string, text: string): void {
  if (!TOKEN_PART_PATTERN.test(text)) {
    throw new RangeError(`Passport ${kind} must be non-empty without whitespace or colons`);
  }
}

/** Immutable collection of key-value pairs for a single passport record. */
export class PassportRecord {
  readonly #fields: ReadonlyMap<string, string>;

  constructor(fields: ReadonlyMap<string, string>) {
    const copy = new Map<string, string>();
    for (const [key, value] of fields) {
      assertValidFieldToken('key', key);
      assertValidFieldToken('value', value);
      copy.set(key, value);
    }
    if (copy.size === 0) {
      throw new RangeError('PassportRecord must contain at least one field');
    }
    this.#fields = copy;
    Object.freeze(this);
  }

  get fieldCount(): number {
    return this.#fields.size;
  }

  get fieldKeys(): readonly string[] {
    return Object.freeze([...this.#fields.keys()]);
  }

  get entries(): readonly (readonly [string, string])[] {
    return Object.freeze([...this.#fields.entries()]);
  }

  hasField(key: string): boolean {
    return this.#fields.has(key);
  }

  fieldValue(key: string): string | undefined {
    return this.#fields.get(key);
  }
}

/** Immutable non-empty batch of parsed passport records. */
export class PassportBatch {
  readonly #records: readonly PassportRecord[];

  constructor(records: readonly PassportRecord[]) {
    if (records.length === 0) {
      throw new RangeError('PassportBatch must contain at least one record');
    }
    this.#records = Object.freeze([...records]);
    Object.freeze(this);
  }

  get records(): readonly PassportRecord[] {
    return this.#records;
  }

  get size(): number {
    return this.#records.length;
  }
}

function parsePassportBlock(block: string, blockIndex: number): PassportRecord {
  const fields = new Map<string, string>();
  for (const token of block.trim().split(/\s+/)) {
    const colonIdx = token.indexOf(':');
    if (colonIdx <= 0 || colonIdx === token.length - 1 || token.indexOf(':', colonIdx + 1) !== -1) {
      throw new SyntaxError(`Malformed field token "${token}" in passport ${blockIndex + 1}`);
    }
    const key = token.slice(0, colonIdx);
    const value = token.slice(colonIdx + 1);
    if (fields.has(key)) {
      throw new SyntaxError(`Duplicate field "${key}" in passport ${blockIndex + 1}`);
    }
    fields.set(key, value);
  }
  return new PassportRecord(fields);
}

/** Parses blank-line-separated passport records of whitespace-delimited `key:value` tokens. */
export function parsePassportBatch(raw: string): PassportBatch {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) {
    throw new RangeError('Input must contain at least one passport');
  }
  const blocks = normalized.split(/\n(?:[ \t]*\n)+/);
  return new PassportBatch(blocks.map(parsePassportBlock));
}
