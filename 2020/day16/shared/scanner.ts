import { bigintLog2, IntervalUnion } from '../../../shared/core';
import { FieldRule, Ticket, TicketDocument } from './model';

/** Immutable scan result for a single ticket against the global valid interval union. */
export class TicketScanResult {
  readonly ticket: Ticket;
  readonly invalidIndices: readonly number[];

  constructor(ticket: Ticket, invalidIndices: readonly number[]) {
    for (const idx of invalidIndices) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= ticket.fieldCount) {
        throw new RangeError(`Invalid field index ${idx} for ticket width ${ticket.fieldCount}`);
      }
    }
    this.ticket = ticket;
    this.invalidIndices = Object.freeze([...invalidIndices]);
    Object.freeze(this);
  }

  /** Valid iff no field index failed the union check (avoids the invalid-0n sum trap). */
  get isValid(): boolean {
    return this.invalidIndices.length === 0;
  }

  /** Number of invalid fields on this ticket. */
  get invalidCount(): number {
    return this.invalidIndices.length;
  }

  /** Sum of all invalid field values on this ticket in bigint. */
  get invalidSum(): bigint {
    let total = 0n;
    for (const idx of this.invalidIndices) total += this.ticket.values[idx]!;
    return total;
  }
}

/** Scans a single ticket against `validUnion`. */
export function scanTicket(ticket: Ticket, validUnion: IntervalUnion): TicketScanResult {
  const invalidIndices: number[] = [];
  for (let i = 0; i < ticket.fieldCount; i += 1) {
    if (!validUnion.contains(ticket.values[i]!)) invalidIndices.push(i);
  }
  return new TicketScanResult(ticket, invalidIndices);
}

/** Scans all nearby tickets in a `TicketDocument` against its coalesced `validUnion`. */
export function scanNearbyTickets(doc: TicketDocument): readonly TicketScanResult[] {
  const union = doc.validUnion;
  return Object.freeze(doc.nearbyTickets.map((ticket) => scanTicket(ticket, union)));
}

export interface FieldAssignment {
  readonly ruleIndex: number;
  readonly ruleName: string;
  readonly column: number;
}

/** Immutable snapshot of a single degree-1 peeling round. */
export class PeelingStep {
  readonly round: number;
  readonly locked: readonly FieldAssignment[];
  readonly remainingMasks: readonly bigint[];

  constructor(round: number, locked: readonly FieldAssignment[], remainingMasks: readonly bigint[]) {
    this.round = round;
    this.locked = Object.freeze(locked.map((entry) => Object.freeze({ ...entry })));
    this.remainingMasks = Object.freeze([...remainingMasks]);
    Object.freeze(this);
  }
}

/** Immutable result of full degree-1 constraint peeling across all fields. */
export class FieldResolution {
  readonly initialMasks: readonly bigint[];
  readonly steps: readonly PeelingStep[];

  constructor(initialMasks: readonly bigint[], steps: readonly PeelingStep[]) {
    this.initialMasks = Object.freeze([...initialMasks]);
    this.steps = Object.freeze([...steps]);
    Object.freeze(this);
  }

  get fieldCount(): number {
    return this.initialMasks.length;
  }

  /** Derived mapping from rule name to resolved 0-based ticket column. */
  get columnByField(): ReadonlyMap<string, number> {
    const map = new Map<string, number>();
    for (const step of this.steps) {
      for (const entry of step.locked) map.set(entry.ruleName, entry.column);
    }
    return map;
  }
}

function columnMatchesRule(rule: FieldRule, col: number, tickets: readonly Ticket[]): boolean {
  for (const ticket of tickets) {
    if (!rule.matches(ticket.values[col]!)) return false;
  }
  return true;
}

/** Builds per-rule bigint compatibility bitmasks where bit `c` indicates column `c` fits all tickets. */
export function buildCompatibilityMasks(
  rules: readonly FieldRule[],
  validTickets: readonly Ticket[],
): readonly bigint[] {
  if (rules.length === 0) throw new Error('buildCompatibilityMasks requires at least one rule');
  if (validTickets.length === 0) throw new Error('buildCompatibilityMasks requires at least one ticket');
  for (const ticket of validTickets) {
    if (ticket.fieldCount !== rules.length) {
      throw new Error(`Ticket width ${ticket.fieldCount} does not match ${rules.length} rules`);
    }
  }
  const masks = rules.map((rule) => {
    let mask = 0n;
    for (let col = 0; col < rules.length; col += 1) {
      if (columnMatchesRule(rule, col, validTickets)) mask |= 1n << BigInt(col);
    }
    return mask;
  });
  return Object.freeze(masks);
}

function findUnitAssignments(
  rules: readonly FieldRule[],
  masks: readonly bigint[],
  lockedCols: readonly number[],
  assignedColsMask: bigint,
): readonly FieldAssignment[] {
  const locked: FieldAssignment[] = [];
  let roundColsMask = 0n;
  for (let r = 0; r < rules.length; r += 1) {
    if (lockedCols[r] !== -1) continue;
    const avail = masks[r]! & ~assignedColsMask;
    if (avail !== 0n && (avail & (avail - 1n)) === 0n) {
      const col = bigintLog2(avail);
      const colBit = 1n << BigInt(col);
      if ((roundColsMask & colBit) !== 0n) {
        throw new Error(`Multiple rules uniquely forced onto column ${col}`);
      }
      roundColsMask |= colBit;
      locked.push({ ruleIndex: r, ruleName: rules[r]!.name, column: col });
    }
  }
  return locked;
}

/** Iteratively peels degree-1 rule-column pairs using bigint masks and `bigintLog2`. */
export function resolveFieldMapping(
  rules: readonly FieldRule[],
  validTickets: readonly Ticket[],
): FieldResolution {
  const initialMasks = buildCompatibilityMasks(rules, validTickets);
  const masks = [...initialMasks];
  const lockedCols = new Array<number>(rules.length).fill(-1);
  const steps: PeelingStep[] = [];
  let assignedMask = 0n;
  let lockedCount = 0;

  while (lockedCount < rules.length) {
    const locked = findUnitAssignments(rules, masks, lockedCols, assignedMask);
    if (locked.length === 0) {
      throw new Error('Field peeling stalled: ambiguous or unsatisfiable compatibility masks');
    }
    for (const entry of locked) {
      lockedCols[entry.ruleIndex] = entry.column;
      assignedMask |= 1n << BigInt(entry.column);
    }
    lockedCount += locked.length;
    for (let r = 0; r < rules.length; r += 1) {
      masks[r] = lockedCols[r] !== -1 ? 1n << BigInt(lockedCols[r]!) : masks[r]! & ~assignedMask;
    }
    steps.push(new PeelingStep(steps.length + 1, locked, masks));
  }
  return new FieldResolution(initialMasks, steps);
}
