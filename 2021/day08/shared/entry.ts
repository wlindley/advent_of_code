import {
  WIRE_INDICES,
  type SignalPattern,
  type WireFrequencies,
} from './segments';

export const SIGNAL_PATTERN_COUNT = 10;
export const OUTPUT_PATTERN_COUNT = 4;

export type OutputTuple = readonly [SignalPattern, SignalPattern, SignalPattern, SignalPattern];

function validateDistinctSignals(signals: readonly SignalPattern[]): readonly SignalPattern[] {
  if (signals.length !== SIGNAL_PATTERN_COUNT) {
    throw new RangeError(
      `DisplayEntry requires ${SIGNAL_PATTERN_COUNT} signal patterns, got ${signals.length}`,
    );
  }
  const seen = new Set<number>();
  for (const pattern of signals) {
    if (seen.has(pattern.mask)) {
      throw new SyntaxError(`Duplicate signal pattern "${pattern.letters}" in display entry`);
    }
    seen.add(pattern.mask);
  }
  return Object.freeze([...signals]);
}

function validateOutputs(outputs: readonly SignalPattern[]): OutputTuple {
  if (outputs.length !== OUTPUT_PATTERN_COUNT) {
    throw new RangeError(
      `DisplayEntry requires ${OUTPUT_PATTERN_COUNT} output patterns, got ${outputs.length}`,
    );
  }
  return Object.freeze([...outputs]) as unknown as OutputTuple;
}

/** Immutable 7-segment display entry pairing 10 unique signal patterns with 4 output digits. */
export class DisplayEntry {
  readonly signals: readonly SignalPattern[];
  readonly outputs: OutputTuple;

  constructor(signals: readonly SignalPattern[], outputs: readonly SignalPattern[]) {
    this.signals = validateDistinctSignals(signals);
    this.outputs = validateOutputs(outputs);
    Object.freeze(this);
  }

  get wireFrequencies(): WireFrequencies {
    const counts: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];
    for (const pattern of this.signals) {
      for (const wire of WIRE_INDICES) {
        if (pattern.hasWire(wire)) {
          counts[wire] += 1;
        }
      }
    }
    return Object.freeze(counts);
  }

  findSignalBySegmentCount(count: number): SignalPattern | null {
    for (const pattern of this.signals) {
      if (pattern.segmentCount === count) {
        return pattern;
      }
    }
    return null;
  }
}
