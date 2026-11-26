import type { IntcodeProgram } from '../../../shared/intcode';
import { runGravityAssist, type GravityAssistInputs } from '../../shared';

/** Target memory[0] value required by AoC 2019 Day 2 Part 2. */
export const PART2_TARGET = 19690720n;
/** Inclusive upper bound for both noun and verb inputs in Part 2. */
export const PART2_MAX_INPUT = 99n;
/** Default Day 2 Part 2 search bounds and target configuration. */
export const PART2_SEARCH_CONFIG: GravityAssistSearchConfig = Object.freeze({ target: PART2_TARGET, maxInput: PART2_MAX_INPUT });

export type SearchStrategy = 'affine' | 'exhaustive';
export interface GravityAssistSearchConfig { readonly target: bigint; readonly maxInput: bigint; }
export interface ProbeSample { readonly inputs: GravityAssistInputs; readonly output: bigint; }
export type BasisProbes = readonly [ProbeSample, ProbeSample, ProbeSample];

function freezeProbe(sample: ProbeSample): ProbeSample {
  const inputs: GravityAssistInputs = Object.freeze({ noun: sample.inputs.noun, verb: sample.inputs.verb });
  return Object.freeze({ inputs, output: sample.output });
}

/** Immutable search match storing primary probe data and deriving affine coefficients dynamically. */
export class GravityAssistMatch {
  readonly inputs: GravityAssistInputs;
  readonly output: bigint;
  readonly strategy: SearchStrategy;
  readonly evaluatedCount: number;
  readonly basisProbes: BasisProbes;

  constructor(inputs: GravityAssistInputs, output: bigint, strategy: SearchStrategy, evaluatedCount: number, basisProbes: BasisProbes) {
    if (!Number.isSafeInteger(evaluatedCount) || evaluatedCount < 1) {
      throw new RangeError(`evaluatedCount must be a positive safe integer, got ${evaluatedCount}`);
    }
    this.inputs = Object.freeze({ noun: inputs.noun, verb: inputs.verb });
    this.output = output;
    this.strategy = strategy;
    this.evaluatedCount = evaluatedCount;
    this.basisProbes = Object.freeze([freezeProbe(basisProbes[0]), freezeProbe(basisProbes[1]), freezeProbe(basisProbes[2])]) as BasisProbes;
    Object.freeze(this);
  }

  get answerCode(): bigint { return 100n * this.inputs.noun + this.inputs.verb; }
  get intercept(): bigint { return this.basisProbes[0].output; }
  get nounSlope(): bigint { return this.basisProbes[1].output - this.basisProbes[0].output; }
  get verbSlope(): bigint { return this.basisProbes[2].output - this.basisProbes[0].output; }
  predictAffine(inputs: GravityAssistInputs): bigint {
    return this.intercept + this.nounSlope * inputs.noun + this.verbSlope * inputs.verb;
  }
}

class EvaluationTracker {
  private readonly program: IntcodeProgram;
  private readonly cache = new Map<string, bigint>();
  private evaluations = 0;

  constructor(program: IntcodeProgram) { this.program = program; }
  get count(): number { return this.evaluations; }

  evaluate(inputs: GravityAssistInputs): bigint {
    const key = `${inputs.noun},${inputs.verb}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const output = runGravityAssist(this.program, inputs);
    this.cache.set(key, output);
    this.evaluations += 1;
    return output;
  }
}

function validateSearchConfig(config: GravityAssistSearchConfig): void {
  if (config.maxInput < 1n) throw new RangeError(`maxInput must be >= 1, got ${config.maxInput}`);
}

function samplePoint(tracker: EvaluationTracker, noun: bigint, verb: bigint): ProbeSample {
  const inputs: GravityAssistInputs = Object.freeze({ noun, verb });
  return Object.freeze({ inputs, output: tracker.evaluate(inputs) });
}

function probeBasis(tracker: EvaluationTracker): BasisProbes {
  return Object.freeze([samplePoint(tracker, 0n, 0n), samplePoint(tracker, 1n, 0n), samplePoint(tracker, 0n, 1n)]) as BasisProbes;
}

function findZeroVerbSlopeCandidate(tracker: EvaluationTracker, basis: BasisProbes, config: GravityAssistSearchConfig): GravityAssistInputs | null {
  const intercept = basis[0].output;
  const nounSlope = basis[1].output - intercept;
  const delta = config.target - intercept;
  if (nounSlope === 0n) return delta === 0n ? basis[0].inputs : null;
  if (delta % nounSlope !== 0n) return null;
  const noun = delta / nounSlope;
  if (noun < 0n || noun > config.maxInput) return null;
  const candidate: GravityAssistInputs = Object.freeze({ noun, verb: 0n });
  return tracker.evaluate(candidate) === config.target ? candidate : null;
}

function findAffineCandidate(tracker: EvaluationTracker, basis: BasisProbes, config: GravityAssistSearchConfig): GravityAssistInputs | null {
  const intercept = basis[0].output;
  const nounSlope = basis[1].output - intercept;
  const verbSlope = basis[2].output - intercept;
  if (verbSlope === 0n) return findZeroVerbSlopeCandidate(tracker, basis, config);
  const delta = config.target - intercept;
  for (let noun = 0n; noun <= config.maxInput; noun += 1n) {
    const rem = delta - nounSlope * noun;
    if (rem % verbSlope !== 0n) continue;
    const verb = rem / verbSlope;
    if (verb < 0n || verb > config.maxInput) continue;
    const candidate: GravityAssistInputs = Object.freeze({ noun, verb });
    return tracker.evaluate(candidate) === config.target ? candidate : null;
  }
  return null;
}

function runExhaustiveFallback(tracker: EvaluationTracker, config: GravityAssistSearchConfig): GravityAssistInputs {
  for (let noun = 0n; noun <= config.maxInput; noun += 1n) {
    for (let verb = 0n; verb <= config.maxInput; verb += 1n) {
      const candidate: GravityAssistInputs = Object.freeze({ noun, verb });
      if (tracker.evaluate(candidate) === config.target) return candidate;
    }
  }
  throw new Error(`No (noun, verb) pair in [0..${config.maxInput}]^2 produced ${config.target}`);
}

/** Finds the lowest-noun (noun, verb) pair producing config.target via 3-point affine inference with exhaustive fallback. */
export function findGravityAssistMatch(program: IntcodeProgram, config: GravityAssistSearchConfig): GravityAssistMatch {
  validateSearchConfig(config);
  const tracker = new EvaluationTracker(program);
  const basis = probeBasis(tracker);
  const affineMatch = findAffineCandidate(tracker, basis, config);
  if (affineMatch !== null) return new GravityAssistMatch(affineMatch, config.target, 'affine', tracker.count, basis);
  const fallbackMatch = runExhaustiveFallback(tracker, config);
  return new GravityAssistMatch(fallbackMatch, config.target, 'exhaustive', tracker.count, basis);
}
