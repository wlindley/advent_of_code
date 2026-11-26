import { Rational } from '../../../shared/core';
import { AffineExpr, BINARY_OPERATORS, type BinaryOp } from './operators';
import { type MonkeyJob, type MonkeyRiddle, type OperationJob } from './riddle';

export const DEFAULT_ROOT_NAME = 'root';
export const DEFAULT_UNKNOWN_NAME = 'humn';

export interface InversionStep {
  readonly node: string;
  readonly op: BinaryOp | '=';
  readonly unknownChild: string;
  readonly knownChild: string;
  readonly knownSide: 'left' | 'right';
  readonly knownValue: Rational;
  readonly targetBefore: Rational;
  readonly targetAfter: Rational;
}

export interface EqualitySolution {
  readonly unknownValue: bigint;
  readonly unknownRational: Rational;
  readonly unknownOccurrences: bigint;
  readonly steps: readonly InversionStep[];
  readonly constants: ReadonlyMap<string, Rational>;
}

/** Converts an exact integer Rational to `bigint`, throwing if non-integral. */
export function toExactBigInt(value: Rational): bigint {
  if (value.den !== 1n) throw new RangeError(`Expected exact integer value, got ${value.toString()}`);
  return value.num;
}

function evalRationalJob(job: MonkeyJob, values: ReadonlyMap<string, Rational>): Rational {
  if (job.kind === 'literal') return new Rational(job.value);
  return BINARY_OPERATORS[job.op].apply(values.get(job.left)!, values.get(job.right)!);
}

/** Evaluates all monkeys reachable from `rootName` bottom-up as exact Rationals. */
export function evaluateAllMonkeys(riddle: MonkeyRiddle, rootName: string): ReadonlyMap<string, Rational> {
  const values = new Map<string, Rational>();
  for (const name of riddle.reachableBottomUp(rootName)) values.set(name, evalRationalJob(riddle.require(name), values));
  return values;
}

/** Solves Part 1: the exact integer yelled by `rootName`. */
export function solveRootYell(riddle: MonkeyRiddle, rootName: string): bigint {
  return toExactBigInt(evaluateAllMonkeys(riddle, rootName).get(rootName)!);
}

/** Evaluates all monkeys reachable from `rootName` as affine expressions in `unknownName`. */
export function evaluateAllAffine(riddle: MonkeyRiddle, rootName: string, unknownName: string): ReadonlyMap<string, AffineExpr> {
  const exprs = new Map<string, AffineExpr>();
  for (const name of riddle.reachableBottomUp(rootName)) {
    if (name === unknownName) { exprs.set(name, AffineExpr.VARIABLE); continue; }
    const job = riddle.require(name);
    const expr = job.kind === 'literal'
      ? AffineExpr.constant(new Rational(job.value))
      : BINARY_OPERATORS[job.op].applyAffine(exprs.get(job.left)!, exprs.get(job.right)!);
    exprs.set(name, expr);
  }
  return exprs;
}

function countUnknownPaths(riddle: MonkeyRiddle, order: readonly string[], unknownName: string): ReadonlyMap<string, bigint> {
  const counts = new Map<string, bigint>();
  for (const name of order) {
    if (name === unknownName) { counts.set(name, 1n); continue; }
    const job = riddle.require(name);
    counts.set(name, job.kind === 'literal' ? 0n : counts.get(job.left)! + counts.get(job.right)!);
  }
  return counts;
}

function evaluateConstantsOnly(riddle: MonkeyRiddle, order: readonly string[], counts: ReadonlyMap<string, bigint>): ReadonlyMap<string, Rational> {
  const constants = new Map<string, Rational>();
  for (const name of order) {
    if (counts.get(name)! === 0n) constants.set(name, evalRationalJob(riddle.require(name), constants));
  }
  return constants;
}

function buildStep(
  job: OperationJob,
  op: BinaryOp | '=',
  targetBefore: Rational,
  counts: ReadonlyMap<string, bigint>,
  constants: ReadonlyMap<string, Rational>,
): InversionStep {
  const leftUnknown = counts.get(job.left)! === 1n;
  const knownChild = leftUnknown ? job.right : job.left;
  const unknownChild = leftUnknown ? job.left : job.right;
  const knownValue = constants.get(knownChild)!;
  const targetAfter = op === '='
    ? knownValue
    : leftUnknown
      ? BINARY_OPERATORS[op].invertLeft(targetBefore, knownValue)
      : BINARY_OPERATORS[op].invertRight(targetBefore, knownValue);
  return Object.freeze({
    node: job.name, op, unknownChild, knownChild,
    knownSide: leftUnknown ? 'right' : 'left',
    knownValue, targetBefore: op === '=' ? knownValue : targetBefore, targetAfter,
  });
}

function invertSinglePath(
  riddle: MonkeyRiddle,
  rootJob: OperationJob,
  counts: ReadonlyMap<string, bigint>,
  constants: ReadonlyMap<string, Rational>,
  unknownName: string,
): { readonly unknownRational: Rational; readonly steps: readonly InversionStep[] } {
  const first = buildStep(rootJob, '=', Rational.ZERO, counts, constants);
  const steps: InversionStep[] = [first];
  let current = first.unknownChild;
  let target = first.targetAfter;
  while (current !== unknownName) {
    const job = riddle.require(current) as OperationJob;
    const step = buildStep(job, job.op, target, counts, constants);
    steps.push(step);
    current = step.unknownChild;
    target = step.targetAfter;
  }
  return { unknownRational: target, steps: Object.freeze(steps) };
}

function solveMultiPathAffine(riddle: MonkeyRiddle, rootJob: OperationJob, unknownName: string): Rational {
  const l = evaluateAllAffine(riddle, rootJob.left, unknownName).get(rootJob.left)!;
  const r = evaluateAllAffine(riddle, rootJob.right, unknownName).get(rootJob.right)!;
  const diffSlope = l.slope.sub(r.slope);
  if (diffSlope.isZero) throw new Error(`Equality at "${rootJob.name}" has no unique solution`);
  return r.intercept.sub(l.intercept).div(diffSlope);
}

/** Solves Part 2 equality `left(unknown) = right(unknown)` with path-count dispatch. */
export function solveEqualitySolution(riddle: MonkeyRiddle, rootName: string, unknownName: string): EqualitySolution {
  if (rootName === unknownName) throw new Error('Root monkey cannot equal unknown monkey');
  const rootJob = riddle.require(rootName);
  if (rootJob.kind !== 'op') throw new Error(`Root monkey "${rootName}" must be an operation`);
  const order = riddle.reachableBottomUp(rootName);
  const counts = countUnknownPaths(riddle, order, unknownName);
  const constants = evaluateConstantsOnly(riddle, order, counts);
  const totalOccurrences = counts.get(rootName)!;
  if (totalOccurrences === 0n) throw new Error(`Unknown monkey "${unknownName}" does not affect "${rootName}"`);
  const solved = totalOccurrences === 1n
    ? invertSinglePath(riddle, rootJob, counts, constants, unknownName)
    : { unknownRational: solveMultiPathAffine(riddle, rootJob, unknownName), steps: Object.freeze([]) };
  return Object.freeze({
    unknownValue: toExactBigInt(solved.unknownRational), unknownRational: solved.unknownRational,
    unknownOccurrences: totalOccurrences, steps: solved.steps, constants,
  });
}

/** Solves Part 2: the exact integer value required for `unknownName`. */
export function solveEqualityUnknown(riddle: MonkeyRiddle, rootName: string, unknownName: string): bigint {
  return solveEqualitySolution(riddle, rootName, unknownName).unknownValue;
}
