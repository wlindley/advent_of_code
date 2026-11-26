import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { LEAST_COMMON_CRITERION, MOST_COMMON_CRITERION } from './criteria';
import type { Bit, BitTally, DiagnosticReport } from './report';

export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Immutable gamma/epsilon power diagnostic rates with derived binary strings and product. */
export class PowerRates {
  readonly gamma: bigint;
  readonly epsilon: bigint;
  readonly bitWidth: number;

  constructor(gamma: bigint, epsilon: bigint, bitWidth: number) {
    if (!Number.isInteger(bitWidth) || bitWidth < 1) {
      throw new RangeError(`bitWidth must be a positive integer, got ${bitWidth}`);
    }
    const mask = (1n << BigInt(bitWidth)) - 1n;
    if (gamma < 0n || gamma > mask) {
      throw new RangeError(`gamma (${gamma}) out of range for ${bitWidth}-bit unsigned integer`);
    }
    if (epsilon < 0n || epsilon > mask) {
      throw new RangeError(`epsilon (${epsilon}) out of range for ${bitWidth}-bit unsigned integer`);
    }
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.bitWidth = bitWidth;
    Object.freeze(this);
  }

  get powerConsumption(): bigint {
    return this.gamma * this.epsilon;
  }

  get gammaBinary(): string {
    return this.gamma.toString(2).padStart(this.bitWidth, '0');
  }

  get epsilonBinary(): string {
    return this.epsilon.toString(2).padStart(this.bitWidth, '0');
  }
}

export interface PowerTraceFrame {
  readonly column: number;
  readonly tally: BitTally;
  readonly gammaBit: Bit;
  readonly epsilonBit: Bit;
  readonly prefixRates: PowerRates;
}

function appendBit(value: bigint, bit: Bit): bigint {
  return (value << 1n) | (bit === '1' ? 1n : 0n);
}

/** Tallies 1/0 bit counts across every column of a DiagnosticReport. */
export function tallyAllColumns(report: DiagnosticReport): readonly BitTally[] {
  const tallies: BitTally[] = [];
  for (let col = 0; col < report.bitWidth; col += 1) {
    tallies.push(report.countBitsAtColumn(col));
  }
  return Object.freeze(tallies);
}

/** Computes final gamma, epsilon, and power consumption rates for a DiagnosticReport. */
export function analyzePowerConsumption(report: DiagnosticReport): PowerRates {
  const tallies = tallyAllColumns(report);
  let gamma = 0n;
  let epsilon = 0n;
  for (const tally of tallies) {
    gamma = appendBit(gamma, MOST_COMMON_CRITERION.selectBit(tally));
    epsilon = appendBit(epsilon, LEAST_COMMON_CRITERION.selectBit(tally));
  }
  return new PowerRates(gamma, epsilon, report.bitWidth);
}

/** Traces column-by-column gamma/epsilon prefix construction, bounded by `options.maxSteps`. */
export function tracePowerConsumption(
  report: DiagnosticReport,
  options?: TraceOptions,
): readonly PowerTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const tallies = tallyAllColumns(report);
  const sampled = sampleTraceIndices(tallies.length, limit);
  const frames: PowerTraceFrame[] = [];
  let gamma = 0n;
  let epsilon = 0n;
  let cursor = 0;

  for (let col = 0; col < tallies.length; col += 1) {
    const tally = tallies[col]!;
    const gammaBit = MOST_COMMON_CRITERION.selectBit(tally);
    const epsilonBit = LEAST_COMMON_CRITERION.selectBit(tally);
    gamma = appendBit(gamma, gammaBit);
    epsilon = appendBit(epsilon, epsilonBit);
    if (col === sampled[cursor]) {
      const prefixRates = new PowerRates(gamma, epsilon, col + 1);
      frames.push(Object.freeze({ column: col, tally, gammaBit, epsilonBit, prefixRates }));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}
