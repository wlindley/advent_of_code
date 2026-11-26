export {
  buildGlyphLookup,
  CANONICAL_GLYPHS,
  decodeCompositeMessage,
  decodeGlyphMask,
  formatGlyphMask,
  GLYPH_BIT_COUNT,
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  isFontCompatible,
  MAX_GLYPH_MASK,
  packGlyphMask,
  tryDecodeComposite,
  type GlyphTemplate,
} from './bitmapFont';
export {
  CompositeImage,
  ImageDimensions,
  LayerDigitCounts,
  PART1_EXAMPLE_DIMENSIONS,
  PART2_EXAMPLE_DIMENSIONS,
  PIXEL_BLACK,
  PIXEL_TRANSPARENT,
  PIXEL_WHITE,
  SpaceImage,
  STANDARD_IMAGE_DIMENSIONS,
} from './imageModels';
export {
  compositeSpaceImage,
  DECODED_MESSAGE_POLICY,
  findMinZeroLayerIndex,
  MIN_ZERO_CHECKSUM_POLICY,
  type SpaceImagePolicy,
  type SpaceImagePolicyId,
} from './policies';
export { SpaceImageSolver } from './solver';
export { buildSpaceImageTrace, DEFAULT_MAX_TRACE_FRAMES, SpaceImageTraceFrame } from './trace';
export {
  computeGridLayout,
  computeHistogramBars,
  type GridLayout,
  type HistogramBar,
  type HistogramLayout,
} from './vizLayout';
