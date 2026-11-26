import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../../shared/core';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type MemorySpace,
  type RamRunSnapshot,
  createStaticSnapshot,
} from '../../shared';
import { findBlockingByte } from './blockingByte';

/** Builds an endpoint-preserving corruption trace ending at the blocking byte (or final byte). */
export function buildBlockingByteTrace(
  memory: MemorySpace,
  options?: TraceOptions,
): readonly RamRunSnapshot[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const blocking = findBlockingByte(memory);
  const finalFallen = blocking ? blocking.fallenCount : memory.byteCount;
  const complete = createStaticSnapshot(memory, finalFallen, {
    phase: 'complete',
    blockingByte: blocking ? blocking.byte : null,
  });
  if (limit === 1 || finalFallen === 0) return Object.freeze([complete]);

  const frames: RamRunSnapshot[] = [];
  for (const fallen of sampleTraceIndices(finalFallen, limit - 1)) {
    frames.push(createStaticSnapshot(memory, fallen, { phase: 'corrupting', showPath: true }));
  }
  frames.push(complete);
  return Object.freeze(frames);
}
