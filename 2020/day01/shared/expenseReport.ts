export interface ExpenseEntry {
  readonly originalIndex: number;
  readonly value: number;
}

/** Total order for expense entries: ascending value, then original input position. */
export function compareExpenseEntries(a: ExpenseEntry, b: ExpenseEntry): number {
  return a.value - b.value || a.originalIndex - b.originalIndex;
}

function freezeValidatedEntry(entry: ExpenseEntry): ExpenseEntry {
  if (!Number.isInteger(entry.originalIndex) || entry.originalIndex < 0) {
    throw new RangeError(`Expense originalIndex must be a non-negative integer, got ${entry.originalIndex}`);
  }
  if (!Number.isSafeInteger(entry.value) || entry.value < 0) {
    throw new RangeError(`Expense value must be a non-negative safe integer, got ${entry.value}`);
  }
  return Object.freeze({ originalIndex: entry.originalIndex, value: entry.value });
}

/** Validated, immutable collection of expense entries preserving input order. */
export class ExpenseReport {
  readonly #entries: readonly ExpenseEntry[];

  constructor(entries: readonly ExpenseEntry[]) {
    if (entries.length === 0) {
      throw new RangeError('Expense report must contain at least one entry');
    }
    this.#entries = Object.freeze(entries.map(freezeValidatedEntry));
    Object.freeze(this);
  }

  get entries(): readonly ExpenseEntry[] {
    return this.#entries;
  }

  get size(): number {
    return this.#entries.length;
  }

  sortedEntries(): readonly ExpenseEntry[] {
    return Object.freeze([...this.#entries].sort(compareExpenseEntries));
  }
}

/** Parses newline-delimited non-negative integer expense lines into an `ExpenseReport`. */
export function parseExpenseReport(raw: string): ExpenseReport {
  const entries: ExpenseEntry[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) continue;
    if (!/^\d+$/.test(trimmed)) {
      throw new SyntaxError(`Invalid expense line: "${trimmed}"`);
    }
    entries.push({ originalIndex: entries.length, value: Number(trimmed) });
  }
  return new ExpenseReport(entries);
}
