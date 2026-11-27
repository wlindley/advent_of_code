import { assertNonNegativeInt, patternWeight, type PatternWeight } from './signal';
import { PATTERN_MATRIX_MAX_SIZE, type FftMode, type FftTraceFrame } from './trace';

export interface SpectrumDigitBar {
  readonly index: number;
  readonly digit: number;
  readonly isMessage: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface HistogramBar {
  readonly digit: number;
  readonly count: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface SpectrumLayout {
  readonly viewBox: string;
  readonly digitBars: readonly SpectrumDigitBar[];
  readonly histogramBars: readonly HistogramBar[];
  readonly messageRangeX: number;
  readonly messageRangeWidth: number;
  readonly maxHistogramCount: number;
}

export interface PatternMatrixLayout {
  readonly viewBox: string;
  readonly size: number;
  readonly cellSize: number;
  readonly originX: number;
  readonly originY: number;
  readonly selectedRow: number;
  readonly rowHighlightY: number;
  readonly plusPath: string;
  readonly minusPath: string;
  readonly zeroPath: string;
  readonly rowWeights: readonly PatternWeight[];
  readonly rowPreviewSum: number;
}

function buildDigitBars(frame: FftTraceFrame): readonly SpectrumDigitBar[] {
  const count = frame.previewDigits.length;
  const slotWidth = 608 / count;
  const width = Math.max(2, slotWidth - 1.5);
  const bars: SpectrumDigitBar[] = [];
  for (let i = 0; i < count; i += 1) {
    const digit = frame.previewDigits[i]!;
    const height = Math.max(4, (digit / 9) * 72);
    bars.push(
      Object.freeze({
        index: i,
        digit,
        isMessage: i < frame.messageLength,
        x: Number((16 + i * slotWidth).toFixed(2)),
        y: Number((104 - height).toFixed(2)),
        width: Number(width.toFixed(2)),
        height: Number(height.toFixed(2)),
      }),
    );
  }
  return Object.freeze(bars);
}

function buildHistogramBars(histogram: readonly number[], maxCount: number): readonly HistogramBar[] {
  const bars: HistogramBar[] = [];
  for (let digit = 0; digit < 10; digit += 1) {
    const count = histogram[digit]!;
    const height = count === 0 ? 0 : Math.max(4, (count / maxCount) * 64);
    bars.push(
      Object.freeze({
        digit,
        count,
        x: Number((16 + digit * 60.8 + 8.4).toFixed(2)),
        y: Number((214 - height).toFixed(2)),
        width: 44,
        height: Number(height.toFixed(2)),
      }),
    );
  }
  return Object.freeze(bars);
}

/** Builds SVG geometry for the signal digit strip and frequency histogram. */
export function buildSpectrumLayout(frame: FftTraceFrame): SpectrumLayout {
  if (frame.previewDigits.length === 0) {
    throw new RangeError('Trace frame previewDigits must not be empty');
  }
  if (frame.digitHistogram.length !== 10) {
    throw new RangeError(`digitHistogram must have length 10, got ${frame.digitHistogram.length}`);
  }
  const digitBars = buildDigitBars(frame);
  const maxHistogramCount = Math.max(1, ...frame.digitHistogram);
  const histogramBars = buildHistogramBars(frame.digitHistogram, maxHistogramCount);
  const msgCount = Math.min(frame.messageLength, frame.previewDigits.length);
  const slotWidth = 608 / frame.previewDigits.length;

  return Object.freeze({
    viewBox: '0 0 640 240',
    digitBars,
    histogramBars,
    messageRangeX: 14,
    messageRangeWidth: Number((msgCount * slotWidth + 2).toFixed(2)),
    maxHistogramCount,
  });
}

function matrixCellWeight(mode: FftMode, row: number, col: number): PatternWeight {
  if (mode === 'tail') {
    return col >= row ? 1 : 0;
  }
  return patternWeight(row, col);
}

function buildMatrixPaths(
  frame: FftTraceFrame,
  size: number,
  clampedRow: number,
  originX: number,
  originY: number,
  cellSize: number,
) {
  let plusPath = '';
  let minusPath = '';
  let zeroPath = '';
  const rowWeights: PatternWeight[] = [];
  let rowPreviewSum = 0;

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const weight = matrixCellWeight(frame.mode, r, c);
      const rect = `M${originX + c * cellSize} ${originY + r * cellSize}h${cellSize - 1}v${cellSize - 1}h-${cellSize - 1}z`;
      if (weight === 1) plusPath += rect;
      else if (weight === -1) minusPath += rect;
      else zeroPath += rect;
      if (r === clampedRow) {
        rowWeights.push(weight);
        rowPreviewSum += frame.previewDigits[c]! * weight;
      }
    }
  }
  return { plusPath, minusPath, zeroPath, rowWeights, rowPreviewSum };
}

/** Builds a batched 3-path SVG heatmap layout for the leading 16x16 FFT weight matrix. */
export function buildPatternMatrixLayout(
  frame: FftTraceFrame,
  selectedRow: number,
): PatternMatrixLayout {
  if (frame.previewDigits.length === 0) {
    throw new RangeError('Trace frame previewDigits must not be empty');
  }
  assertNonNegativeInt(selectedRow, 'selectedRow');
  const size = Math.min(PATTERN_MATRIX_MAX_SIZE, frame.previewDigits.length);
  const clampedRow = Math.min(selectedRow, size - 1);
  const originX = 36;
  const originY = 24;
  const cellSize = 16;
  const paths = buildMatrixPaths(frame, size, clampedRow, originX, originY, cellSize);

  return Object.freeze({
    viewBox: '0 0 320 310',
    size,
    cellSize,
    originX,
    originY,
    selectedRow: clampedRow,
    rowHighlightY: originY + clampedRow * cellSize,
    plusPath: paths.plusPath,
    minusPath: paths.minusPath,
    zeroPath: paths.zeroPath,
    rowWeights: Object.freeze(paths.rowWeights),
    rowPreviewSum: paths.rowPreviewSum,
  });
}
