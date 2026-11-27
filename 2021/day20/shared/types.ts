/** Binary pixel state in the infinite trench map (`0` = dark `.`, `1` = light `#`). */
export type PixelBit = 0 | 1;

const ALGORITHM_TABLE_LENGTH = 512;

function assertValidBits(bits: Uint8Array, label: string): void {
  for (let i = 0; i < bits.length; i += 1) {
    const bit = bits[i]!;
    if (bit !== 0 && bit !== 1) {
      throw new RangeError(`${label} bit at index ${i} must be 0 or 1, got ${bit}`);
    }
  }
}

function assertPositiveInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive integer, got ${value}`);
  }
}

/** Validated 512-entry 3x3 neighborhood enhancement lookup table. */
export class EnhancementAlgorithm {
  private readonly table: Uint8Array;

  constructor(bits: Uint8Array) {
    if (bits.length !== ALGORITHM_TABLE_LENGTH) {
      throw new RangeError(`Enhancement algorithm must have ${ALGORITHM_TABLE_LENGTH} entries, got ${bits.length}`);
    }
    assertValidBits(bits, 'Algorithm');
    this.table = new Uint8Array(bits);
  }

  get darkVoidOutput(): PixelBit { return this.table[0] as PixelBit; }
  get litVoidOutput(): PixelBit { return this.table[511] as PixelBit; }
  get blinksBackground(): boolean { return this.darkVoidOutput === 1 && this.litVoidOutput === 0; }

  lookup(index: number): PixelBit {
    if (!Number.isInteger(index) || index < 0 || index >= ALGORITHM_TABLE_LENGTH) {
      throw new RangeError(`Lookup index must be an integer in 0..511, got ${index}`);
    }
    return this.table[index] as PixelBit;
  }

  nextBackground(current: PixelBit): PixelBit { return current === 0 ? this.darkVoidOutput : this.litVoidOutput; }
  copyTable(): Uint8Array { return new Uint8Array(this.table); }
}

/** Immutable view over a finite rectangular crop inside an infinite uniform background. */
export class TrenchImage {
  readonly height: number;
  readonly width: number;
  readonly background: PixelBit;
  private readonly pixels: Uint8Array;

  constructor(height: number, width: number, pixels: Uint8Array, background: PixelBit) {
    assertPositiveInt(height, 'Image height');
    assertPositiveInt(width, 'Image width');
    if (background !== 0 && background !== 1) {
      throw new RangeError(`Image background must be 0 or 1, got ${background}`);
    }
    if (pixels.length !== height * width) {
      throw new RangeError(`Expected ${height * width} pixels, got ${pixels.length}`);
    }
    assertValidBits(pixels, 'Pixel');
    this.height = height;
    this.width = width;
    this.background = background;
    this.pixels = new Uint8Array(pixels);
  }

  get finiteLitCount(): number {
    let lit = 0;
    for (let i = 0; i < this.pixels.length; i += 1) {
      if (this.pixels[i] === 1) lit += 1;
    }
    return lit;
  }

  get hasInfiniteLitPixels(): boolean {
    return this.background === 1;
  }

  get totalLitPixels(): number {
    if (this.background === 1) {
      throw new RangeError('Infinite image has infinitely many lit pixels when background is 1');
    }
    return this.finiteLitCount;
  }

  pixelAt(row: number, col: number): PixelBit {
    if (row < 0 || row >= this.height || col < 0 || col >= this.width) {
      return this.background;
    }
    return this.pixels[row * this.width + col] as PixelBit;
  }

  copyPixels(): Uint8Array {
    return new Uint8Array(this.pixels);
  }
}

/** Parsed Day 20 input containing the enhancement algorithm and initial trench image. */
export interface TrenchMapInput {
  readonly algorithm: EnhancementAlgorithm;
  readonly image: TrenchImage;
}

/** Single step snapshot in an enhancement trace. */
export interface TrenchTraceFrame {
  readonly step: number;
  readonly totalSteps: number;
  readonly image: TrenchImage;
}
