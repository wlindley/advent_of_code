import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import { CRT_WIDTH, DEFAULT_MAX_TRACE_STEPS, type CpuTimeline, type CycleSnapshot } from '../../shared';
import { GLYPH_COUNT, GLYPH_WIDTH } from './font';
import { CRT_PIXEL_COUNT, CrtScreen, rasterizeCrtPrefix, tryDecodeCrtScreen } from './screen';

const LAST_ROW_BASE_CYCLE = CRT_PIXEL_COUNT - CRT_WIDTH;

/** Progressive per-slot OCR status at a given CRT beam cycle. */
export type SlotDecodeState =
  | { readonly status: 'pending' }
  | { readonly status: 'decoded'; readonly letter: string }
  | { readonly status: 'unknown' };

/** Returns the 1-based cycle at which glyph slot `0..7` finishes drawing its bottom-right pixel. */
export function slotCompletionCycle(slot: number): number {
  if (!Number.isInteger(slot) || slot < 0 || slot >= GLYPH_COUNT) {
    throw new RangeError(`Slot must be an integer in [0, ${GLYPH_COUNT - 1}], got ${slot}`);
  }
  return LAST_ROW_BASE_CYCLE + (slot + 1) * GLYPH_WIDTH;
}

function formatSlotChar(slot: SlotDecodeState): string {
  if (slot.status === 'decoded') return slot.letter;
  return slot.status === 'unknown' ? '?' : '_';
}

function freezeSlot(slot: SlotDecodeState): SlotDecodeState {
  return Object.freeze({ ...slot });
}

/** Immutable CRT beam trace frame with dynamically derived completion and OCR text. */
export class CrtBeamTraceFrame {
  readonly snapshot: CycleSnapshot;
  readonly totalCycles: number;
  readonly slots: readonly SlotDecodeState[];

  constructor(
    snapshot: CycleSnapshot,
    totalCycles: number,
    slots: readonly SlotDecodeState[],
  ) {
    if (!Number.isSafeInteger(totalCycles) || totalCycles < snapshot.cycle) {
      throw new RangeError(
        `totalCycles must be a safe integer >= snapshot.cycle (${snapshot.cycle}), got ${totalCycles}`,
      );
    }
    if (slots.length !== GLYPH_COUNT) {
      throw new RangeError(`slots must have length ${GLYPH_COUNT}, got ${slots.length}`);
    }
    this.snapshot = snapshot;
    this.totalCycles = totalCycles;
    this.slots = Object.freeze(slots.map(freezeSlot));
    Object.freeze(this);
  }

  /** 1-based cycle index of this frame. */
  get cycle(): number {
    return this.snapshot.cycle;
  }

  /** Number of CRT pixels drawn up to this cycle (capped at 240). */
  get drawnPixelCount(): number {
    return Math.min(this.snapshot.cycle, CRT_PIXEL_COUNT);
  }

  /** True once all 240 CRT pixels have been drawn. */
  get isScreenComplete(): boolean {
    return this.snapshot.cycle >= CRT_PIXEL_COUNT;
  }

  /** True on the final cycle of the CPU timeline. */
  get isComplete(): boolean {
    return this.snapshot.cycle === this.totalCycles;
  }

  /** Progressive 8-character OCR readout (`letter`, `?` for unknown, `_` for pending). */
  get decodedText(): string {
    let text = '';
    for (const slot of this.slots) {
      text += formatSlotChar(slot);
    }
    return text;
  }
}

function decodeCompletedSlots(timeline: CpuTimeline): readonly (string | null)[] {
  const prefix = rasterizeCrtPrefix(timeline);
  const buffer = new Uint8Array(CRT_PIXEL_COUNT);
  for (let i = 0; i < prefix.length; i += 1) {
    buffer[i] = prefix[i] ? 1 : 0;
  }
  return tryDecodeCrtScreen(new CrtScreen(buffer));
}

function buildFrameSlots(
  cycle: number,
  decodedSlots: readonly (string | null)[],
): readonly SlotDecodeState[] {
  const slots: SlotDecodeState[] = [];
  for (let slot = 0; slot < GLYPH_COUNT; slot += 1) {
    if (cycle < slotCompletionCycle(slot)) {
      slots.push({ status: 'pending' });
    } else {
      const letter = decodedSlots[slot]!;
      slots.push(letter === null ? { status: 'unknown' } : { status: 'decoded', letter });
    }
  }
  return slots;
}

/** Builds a bounded, uniformly sampled array of CrtBeamTraceFrame objects. */
export function buildCrtBeamTrace(
  timeline: CpuTimeline,
  options?: TraceOptions,
): readonly CrtBeamTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const decodedSlots = decodeCompletedSlots(timeline);
  const indices = sampleTraceIndices(timeline.totalCycles, limit);

  const frames: CrtBeamTraceFrame[] = [];
  for (const idx of indices) {
    const cycle = idx + 1;
    frames.push(
      new CrtBeamTraceFrame(
        timeline.snapshotAt(cycle),
        timeline.totalCycles,
        buildFrameSlots(cycle, decodedSlots),
      ),
    );
  }
  return Object.freeze(frames);
}
