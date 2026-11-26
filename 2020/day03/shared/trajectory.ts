import { ForestMap } from './forest';
import { LandingStep, Slope, validateSlopes } from './slope';

/** Immutable record of every toboggan landing along one slope. */
export class TrajectoryRun {
  readonly #slope: Slope;
  readonly #landings: readonly LandingStep[];

  constructor(slope: Slope, landings: readonly LandingStep[]) {
    for (let i = 0; i < landings.length; i += 1) {
      if (landings[i]!.slope !== slope) {
        throw new RangeError(`Landing at index ${i} has slope ${landings[i]!.slope.label}, expected ${slope.label}`);
      }
    }
    this.#slope = slope;
    this.#landings = Object.freeze(landings.slice());
    Object.freeze(this);
  }

  get slope(): Slope {
    return this.#slope;
  }

  get landings(): readonly LandingStep[] {
    return this.#landings;
  }

  get totalSteps(): number {
    return this.#landings.length;
  }

  get treeCount(): number {
    let trees = 0;
    for (let i = 0; i < this.#landings.length; i += 1) {
      if (this.#landings[i]!.isTree) trees += 1;
    }
    return trees;
  }

  get openCount(): number {
    return this.totalSteps - this.treeCount;
  }
}

/** Evaluates all landings after `(0, 0)` along `slope` on `forest`. */
export function evaluateTrajectory(forest: ForestMap, slope: Slope): TrajectoryRun {
  const totalSteps = slope.stepCountForRows(forest.rows);
  const landings: LandingStep[] = [];
  for (let stepIndex = 1; stepIndex <= totalSteps; stepIndex += 1) {
    const row = stepIndex * slope.down;
    const col = stepIndex * slope.right;
    landings.push(new LandingStep(stepIndex, slope, forest.cols, forest.hasTreeAt(row, col)));
  }
  return new TrajectoryRun(slope, landings);
}

/** Counts tree landings after `(0, 0)` using modular column stride in O(rows / down) time. */
export function countTreesOnSlope(forest: ForestMap, slope: Slope): number {
  const stepRight = slope.right % forest.cols;
  let row = slope.down;
  let col = stepRight;
  let trees = 0;
  while (row < forest.rows) {
    if (forest.hasTreeAt(row, col)) trees += 1;
    row += slope.down;
    col = (col + stepRight) % forest.cols;
  }
  return trees;
}

/** Multiplies tree counts across all validated slopes into an exact `bigint` product. */
export function multiplySlopeTreeCounts(forest: ForestMap, slopes: readonly Slope[]): bigint {
  const validSlopes = validateSlopes(slopes);
  let product = 1n;
  for (let i = 0; i < validSlopes.length; i += 1) {
    product *= BigInt(countTreesOnSlope(forest, validSlopes[i]!));
  }
  return product;
}
