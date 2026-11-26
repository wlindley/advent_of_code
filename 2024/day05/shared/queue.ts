import { assertPageNumber, PageOrderRule, PageOrderRules } from './rules';

/** Immutable non-empty odd-length sequence of distinct positive page numbers. */
export class PrintUpdate {
  readonly pages: readonly number[];

  constructor(pages: readonly number[]) {
    if (pages.length === 0) throw new RangeError('PrintUpdate must contain at least one page');
    if (pages.length % 2 === 0) {
      throw new RangeError(`PrintUpdate must have an odd number of pages, got ${pages.length}`);
    }
    const seen = new Set<number>();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]!;
      assertPageNumber(page, `pages[${i}]`);
      if (seen.has(page)) throw new RangeError(`Duplicate page ${page} in PrintUpdate`);
      seen.add(page);
    }
    this.pages = Object.freeze([...pages]);
    Object.freeze(this);
  }

  get middlePage(): number {
    return this.pages[(this.pages.length - 1) / 2]!;
  }
}

/** Validated print queue pairing ordering rules with one or more updates. */
export class PrintQueue {
  readonly rules: PageOrderRules;
  readonly updates: readonly PrintUpdate[];

  constructor(rules: PageOrderRules, updates: readonly PrintUpdate[]) {
    if (updates.length === 0) throw new RangeError('PrintQueue must contain at least one update');
    this.rules = rules;
    this.updates = Object.freeze([...updates]);
    Object.freeze(this);
  }
}

function parseRuleLine(line: string): PageOrderRule {
  const match = /^\s*(\d+)\s*\|\s*(\d+)\s*$/.exec(line);
  if (!match) throw new Error(`Invalid rule line: "${line}"`);
  return new PageOrderRule(Number(match[1]!), Number(match[2]!));
}

function parseUpdateLine(line: string): PrintUpdate {
  const tokens = line.split(',');
  const pages: number[] = [];
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw new Error(`Invalid page token "${token}" in update line: "${line}"`);
    }
    pages.push(Number(trimmed));
  }
  return new PrintUpdate(pages);
}

/** Parses LF/CRLF print-queue input into a validated `PrintQueue`. */
export function parsePrintQueue(raw: string): PrintQueue {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) throw new Error('Print queue input is empty');
  const sections = normalized.split(/\n[ \t]*\n/);
  if (sections.length !== 2) {
    throw new Error(`Expected rules and updates sections separated by a blank line, found ${sections.length}`);
  }
  const rules: PageOrderRule[] = [];
  for (const line of sections[0]!.split('\n')) rules.push(parseRuleLine(line));
  const updates: PrintUpdate[] = [];
  for (const line of sections[1]!.split('\n')) updates.push(parseUpdateLine(line));
  return new PrintQueue(new PageOrderRules(rules), updates);
}
