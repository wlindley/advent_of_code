import type { ImageDimensions, LayerDigitCounts } from './imageModels';

/** Pure SVG grid geometry for rendering a Space Image layer or composite. */
export interface GridLayout {
  readonly cellSize: number;
  readonly gap: number;
  readonly padding: number;
  readonly svgWidth: number;
  readonly svgHeight: number;
}

/** Stacked 0/1/2 bar geometry for one layer in the histogram chart. */
export interface HistogramBar {
  readonly layerIndex: number;
  readonly x: number;
  readonly width: number;
  readonly zeroY: number;
  readonly zeroHeight: number;
  readonly oneY: number;
  readonly oneHeight: number;
  readonly twoY: number;
  readonly twoHeight: number;
  readonly zeroRatio: number;
  readonly isActive: boolean;
  readonly isBest: boolean;
}

/** Full SVG histogram layout computed once per layer-counts sequence. */
export interface HistogramLayout {
  readonly svgWidth: number;
  readonly svgHeight: number;
  readonly plotLeft: number;
  readonly plotTop: number;
  readonly plotWidth: number;
  readonly plotHeight: number;
  readonly maxZeros: number;
  readonly bars: readonly HistogramBar[];
}

export function computeGridLayout(dimensions: ImageDimensions): GridLayout {
  const cellSize = Math.max(12, Math.min(36, Math.floor(380 / dimensions.width)));
  const gap = 2;
  const padding = 10;
  const svgWidth = padding * 2 + dimensions.width * cellSize + (dimensions.width - 1) * gap;
  const svgHeight = padding * 2 + dimensions.height * cellSize + (dimensions.height - 1) * gap;
  return Object.freeze({ cellSize, gap, padding, svgWidth, svgHeight });
}

function buildHistogramBar(
  entry: LayerDigitCounts,
  layerIndex: number,
  slotWidth: number,
  barWidth: number,
  plotLeft: number,
  plotBottom: number,
  plotHeight: number,
  maxZeros: number,
  activeLayerIndex: number,
  bestLayerIndex: number,
): HistogramBar {
  const layerTotal = Math.max(1, entry.zeros + entry.ones + entry.twos);
  const zeroHeight = (entry.zeros / layerTotal) * plotHeight;
  const oneHeight = (entry.ones / layerTotal) * plotHeight;
  const twoHeight = (entry.twos / layerTotal) * plotHeight;
  const zeroY = plotBottom - zeroHeight;
  const oneY = zeroY - oneHeight;
  const twoY = oneY - twoHeight;
  return Object.freeze({
    layerIndex,
    x: plotLeft + layerIndex * slotWidth + (slotWidth - barWidth) / 2,
    width: barWidth,
    zeroY,
    zeroHeight,
    oneY,
    oneHeight,
    twoY,
    twoHeight,
    zeroRatio: entry.zeros / maxZeros,
    isActive: layerIndex === activeLayerIndex,
    isBest: layerIndex === bestLayerIndex,
  });
}

export function computeHistogramBars(
  counts: readonly LayerDigitCounts[],
  activeLayerIndex: number,
  bestLayerIndex: number,
): HistogramLayout {
  if (counts.length === 0) throw new RangeError('Histogram requires at least one layer');
  const svgWidth = 760, svgHeight = 148, plotLeft = 34, plotTop = 14, plotWidth = 710, plotHeight = 110;
  let maxZeros = 1;
  for (const entry of counts) maxZeros = Math.max(maxZeros, entry.zeros);
  const slotWidth = plotWidth / counts.length;
  const barWidth = Math.max(2, slotWidth - 2);
  const bars = counts.map((entry, i) =>
    buildHistogramBar(entry, i, slotWidth, barWidth, plotLeft, plotTop + plotHeight, plotHeight, maxZeros, activeLayerIndex, bestLayerIndex),
  );
  return Object.freeze({
    svgWidth, svgHeight, plotLeft, plotTop, plotWidth, plotHeight, maxZeros, bars: Object.freeze(bars),
  });
}
