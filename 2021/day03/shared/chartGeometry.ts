import { MOST_COMMON_CRITERION } from './criteria';
import type { Bit, BitTally } from './report';

export const CHART_VIEWBOX = Object.freeze({
  width: 640,
  height: 220,
  padLeft: 44,
  padRight: 16,
  padTop: 22,
  padBottom: 38,
});

export const MAX_VISIBLE_COLUMNS = 64;

export interface ColumnBarGeometry {
  readonly column: number;
  readonly x: number;
  readonly width: number;
  readonly centerX: number;
  readonly onesY: number;
  readonly onesHeight: number;
  readonly zerosY: number;
  readonly zerosHeight: number;
  readonly gammaBit: Bit;
  readonly isActive: boolean;
}

export interface ColumnChartGeometry {
  readonly totalColumns: number;
  readonly windowStart: number;
  readonly windowEnd: number;
  readonly midlineY: number;
  readonly plotLeft: number;
  readonly plotRight: number;
  readonly plotTop: number;
  readonly plotBottom: number;
  readonly bars: readonly ColumnBarGeometry[];
}

/** Formats a binary string preview, truncating with an ellipsis when exceeding `maxChars`. */
export function formatBitPreview(bits: string, maxChars: number): string {
  if (!Number.isInteger(maxChars) || maxChars < 4) {
    throw new RangeError(`maxChars must be an integer >= 4, got ${maxChars}`);
  }
  if (bits.length <= maxChars) return bits;
  return `${bits.slice(0, maxChars - 3)}...`;
}

function buildColumnBar(
  column: number,
  localIndex: number,
  tally: BitTally,
  slotWidth: number,
  plotLeft: number,
  plotTop: number,
  plotBottom: number,
  activeColumn: number,
): ColumnBarGeometry {
  const plotHeight = plotBottom - plotTop;
  const barWidth = Math.max(2, Math.min(44, slotWidth * 0.72));
  const x = plotLeft + localIndex * slotWidth + (slotWidth - barWidth) / 2;
  const onesHeight = tally.onesRatio * plotHeight;
  const zerosHeight = plotHeight - onesHeight;
  return Object.freeze({
    column,
    x,
    width: barWidth,
    centerX: x + barWidth / 2,
    onesY: plotBottom - onesHeight,
    onesHeight,
    zerosY: plotTop,
    zerosHeight,
    gammaBit: MOST_COMMON_CRITERION.selectBit(tally),
    isActive: column === activeColumn,
  });
}

/** Projects column bit tallies into bounded SVG stacked-bar coordinates centered on `activeColumn`. */
export function buildColumnChartGeometry(
  tallies: readonly BitTally[],
  activeColumn: number,
): ColumnChartGeometry {
  const totalColumns = tallies.length;
  if (totalColumns === 0) {
    throw new RangeError('Column chart requires at least one column tally');
  }
  if (!Number.isInteger(activeColumn) || activeColumn < 0 || activeColumn >= totalColumns) {
    throw new RangeError(`Active column out of bounds: ${activeColumn}`);
  }
  const { width, height, padLeft, padRight, padTop, padBottom } = CHART_VIEWBOX;
  const plotLeft = padLeft;
  const plotRight = width - padRight;
  const plotTop = padTop;
  const plotBottom = height - padBottom;
  const visibleCount = Math.min(totalColumns, MAX_VISIBLE_COLUMNS);
  const maxStart = totalColumns - visibleCount;
  const windowStart = Math.max(0, Math.min(maxStart, activeColumn - Math.floor(visibleCount / 2)));
  const windowEnd = windowStart + visibleCount;
  const slotWidth = (plotRight - plotLeft) / visibleCount;

  const bars: ColumnBarGeometry[] = [];
  for (let col = windowStart; col < windowEnd; col += 1) {
    bars.push(
      buildColumnBar(col, col - windowStart, tallies[col]!, slotWidth, plotLeft, plotTop, plotBottom, activeColumn),
    );
  }
  return Object.freeze({
    totalColumns,
    windowStart,
    windowEnd,
    midlineY: (plotTop + plotBottom) / 2,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    bars: Object.freeze(bars),
  });
}
