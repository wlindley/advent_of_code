import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { type ImageDimensions, SpaceImage } from './imageModels';
import type { SpaceImagePolicy } from './policies';
import { buildSpaceImageTrace, type SpaceImageTraceFrame } from './trace';

/** Policy-parameterized Space Image puzzle solver supporting parse, solve, and bounded trace. */
export class SpaceImageSolver<TAnswer>
  implements Required<PuzzleSolver<SpaceImage, TAnswer, SpaceImageTraceFrame>>
{
  readonly policy: SpaceImagePolicy<TAnswer>;
  private readonly resolveDimensions: (raw: string) => ImageDimensions;

  constructor(policy: SpaceImagePolicy<TAnswer>, resolveDimensions: (raw: string) => ImageDimensions) {
    this.policy = policy;
    this.resolveDimensions = resolveDimensions;
    Object.freeze(this);
  }

  parse(raw: string): SpaceImage {
    return SpaceImage.parse(raw, this.resolveDimensions(raw));
  }

  solve(image: SpaceImage): TAnswer {
    return this.policy.evaluate(image);
  }

  trace(image: SpaceImage, options?: TraceOptions): readonly SpaceImageTraceFrame[] {
    return buildSpaceImageTrace(image, options);
  }
}
