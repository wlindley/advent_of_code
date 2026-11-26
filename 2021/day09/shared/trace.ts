import type { HeightmapAnalysis, LowPoint } from './basin';

export interface BasinWaveSnapshot {
  readonly basinId: number;
  readonly revealedSize: number;
}

/** Trace frame for Part 1 low-point risk accumulation. */
export class LowPointScanFrame {
  readonly kind = 'low-point-risk' as const;
  readonly analysis: HeightmapAnalysis;
  readonly revealedLowPointCount: number;

  constructor(analysis: HeightmapAnalysis, revealedLowPointCount: number) {
    this.analysis = analysis;
    this.revealedLowPointCount = revealedLowPointCount;
    Object.freeze(this);
  }

  get activeLowPoint(): LowPoint | null {
    return this.revealedLowPointCount === 0
      ? null
      : this.analysis.lowPoints[this.revealedLowPointCount - 1]!;
  }

  get runningTotal(): number {
    let total = 0;
    for (let i = 0; i < this.revealedLowPointCount; i += 1) {
      total += this.analysis.lowPoints[i]!.riskLevel;
    }
    return total;
  }
}

/** Trace frame for Part 2 BFS wave expansion and top-basin product tracking. */
export class BasinFloodFrame {
  readonly kind = 'largest-basins-product' as const;
  readonly analysis: HeightmapAnalysis;
  readonly waveDepth: number;
  readonly revealedCellCount: number;
  readonly topBasins: readonly BasinWaveSnapshot[];

  constructor(
    analysis: HeightmapAnalysis,
    waveDepth: number,
    revealedCellCount: number,
    topBasins: readonly BasinWaveSnapshot[],
  ) {
    this.analysis = analysis;
    this.waveDepth = waveDepth;
    this.revealedCellCount = revealedCellCount;
    this.topBasins = Object.freeze(topBasins.map((s) => Object.freeze({ basinId: s.basinId, revealedSize: s.revealedSize })));
    Object.freeze(this);
  }

  get runningTotal(): number {
    let product = 1;
    for (const basin of this.topBasins) product *= basin.revealedSize;
    return product;
  }
}

export type SmokeBasinTraceFrame = LowPointScanFrame | BasinFloodFrame;
