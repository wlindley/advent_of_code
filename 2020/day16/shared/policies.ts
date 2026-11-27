import { ClosedInterval, sampleTraceIndices } from '../../../shared/core';
import { Ticket, TicketDocument } from './model';
import { FieldAssignment, resolveFieldMapping, scanNearbyTickets, TicketScanResult } from './scanner';

export const DEPARTURE_FIELD_PREFIX = 'departure';
export const DEFAULT_MAX_TRACE_STEPS = 80;
export type TicketPolicyId = 'error-rate' | 'departure-product';

export interface ErrorScanTraceFrameInit {
  readonly ticketIndex: number;
  readonly totalTickets: number;
  readonly validBands: readonly ClosedInterval[];
  readonly scanResult: TicketScanResult;
  readonly priorErrorSum: bigint;
  readonly priorInvalidCount: number;
}

/** Immutable trace snapshot for a single scanned nearby ticket. */
export class ErrorScanTraceFrame {
  readonly kind = 'error-scan' as const;
  readonly ticketIndex: number;
  readonly totalTickets: number;
  readonly validBands: readonly ClosedInterval[];
  readonly scanResult: TicketScanResult;
  readonly priorErrorSum: bigint;
  readonly priorInvalidCount: number;

  constructor(init: ErrorScanTraceFrameInit) {
    this.ticketIndex = init.ticketIndex;
    this.totalTickets = init.totalTickets;
    this.validBands = Object.freeze([...init.validBands]);
    this.scanResult = init.scanResult;
    this.priorErrorSum = init.priorErrorSum;
    this.priorInvalidCount = init.priorInvalidCount;
    Object.freeze(this);
  }

  get step(): number { return this.ticketIndex + 1; }
  get scannedCount(): number { return this.ticketIndex + 1; }
  get invalidTicketCount(): number { return this.priorInvalidCount + (this.scanResult.isValid ? 0 : 1); }
  get runningErrorRate(): bigint { return this.priorErrorSum + this.scanResult.invalidSum; }
  get isFinal(): boolean { return this.scannedCount === this.totalTickets; }
}

export interface FieldPeelingTraceFrameInit {
  readonly roundNumber: number;
  readonly totalRounds: number;
  readonly totalNearbyCount: number;
  readonly validNearbyCount: number;
  readonly ruleNames: readonly string[];
  readonly yourTicket: Ticket;
  readonly masks: readonly bigint[];
  readonly priorAssignments: readonly FieldAssignment[];
  readonly activeLocks: readonly FieldAssignment[];
}

function departureAssignments(frame: FieldPeelingTraceFrame): readonly FieldAssignment[] {
  return [...frame.priorAssignments, ...frame.activeLocks].filter((a) =>
    a.ruleName.startsWith(DEPARTURE_FIELD_PREFIX),
  );
}

/** Immutable trace snapshot for a single degree-1 peeling round. */
export class FieldPeelingTraceFrame {
  readonly kind = 'field-peeling' as const;
  readonly roundNumber: number;
  readonly totalRounds: number;
  readonly totalNearbyCount: number;
  readonly validNearbyCount: number;
  readonly ruleNames: readonly string[];
  readonly yourTicket: Ticket;
  readonly masks: readonly bigint[];
  readonly priorAssignments: readonly FieldAssignment[];
  readonly activeLocks: readonly FieldAssignment[];

  constructor(init: FieldPeelingTraceFrameInit) {
    this.roundNumber = init.roundNumber;
    this.totalRounds = init.totalRounds;
    this.totalNearbyCount = init.totalNearbyCount;
    this.validNearbyCount = init.validNearbyCount;
    this.ruleNames = Object.freeze([...init.ruleNames]);
    this.yourTicket = init.yourTicket;
    this.masks = Object.freeze([...init.masks]);
    this.priorAssignments = Object.freeze([...init.priorAssignments]);
    this.activeLocks = Object.freeze([...init.activeLocks]);
    Object.freeze(this);
  }

