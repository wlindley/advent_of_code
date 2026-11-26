import type { VentBounds } from './types';

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite, got ${value}`);
  }
}

/** Immutable 1:1 aspect-preserving projection from VentBounds to Canvas 2D coordinates. */
export class ViewportTransform {
  readonly bounds: VentBounds;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly padding: number;

  constructor(bounds: VentBounds, canvasWidth: number, canvasHeight: number, padding: number) {
    assertPositiveFinite(canvasWidth, 'canvasWidth');
    assertPositiveFinite(canvasHeight, 'canvasHeight');
    if (!Number.isFinite(padding) || padding < 0) {
      throw new RangeError(`padding must be non-negative and finite, got ${padding}`);
    }
    if (padding * 2 >= canvasWidth || padding * 2 >= canvasHeight) {
      throw new RangeError(`padding (${padding}) leaves no drawable area in ${canvasWidth}x${canvasHeight}`);
    }
    this.bounds = bounds;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.padding = padding;
    Object.freeze(this);
  }

  private get spanX(): number { return Number(this.bounds.width - 1n); }
  private get spanY(): number { return Number(this.bounds.height - 1n); }
  private get innerWidth(): number { return this.canvasWidth - 2 * this.padding; }
  private get innerHeight(): number { return this.canvasHeight - 2 * this.padding; }

  get scale(): number {
    const sx = this.spanX === 0 ? Infinity : this.innerWidth / this.spanX;
    const sy = this.spanY === 0 ? Infinity : this.innerHeight / this.spanY;
    const raw = Math.min(sx, sy);
    return Number.isFinite(raw) ? raw : 1;
  }

  get offsetX(): number {
    return this.padding + (this.innerWidth - this.spanX * this.scale) / 2;
  }

  get offsetY(): number {
    return this.padding + (this.innerHeight - this.spanY * this.scale) / 2;
  }

  toCanvasX(x: number): number {
    return this.offsetX + (x - this.bounds.minX) * this.scale;
  }

  toCanvasY(y: number): number {
    return this.offsetY + (y - this.bounds.minY) * this.scale;
  }
}
