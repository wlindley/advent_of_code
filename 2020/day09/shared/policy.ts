import type { XmasStream } from './stream';
import { tracePreambleScan, traceWeaknessAttack, type XmasTraceFrame } from './trace';
import { findContiguousWeakness } from './weakness';
import { findFirstInvalidStep } from './window';

/** Policy identifier distinguishing Part 1 vs Part 2 XMAS attacks. */
export type XmasAttackPolicyId = 'first-invalid' | 'encryption-weakness';

/** Strategy contract encapsulating solving and tracing an XMAS stream attack. */
export interface XmasAttackPolicy {
  readonly id: XmasAttackPolicyId;
  readonly label: string;
  readonly metricLabel: string;
  solve(stream: XmasStream, preambleLength: number): bigint;
  trace(stream: XmasStream, preambleLength: number, maxSteps: number): readonly XmasTraceFrame[];
}

/** Part 1 policy: locate the first number after the preamble with no distinct sum pair. */
export const FIRST_INVALID_POLICY: XmasAttackPolicy = Object.freeze({
  id: 'first-invalid',
  label: 'First Invalid',
  metricLabel: 'Invalid Target',
  solve(stream: XmasStream, preambleLength: number): bigint {
    return stream.at(findFirstInvalidStep(stream, preambleLength).targetIndex);
  },
  trace(stream: XmasStream, preambleLength: number, maxSteps: number): readonly XmasTraceFrame[] {
    return tracePreambleScan(stream, preambleLength, maxSteps);
  },
});

/** Part 2 policy: locate a contiguous range (>= 2 items) summing to the first invalid number. */
export const ENCRYPTION_WEAKNESS_POLICY: XmasAttackPolicy = Object.freeze({
  id: 'encryption-weakness',
  label: 'Encryption Weakness',
  metricLabel: 'Weakness Sum',
  solve(stream: XmasStream, preambleLength: number): bigint {
    const target = stream.at(findFirstInvalidStep(stream, preambleLength).targetIndex);
    return findContiguousWeakness(stream, target).encryptionWeakness(stream);
  },
  trace(stream: XmasStream, preambleLength: number, maxSteps: number): readonly XmasTraceFrame[] {
    return traceWeaknessAttack(stream, preambleLength, maxSteps);
  },
});
