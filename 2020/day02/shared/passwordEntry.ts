const ENTRY_PATTERN = /^(\d+)-(\d+)\s+([a-z]):\s+([a-z]+)$/;
const LETTER_PATTERN = /^[a-z]$/;
const PASSWORD_PATTERN = /^[a-z]+$/;

/** Immutable, validated password database record `(first, second, letter, password)`. */
export class PasswordEntry {
  readonly #first: number;
  readonly #second: number;
  readonly #letter: string;
  readonly #password: string;

  constructor(first: number, second: number, letter: string, password: string) {
    if (!Number.isSafeInteger(first) || first < 1) {
      throw new RangeError(`first bound must be a safe integer >= 1, got ${first}`);
    }
    if (!Number.isSafeInteger(second) || second < first) {
      throw new RangeError(`second bound must be a safe integer >= ${first}, got ${second}`);
    }
    if (!LETTER_PATTERN.test(letter)) {
      throw new RangeError(`letter must be a single lowercase a-z character, got "${letter}"`);
    }
    if (!PASSWORD_PATTERN.test(password)) {
      throw new RangeError(`password must be non-empty lowercase a-z, got "${password}"`);
    }
    this.#first = first;
    this.#second = second;
    this.#letter = letter;
    this.#password = password;
    Object.freeze(this);
  }

  get first(): number {
    return this.#first;
  }

  get second(): number {
    return this.#second;
  }

  get letter(): string {
    return this.#letter;
  }

  get password(): string {
    return this.#password;
  }
}

/** Validated, immutable collection of password entries preserving input order. */
export class PasswordDatabase {
  readonly #entries: readonly PasswordEntry[];

  constructor(entries: readonly PasswordEntry[]) {
    if (entries.length === 0) {
      throw new RangeError('Password database must contain at least one entry');
    }
    this.#entries = Object.freeze([...entries]);
    Object.freeze(this);
  }

  get entries(): readonly PasswordEntry[] {
    return this.#entries;
  }

  get size(): number {
    return this.#entries.length;
  }
}

/** Parses newline-delimited `<first>-<second> <letter>: <password>` lines into a `PasswordDatabase`. */
export function parsePasswordDatabase(raw: string): PasswordDatabase {
  const entries: PasswordEntry[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) continue;
    const match = ENTRY_PATTERN.exec(trimmed);
    if (!match) {
      throw new SyntaxError(`Invalid password entry line: "${trimmed}"`);
    }
    entries.push(new PasswordEntry(Number(match[1]!), Number(match[2]!), match[3]!, match[4]!));
  }
  return new PasswordDatabase(entries);
}