  get round(): number { return this.roundNumber; }
  get isFinal(): boolean { return this.roundNumber === this.totalRounds; }
  get discardedNearbyCount(): number { return this.totalNearbyCount - this.validNearbyCount; }
  get lockedDepartureCount(): number { return departureAssignments(this).length; }
  get departureProduct(): bigint {
    return departureAssignments(this).reduce((acc, a) => acc * this.yourTicket.values[a.column]!, 1n);
  }
}

export type TicketTraceFrame = ErrorScanTraceFrame | FieldPeelingTraceFrame;

export interface TicketPolicy<TTrace> {
  readonly id: TicketPolicyId;
  readonly label: string;
  solve(doc: TicketDocument): bigint;
  trace(doc: TicketDocument, maxSteps: number): readonly TTrace[];
}

export const ERROR_RATE_POLICY: TicketPolicy<ErrorScanTraceFrame> = Object.freeze({
  id: 'error-rate',
  label: 'Ticket Scanning Error Rate',
  solve(doc: TicketDocument): bigint {
    return scanNearbyTickets(doc).reduce((total, scan) => total + scan.invalidSum, 0n);
  },
  trace(doc: TicketDocument, maxSteps: number): readonly ErrorScanTraceFrame[] {
    const validBands = doc.validUnion.intervals;
    const scans = scanNearbyTickets(doc);
    const prefixErrors: bigint[] = [];
    const prefixInvalid: number[] = [];
    let [errAcc, invAcc] = [0n, 0];
    for (const scan of scans) {
      prefixErrors.push(errAcc);
      prefixInvalid.push(invAcc);
      errAcc += scan.invalidSum;
      if (!scan.isValid) invAcc += 1;
    }
    return Object.freeze(sampleTraceIndices(scans.length, maxSteps).map((i) => new ErrorScanTraceFrame({
      ticketIndex: i, totalTickets: scans.length, validBands, scanResult: scans[i]!,
      priorErrorSum: prefixErrors[i]!, priorInvalidCount: prefixInvalid[i]!,
    })));
  },
});

function collectValidNearby(doc: TicketDocument): readonly Ticket[] {
  return scanNearbyTickets(doc).filter((scan) => scan.isValid).map((scan) => scan.ticket);
}

export const DEPARTURE_PRODUCT_POLICY: TicketPolicy<FieldPeelingTraceFrame> = Object.freeze({
  id: 'departure-product',
  label: 'Departure Field Product',
  solve(doc: TicketDocument): bigint {
    const resolution = resolveFieldMapping(doc.rules, [...collectValidNearby(doc), doc.yourTicket]);
    let product = 1n;
    for (const [name, col] of resolution.columnByField) {
      if (name.startsWith(DEPARTURE_FIELD_PREFIX)) product *= doc.yourTicket.values[col]!;
    }
    return product;
  },
  trace(doc: TicketDocument, maxSteps: number): readonly FieldPeelingTraceFrame[] {
    const validNearby = collectValidNearby(doc);
    const resolution = resolveFieldMapping(doc.rules, [...validNearby, doc.yourTicket]);
    const base = {
      totalRounds: resolution.steps.length, totalNearbyCount: doc.nearbyTickets.length,
      validNearbyCount: validNearby.length, ruleNames: doc.rules.map((r) => r.name), yourTicket: doc.yourTicket,
    };
    const all: FieldPeelingTraceFrame[] = [new FieldPeelingTraceFrame({
      ...base, roundNumber: 0, masks: resolution.initialMasks, priorAssignments: [], activeLocks: [],
    })];
    const cumulative: FieldAssignment[] = [];
    for (const step of resolution.steps) {
      all.push(new FieldPeelingTraceFrame({
        ...base, roundNumber: step.round, masks: step.remainingMasks,
        priorAssignments: cumulative, activeLocks: step.locked,
      }));
      cumulative.push(...step.locked);
    }
    return Object.freeze(sampleTraceIndices(all.length, maxSteps).map((i) => all[i]!));
  },
});
