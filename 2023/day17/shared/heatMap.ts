/** Immutable rectangular grid of single-digit heat-loss costs ('1'..'9'). */
export class HeatMap {
  readonly #heat: Uint8Array;
  readonly height: number;
  readonly width: number;

  private constructor(heat: Uint8Array, height: number, width: number) {
    this.#heat = heat;
    this.height = height;
    this.width = width;
    Object.freeze(this);
  }

  /** Parses validated grid rows of uniform width containing digits `'1'..'9'`. */
  static fromLines(lines: readonly string[]): HeatMap {
    if (lines.length === 0) {
      throw new Error('HeatMap input cannot be empty');
    }
    const width = lines[0]!.length;
    if (width === 0) {
      throw new Error('HeatMap rows cannot be empty');
    }
    const heat = new Uint8Array(lines.length * width);
    for (let r = 0; r < lines.length; r += 1) {
      parseRowInto(lines[r]!, r, width, heat);
    }
    return new HeatMap(heat, lines.length, width);
  }

  get size(): number {
    return this.height * this.width;
  }

  get goalCell(): number {
    return this.size - 1;
  }

  inBounds(r: number, c: number): boolean {
    return (
      Number.isInteger(r) &&
      Number.isInteger(c) &&
      r >= 0 &&
      r < this.height &&
      c >= 0 &&
      c < this.width
    );
  }

  heatAt(r: number, c: number): number {
    if (!this.inBounds(r, c)) {
      throw new RangeError(`Cell (${r}, ${c}) is out of bounds for ${this.height}x${this.width} HeatMap`);
    }
    return this.#heat[r * this.width + c]!;
  }

  copyHeat(): Uint8Array {
    return this.#heat.slice();
  }
}

function parseRowInto(row: string, r: number, width: number, heat: Uint8Array): void {
  if (row.length !== width) {
    throw new Error(`Row ${r} has width ${row.length}, expected uniform width ${width}`);
  }
  const offset = r * width;
  for (let c = 0; c < width; c += 1) {
    const digit = row.charCodeAt(c) - 48;
    if (digit < 1 || digit > 9) {
      throw new Error(`Invalid heat digit '${row[c]}' at (${r}, ${c}); expected '1'..'9'`);
    }
    heat[offset + c] = digit;
  }
}

/** Parses raw puzzle text (normalizing CRLF/CR newlines and trimming outer whitespace). */
export function parseHeatMap(raw: string): HeatMap {
  const trimmed = raw.replace(/\r\n?/g, '\n').trim();
  if (trimmed.length === 0) {
    throw new Error('HeatMap input cannot be empty');
  }
  return HeatMap.fromLines(trimmed.split('\n'));
}
