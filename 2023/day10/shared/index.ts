export {
  DIR_BITS,
  DIR_E,
  DIR_N,
  DIR_S,
  DIR_W,
  bitToDirIndex,
  createCoord,
  maskToPipeShape,
  oppositeBit,
  otherPort,
  parsePipeSymbol,
  pipePorts,
  tileMask,
  type DirBit,
  type GridCoord,
  type PipeShape,
  type PipeSymbol,
  type PipeTile,
} from './pipes';
export { PipeMaze, parsePipeMaze } from './maze';
export { MainLoop, traceMainLoop } from './loop';
export { DEFAULT_MAX_TRACE_STEPS, buildLoopWalkTrace, type PipeMazeTraceFrame } from './trace';
