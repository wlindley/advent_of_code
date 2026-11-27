import { ClosedInterval, IntervalUnion } from '../../../shared/core';

/** Immutable ticket field rule composed of one or more closed integer intervals. */
export class FieldRule {
  readonly name: string;
  readonly ranges: readonly ClosedInterval[];

  constructor(name: string, ranges: readonly ClosedInterval[]) {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error('Field rule name must not be empty');
    }
    if (ranges.length === 0) {
      throw new Error(`Field rule "${trimmed}" must define at least one interval`);
    }
    this.name = trimmed;
    this.ranges = Object.freeze([...ranges]);
    Object.freeze(this);
  }

  /** Returns true if `value` falls within any interval of this rule. */
  matches(value: bigint): boolean {
    return this.ranges.some((range) => range.contains(value));
  }
}

/** Immutable sequence of non-negative bigint field values on a single ticket. */
export class Ticket {
  readonly values: readonly bigint[];

  constructor(values: readonly bigint[]) {
    if (values.length === 0) {
      throw new Error('Ticket must contain at least one field value');
    }
    for (const value of values) {
      if (value < 0n) {
        throw new RangeError(`Ticket field value must be non-negative, got ${value}`);
      }
    }
    this.values = Object.freeze([...values]);
    Object.freeze(this);
  }

  /** Number of fields present on this ticket. */
  get fieldCount(): number {
    return this.values.length;
  }
}

function validateUniqueRuleNames(rules: readonly FieldRule[]): void {
  const seen = new Set<string>();
  for (const rule of rules) {
    if (seen.has(rule.name)) {
      throw new Error(`Duplicate field rule name: "${rule.name}"`);
    }
    seen.add(rule.name);
  }
}

/** Immutable parsed ticket translation input with rules, your ticket, and nearby tickets. */
export class TicketDocument {
  readonly rules: readonly FieldRule[];
  readonly yourTicket: Ticket;
  readonly nearbyTickets: readonly Ticket[];

  constructor(rules: readonly FieldRule[], yourTicket: Ticket, nearbyTickets: readonly Ticket[]) {
    if (rules.length === 0) throw new Error('TicketDocument must contain at least one rule');
    validateUniqueRuleNames(rules);
    if (nearbyTickets.length === 0) throw new Error('TicketDocument must contain at least one nearby ticket');
    if (yourTicket.fieldCount !== rules.length) {
      throw new Error(`yourTicket has ${yourTicket.fieldCount} fields, expected ${rules.length}`);
    }
    for (let i = 0; i < nearbyTickets.length; i += 1) {
      if (nearbyTickets[i]!.fieldCount !== rules.length) {
        throw new Error(`nearbyTickets[${i}] has ${nearbyTickets[i]!.fieldCount} fields, expected ${rules.length}`);
      }
    }
    this.rules = Object.freeze([...rules]);
    this.yourTicket = yourTicket;
    this.nearbyTickets = Object.freeze([...nearbyTickets]);
    Object.freeze(this);
  }

  /** Number of fields defined by the rules and tickets. */
  get fieldCount(): number {
    return this.rules.length;
  }

  /** Coalesced interval union across all field rules, computed on demand. */
  get validUnion(): IntervalUnion {
    return new IntervalUnion(this.rules.flatMap((rule) => rule.ranges));
  }
}

function parseFieldRule(line: string): FieldRule {
  const match = /^([^:]+):\s*(.+)$/.exec(line);
  if (!match) {
    throw new Error(`Invalid field rule line: "${line}"`);
  }
  const ranges = match[2]!.split(/\s+or\s+/).map((token) => {
    const bounds = /^(\d+)-(\d+)$/.exec(token.trim());
    if (!bounds) {
      throw new Error(`Invalid interval token "${token}" in rule "${match[1]!}"`);
    }
    return new ClosedInterval(BigInt(bounds[1]!), BigInt(bounds[2]!));
  });
  return new FieldRule(match[1]!, ranges);
}

function parseTicketLine(line: string): Ticket {
  const values = line.split(',').map((cell) => {
    const token = cell.trim();
    if (!/^\d+$/.test(token)) {
      throw new Error(`Invalid ticket cell value: "${token}"`);
    }
    return BigInt(token);
  });
  return new Ticket(values);
}

function splitSectionLines(section: string): readonly string[] {
  return section.split('\n').map((line) => line.trim());
}

/** Parses a 3-section ticket translation document into a validated `TicketDocument`. */
export function parseTicketDocument(raw: string): TicketDocument {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (normalized.length === 0) throw new Error('Ticket input must not be empty');
  const sections = normalized.split(/\n\s*\n/);
  if (sections.length !== 3) {
    throw new Error(`Expected 3 sections (rules, your ticket, nearby tickets), got ${sections.length}`);
  }
  const rules = splitSectionLines(sections[0]!).map(parseFieldRule);
  const yourLines = splitSectionLines(sections[1]!);
  if (yourLines.length !== 2 || yourLines[0] !== 'your ticket:') {
    throw new Error('Second section must start with "your ticket:" followed by 1 ticket line');
  }
  const nearbyLines = splitSectionLines(sections[2]!);
  if (nearbyLines.length < 2 || nearbyLines[0] !== 'nearby tickets:') {
    throw new Error('Third section must start with "nearby tickets:" followed by >= 1 ticket lines');
  }
  const yourTicket = parseTicketLine(yourLines[1]!);
  const nearbyTickets = nearbyLines.slice(1).map(parseTicketLine);
  return new TicketDocument(rules, yourTicket, nearbyTickets);
}
