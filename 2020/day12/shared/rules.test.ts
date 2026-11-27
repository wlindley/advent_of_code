import { describe, expect, it } from 'vitest';
import { NavigationInstruction, parseNavigationInstructions, ShipState, Vec2 } from './model';
import {
  HEADING_NAVIGATION_RULE,
  simulateNavigation,
  stepNavigation,
  WAYPOINT_NAVIGATION_RULE,
} from './rules';

const EXAMPLE_INPUT = ['F10', 'N3', 'F7', 'R90', 'F11'].join('\n');

describe('2020 Day 12 shared rules', () => {
  it('steps every cardinal, turn, and forward action under HEADING_NAVIGATION_RULE', () => {
    let state = ShipState.initial(HEADING_NAVIGATION_RULE.initialVector);
    expect(state.vector).toEqual(new Vec2(1n, 0n));

    state = stepNavigation(state, new NavigationInstruction('N', 3n), HEADING_NAVIGATION_RULE);
    expect(state.position).toEqual(new Vec2(0n, 3n));
    state = stepNavigation(state, new NavigationInstruction('S', 1n), HEADING_NAVIGATION_RULE);
    expect(state.position).toEqual(new Vec2(0n, 2n));
    state = stepNavigation(state, new NavigationInstruction('E', 5n), HEADING_NAVIGATION_RULE);
    expect(state.position).toEqual(new Vec2(5n, 2n));
    state = stepNavigation(state, new NavigationInstruction('W', 2n), HEADING_NAVIGATION_RULE);
    expect(state.position).toEqual(new Vec2(3n, 2n));

    state = stepNavigation(state, new NavigationInstruction('L', 90n), HEADING_NAVIGATION_RULE);
    expect(state.vector).toEqual(new Vec2(0n, 1n));
    state = stepNavigation(state, new NavigationInstruction('L', 360n), HEADING_NAVIGATION_RULE);
    expect(state.vector).toEqual(new Vec2(0n, 1n));
    state = stepNavigation(state, new NavigationInstruction('R', 180n), HEADING_NAVIGATION_RULE);
    expect(state.vector).toEqual(new Vec2(0n, -1n));
    state = stepNavigation(state, new NavigationInstruction('F', 4n), HEADING_NAVIGATION_RULE);
    expect(state.position).toEqual(new Vec2(3n, -2n));
  });

  it('steps every cardinal, turn, and forward action under WAYPOINT_NAVIGATION_RULE', () => {
    let state = ShipState.initial(WAYPOINT_NAVIGATION_RULE.initialVector);
    expect(state.vector).toEqual(new Vec2(10n, 1n));

    state = stepNavigation(state, new NavigationInstruction('N', 3n), WAYPOINT_NAVIGATION_RULE);
    expect(state.position).toEqual(Vec2.ORIGIN);
    expect(state.vector).toEqual(new Vec2(10n, 4n));

    state = stepNavigation(state, new NavigationInstruction('S', 1n), WAYPOINT_NAVIGATION_RULE);
    expect(state.vector).toEqual(new Vec2(10n, 3n));
    state = stepNavigation(state, new NavigationInstruction('E', 2n), WAYPOINT_NAVIGATION_RULE);
    expect(state.vector).toEqual(new Vec2(12n, 3n));
    state = stepNavigation(state, new NavigationInstruction('W', 2n), WAYPOINT_NAVIGATION_RULE);
    expect(state.vector).toEqual(new Vec2(10n, 3n));

    state = stepNavigation(state, new NavigationInstruction('R', 90n), WAYPOINT_NAVIGATION_RULE);
    expect(state.vector).toEqual(new Vec2(3n, -10n));
    state = stepNavigation(state, new NavigationInstruction('L', 270n), WAYPOINT_NAVIGATION_RULE);
    expect(state.vector).toEqual(new Vec2(-10n, -3n));
    state = stepNavigation(state, new NavigationInstruction('F', 2n), WAYPOINT_NAVIGATION_RULE);
    expect(state.position).toEqual(new Vec2(-20n, -6n));
  });

  it('simulates the official example under both rules', () => {
    const instructions = parseNavigationInstructions(EXAMPLE_INPUT);

    const part1 = simulateNavigation(instructions, HEADING_NAVIGATION_RULE);
    expect(part1.position).toEqual(new Vec2(17n, -8n));
    expect(part1.manhattanDistance).toBe(25n);

    const part2 = simulateNavigation(instructions, WAYPOINT_NAVIGATION_RULE);
    expect(part2.position).toEqual(new Vec2(214n, -72n));
    expect(part2.manhattanDistance).toBe(286n);
  });

  it('handles empty instruction list and huge BigInt turns cleanly', () => {
    expect(simulateNavigation([], HEADING_NAVIGATION_RULE)).toEqual(
      ShipState.initial(HEADING_NAVIGATION_RULE.initialVector),
    );
    const huge = [
      new NavigationInstruction('R', 90n * (10n ** 40n + 1n)),
      new NavigationInstruction('F', 10n ** 30n),
    ];
    const finalState = simulateNavigation(huge, HEADING_NAVIGATION_RULE);
    expect(finalState.vector).toEqual(new Vec2(0n, -1n));
    expect(finalState.manhattanDistance).toBe(10n ** 30n);
  });
});
