/** Canonical Space Image Format pixel values. */
export const PIXEL_BLACK = 0, PIXEL_WHITE = 1, PIXEL_TRANSPARENT = 2;

function assertIntInRange(value: number, min: number, max: number, label: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer in [${min}, ${max}], got ${value}`);
  }
}

/** Immutable width/height specification for a layered Space Image. */
export class ImageDimensions {
  readonly width: number;
  readonly height: number;
  constructor(width: number, height: number) {
    assertIntInRange(width, 1, Number.MAX_SAFE_INTEGER, 'width');
    assertIntInRange(height, 1, Number.MAX_SAFE_INTEGER, 'height');
    this.width = width; this.height = height;
    Object.freeze(this);
  }
  get layerSize(): number { return this.width * this.height; }
  equals(other: ImageDimensions): boolean { return this.width === other.width && this.height === other.height; }
  indexOf(row: number, col: number): number {
    assertIntInRange(row, 0, this.height - 1, 'row');
    assertIntInRange(col, 0, this.width - 1, 'col');
    return row * this.width + col;
  }
}

export const STANDARD_IMAGE_DIMENSIONS = new ImageDimensions(25, 6);
export const PART1_EXAMPLE_DIMENSIONS = new ImageDimensions(3, 2);
export const PART2_EXAMPLE_DIMENSIONS = new ImageDimensions(2, 2);

/** Immutable per-layer counts of digits 0, 1, and 2 with derived checksum. */
export class LayerDigitCounts {
  readonly zeros: number;
  readonly ones: number;
  readonly twos: number;
  constructor(zeros: number, ones: number, twos: number) {
    assertIntInRange(zeros, 0, Number.MAX_SAFE_INTEGER, 'zeros');
    assertIntInRange(ones, 0, Number.MAX_SAFE_INTEGER, 'ones');
    assertIntInRange(twos, 0, Number.MAX_SAFE_INTEGER, 'twos');
    this.zeros = zeros; this.ones = ones; this.twos = twos;
    Object.freeze(this);
  }
  get checksum(): number { return this.ones * this.twos; }
}

function copyValidatedDigits(pixels: Uint8Array, maxPixel: number): Uint8Array {
  const copy = new Uint8Array(pixels.length);
  for (let i = 0; i < pixels.length; i += 1) {
    const value = pixels[i]!;
    if (value > maxPixel) throw new RangeError(`Pixel at ${i} must be in [0, ${maxPixel}], got ${value}`);
    copy[i] = value;
  }
  return copy;
}

/** Immutable layered Space Image wrapper around a defensive pixel buffer. */
export class SpaceImage {
  readonly dimensions: ImageDimensions;
  private readonly pixels: Uint8Array;

  constructor(dimensions: ImageDimensions, pixels: Uint8Array) {
    if (pixels.length === 0 || pixels.length % dimensions.layerSize !== 0) {
      throw new RangeError(`Pixel length ${pixels.length} must be a positive multiple of ${dimensions.layerSize}`);
    }
    this.dimensions = dimensions;
    this.pixels = copyValidatedDigits(pixels, 9);
    Object.freeze(this);
  }
  static parse(raw: string, dimensions: ImageDimensions): SpaceImage {
    const trimmed = raw.trim();
    if (trimmed.length === 0) throw new Error('Space image input must not be empty');
    const bytes = new Uint8Array(trimmed.length);
    for (let i = 0; i < trimmed.length; i += 1) {
      const digit = trimmed.charCodeAt(i) - 48;
      if (digit < 0 || digit > 9) throw new Error(`Invalid digit ${JSON.stringify(trimmed[i]!)} at ${i}`);
      bytes[i] = digit;
    }
    return new SpaceImage(dimensions, bytes);
  }
  get layerCount(): number { return this.pixels.length / this.dimensions.layerSize; }
  get totalPixels(): number { return this.pixels.length; }
  private layerStart(layer: number): number {
    assertIntInRange(layer, 0, this.layerCount - 1, 'layer');
    return layer * this.dimensions.layerSize;
  }
  pixelAt(layer: number, row: number, col: number): number {
    return this.pixels[this.layerStart(layer) + this.dimensions.indexOf(row, col)]!;
  }
  layerCounts(layer: number): LayerDigitCounts {
    const start = this.layerStart(layer), end = start + this.dimensions.layerSize;
    let zeros = 0, ones = 0, twos = 0;
    for (let i = start; i < end; i += 1) {
      const v = this.pixels[i]!;
      if (v === PIXEL_BLACK) zeros += 1;
      else if (v === PIXEL_WHITE) ones += 1;
      else if (v === PIXEL_TRANSPARENT) twos += 1;
    }
    return new LayerDigitCounts(zeros, ones, twos);
  }
  allLayerCounts(): readonly LayerDigitCounts[] {
    return Object.freeze(Array.from({ length: this.layerCount }, (_, layer) => this.layerCounts(layer)));
  }
  copyLayerPixels(layer: number): Uint8Array {
    const start = this.layerStart(layer);
    return this.pixels.slice(start, start + this.dimensions.layerSize);
  }
}
const ASCII_PIXEL_CHARS = ['.', '#', ' '] as const;
/** Immutable single-layer composited Space Image restricted to {0, 1, 2}. */
export class CompositeImage {
  readonly dimensions: ImageDimensions;
  private readonly pixels: Uint8Array;
  constructor(dimensions: ImageDimensions, pixels: Uint8Array) {
    if (pixels.length !== dimensions.layerSize) {
      throw new RangeError(`Composite pixel length ${pixels.length} must equal ${dimensions.layerSize}`);
    }
    this.dimensions = dimensions; this.pixels = copyValidatedDigits(pixels, PIXEL_TRANSPARENT);
    Object.freeze(this);
  }
  get resolvedCount(): number {
    let count = 0;
    for (let i = 0; i < this.pixels.length; i += 1) if (this.pixels[i]! !== PIXEL_TRANSPARENT) count += 1;
    return count;
  }
  get isFullyResolved(): boolean { return this.resolvedCount === this.dimensions.layerSize; }
  pixelAt(row: number, col: number): number { return this.pixels[this.dimensions.indexOf(row, col)]!; }
  toAsciiLines(): readonly string[] {
    const lines: string[] = [];
    for (let r = 0; r < this.dimensions.height; r += 1) {
      let line = '';
      for (let c = 0; c < this.dimensions.width; c += 1) line += ASCII_PIXEL_CHARS[this.pixelAt(r, c)]!;
      lines.push(line);
    }
    return Object.freeze(lines);
  }
  toString(): string { return this.toAsciiLines().join('\n'); }
}
