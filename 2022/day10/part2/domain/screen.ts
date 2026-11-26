import { CRT_HEIGHT, CRT_WIDTH, type CpuTimeline } from '../../shared';
import { GLYPH_COUNT, GLYPH_WIDTH, decodeGlyphMask, formatGlyphMask } from './font';

/** Total pixels in a full 40x6 CRT frame. */
export const CRT_PIXEL_COUNT = CRT_WIDTH * CRT_HEIGHT;

function assertBounds(value: number, maxExclusive: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value >= maxExclusive) {
    throw new RangeError(`${label} must be an integer in [0, ${maxExclusive - 1}], got ${value}`);
  }
}

function isSpriteVisibleAtCycle(timeline: CpuTimeline, cycle: number): boolean {
  const col = (cycle - 1) % CRT_WIDTH;
  return Math.abs(col - timeline.xDuringCycle(cycle)) <= 1;
}

/** Immutable 40x6 CRT framebuffer with dynamically derived views. */
export class CrtScreen {
  private readonly pixels: Uint8Array;

  constructor(pixels: Uint8Array) {
    if (pixels.length !== CRT_PIXEL_COUNT) {
      throw new RangeError(`CRT buffer must contain ${CRT_PIXEL_COUNT} pixels, got ${pixels.length}`);
    }
    const copy = new Uint8Array(CRT_PIXEL_COUNT);
    for (let i = 0; i < CRT_PIXEL_COUNT; i += 1) {
      const value = pixels[i]!;
      if (value !== 0 && value !== 1) {
        throw new RangeError(`CRT pixel at index ${i} must be 0 or 1, got ${value}`);
      }
      copy[i] = value;
    }
    // Freeze only the outer wrapper; never call Object.freeze() on a TypedArray.
    this.pixels = copy;
    Object.freeze(this);
  }

  /** Returns true when pixel `(row, col)` is lit. */
  isLit(row: number, col: number): boolean {
    assertBounds(row, CRT_HEIGHT, 'row');
    assertBounds(col, CRT_WIDTH, 'col');
    return this.pixels[row * CRT_WIDTH + col] === 1;
  }

  /** Dynamically packs the 30-bit glyph mask for letter slot `0..7`. */
  glyphMaskAt(slot: number): number {
    assertBounds(slot, GLYPH_COUNT, 'slot');
    const colOffset = slot * GLYPH_WIDTH;
    let mask = 0;
    for (let row = 0; row < CRT_HEIGHT; row += 1) {
      for (let col = 0; col < GLYPH_WIDTH; col += 1) {
        if (this.pixels[row * CRT_WIDTH + colOffset + col] === 1) {
          mask |= 1 << (row * GLYPH_WIDTH + col);
        }
      }
    }
    return mask;
  }

  /** Dynamically counts all lit pixels on the CRT screen. */
  get litCount(): number {
    let count = 0;
    for (let i = 0; i < CRT_PIXEL_COUNT; i += 1) {
      count += this.pixels[i]!;
    }
    return count;
  }

  /** Renders the 6 scanlines as `#`/`.` strings. */
  toLines(): readonly string[] {
    const lines: string[] = [];
    for (let row = 0; row < CRT_HEIGHT; row += 1) {
      let line = '';
      for (let col = 0; col < CRT_WIDTH; col += 1) {
        line += this.pixels[row * CRT_WIDTH + col] === 1 ? '#' : '.';
      }
      lines.push(line);
    }
    return Object.freeze(lines);
  }

  /** Renders the full 40x6 CRT screen as newline-delimited `#`/`.` rows. */
  toString(): string {
    return this.toLines().join('\n');
  }
}

/** Rasterizes cycles 1..240 of a CpuTimeline into an immutable CrtScreen. */
export function rasterizeCrtScreen(timeline: CpuTimeline): CrtScreen {
  if (timeline.totalCycles < CRT_PIXEL_COUNT) {
    throw new RangeError(
      `CRT screen requires at least ${CRT_PIXEL_COUNT} cycles, got ${timeline.totalCycles}`,
    );
  }
  const pixels = new Uint8Array(CRT_PIXEL_COUNT);
  for (let cycle = 1; cycle <= CRT_PIXEL_COUNT; cycle += 1) {
    pixels[cycle - 1] = isSpriteVisibleAtCycle(timeline, cycle) ? 1 : 0;
  }
  return new CrtScreen(pixels);
}

/** Rasterizes available cycles `1..min(totalCycles, 240)` as a boolean prefix. */
export function rasterizeCrtPrefix(timeline: CpuTimeline): readonly boolean[] {
  const limit = Math.min(timeline.totalCycles, CRT_PIXEL_COUNT);
  const pixels: boolean[] = [];
  for (let cycle = 1; cycle <= limit; cycle += 1) {
    pixels.push(isSpriteVisibleAtCycle(timeline, cycle));
  }
  return Object.freeze(pixels);
}

/** Decodes all 8 glyph slots on a CrtScreen, returning `null` for unrecognized slots. */
export function tryDecodeCrtScreen(screen: CrtScreen): readonly (string | null)[] {
  const letters: (string | null)[] = [];
  for (let slot = 0; slot < GLYPH_COUNT; slot += 1) {
    letters.push(decodeGlyphMask(screen.glyphMaskAt(slot)));
  }
  return Object.freeze(letters);
}

/** Decodes all 8 glyph slots into an uppercase string, throwing with diagnostics on failure. */
export function decodeCrtScreen(screen: CrtScreen): string {
  let result = '';
  for (let slot = 0; slot < GLYPH_COUNT; slot += 1) {
    const mask = screen.glyphMaskAt(slot);
    const letter = decodeGlyphMask(mask);
    if (letter === null) {
      throw new Error(`Unrecognized CRT glyph at slot ${slot + 1}:\n${formatGlyphMask(mask)}`);
    }
    result += letter;
  }
  return result;
}
