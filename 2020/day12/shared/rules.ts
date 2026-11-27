import {
  NavigationInstruction,
  ShipState,
  Vec2,
  type NavigationAction,
  type QuarterTurn,
} from './model';

/** Identifier for the two AoC 2020 Day 12 navigation interpretations. */
export type NavigationRuleId = 'heading' | 'waypoint';

/** Strategy defining initial steering vector and how cardinal moves apply. */
export interface NavigationRule {
  readonly id: NavigationRuleId;
  readonly label: string;
  readonly vectorLabel: string;
  readonly initialVector: Vec2;
  applyCardinal(state: ShipState, delta: Vec2): ShipState;
}

/** Part 1 rule: cardinal moves translate the ship directly; heading starts East (1, 0). */
export const HEADING_NAVIGATION_RULE: NavigationRule = Object.freeze({
  id: 'heading',
  label: 'Ship Heading',
  vectorLabel: 'Heading',
  initialVector: new Vec2(1n, 0n),
  applyCardinal: (state: ShipState, delta: Vec2) => state.withPosition(state.position.add(delta)),
});

/** Part 2 rule: cardinal moves shift the waypoint; waypoint starts (10E, 1N). */
export const WAYPOINT_NAVIGATION_RULE: NavigationRule = Object.freeze({
  id: 'waypoint',
  label: 'Waypoint Offset',
  vectorLabel: 'Waypoint',
  initialVector: new Vec2(10n, 1n),
  applyCardinal: (state: ShipState, delta: Vec2) => state.withVector(state.vector.add(delta)),
});

function toClockwiseTurns(degrees: bigint): QuarterTurn {
  return Number((degrees / 90n) % 4n) as QuarterTurn;
}

function toCounterClockwiseTurns(degrees: bigint): QuarterTurn {
  return ((4 - toClockwiseTurns(degrees)) % 4) as QuarterTurn;
}

type StepHandler = (state: ShipState, value: bigint, rule: NavigationRule) => ShipState;

const STEP_HANDLERS: Record<NavigationAction, StepHandler> = {
  N: (state, value, rule) => rule.applyCardinal(state, new Vec2(0n, value)),
  S: (state, value, rule) => rule.applyCardinal(state, new Vec2(0n, -value)),
  E: (state, value, rule) => rule.applyCardinal(state, new Vec2(value, 0n)),
  W: (state, value, rule) => rule.applyCardinal(state, new Vec2(-value, 0n)),
  R: (state, value) => state.withVector(state.vector.rotateCw(toClockwiseTurns(value))),
  L: (state, value) => state.withVector(state.vector.rotateCw(toCounterClockwiseTurns(value))),
  F: (state, value) => state.withPosition(state.position.add(state.vector.scale(value))),
};

/** Applies one validated navigation instruction to a ship state under `rule`. */
export function stepNavigation(
  state: ShipState,
  instruction: NavigationInstruction,
  rule: NavigationRule,
): ShipState {
  return STEP_HANDLERS[instruction.action](state, instruction.value, rule);
}

/** Runs a full navigation instruction sequence from the origin under `rule`. */
export function simulateNavigation(
  instructions: readonly NavigationInstruction[],
  rule: NavigationRule,
): ShipState {
  let state = ShipState.initial(rule.initialVector);
  for (const instruction of instructions) {
    state = stepNavigation(state, instruction, rule);
  }
  return state;
}
