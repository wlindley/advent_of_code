import { describe, expect, it } from 'vitest';
import { PartRating } from './partRating';
import { RatingBox } from './ratingBox';
import { ConditionalRule, Workflow } from './workflow';
import { WorkflowSystem } from './workflowSystem';

describe('WorkflowSystem', () => {
  it('constructs a frozen DAG system and exposes size and lookup', () => {
    const wfIn = new Workflow('in', [new ConditionalRule('x', '<', 10, 'sub')], 'R');
    const wfSub = new Workflow('sub', [], 'A');
    const system = new WorkflowSystem([wfIn, wfSub]);

    expect(Object.isFrozen(system)).toBe(true);
    expect(system.size).toBe(2);
    expect(system.workflow('in')).toBe(wfIn);
    expect(() => system.workflow('missing')).toThrow();
  });

  it('rejects duplicate names, missing entry, dangling targets, and cycles', () => {
    const dup = [new Workflow('in', [], 'A'), new Workflow('in', [], 'R')];
    expect(() => new WorkflowSystem(dup)).toThrow(/Duplicate/);

    expect(() => new WorkflowSystem([new Workflow('px', [], 'A')])).toThrow(/in/);

    const danglingRule = [new Workflow('in', [new ConditionalRule('x', '<', 5, 'ghost')], 'A')];
    expect(() => new WorkflowSystem(danglingRule)).toThrow(/ghost/);

    const danglingFallback = [new Workflow('in', [], 'ghost')];
    expect(() => new WorkflowSystem(danglingFallback)).toThrow(/ghost/);

    const selfLoop = [new Workflow('in', [new ConditionalRule('x', '<', 5, 'in')], 'A')];
    expect(() => new WorkflowSystem(selfLoop)).toThrow(/Cycle/);

    const twoCycle = [new Workflow('in', [], 'ab'), new Workflow('ab', [], 'in')];
    expect(() => new WorkflowSystem(twoCycle)).toThrow(/Cycle/);

    const unreachableCycle = [
      new Workflow('in', [], 'A'),
      new Workflow('aa', [], 'bb'),
      new Workflow('bb', [], 'aa'),
    ];
    expect(() => new WorkflowSystem(unreachableCycle)).toThrow(/Cycle/);
  });

  it('routes parts step-by-step and reports acceptance', () => {
    const system = new WorkflowSystem([
      new Workflow('in', [new ConditionalRule('s', '<', 10, 'px')], 'R'),
      new Workflow('px', [new ConditionalRule('x', '>', 5, 'A')], 'R'),
    ]);

    const accepted = new PartRating({ x: 6, m: 1, a: 1, s: 9 });
    const routeA = system.routePart(accepted);
    expect(routeA.outcome).toBe('A');
    expect(routeA.steps.map((s) => [s.workflowName, s.matchedRule?.format() ?? null, s.nextTarget])).toEqual([
      ['in', 's<10:px', 'px'],
      ['px', 'x>5:A', 'A'],
    ]);
    expect(system.isAccepted(accepted)).toBe(true);

    const rejected = new PartRating({ x: 6, m: 1, a: 1, s: 10 });
    const routeR = system.routePart(rejected);
    expect(routeR.outcome).toBe('R');
    expect(routeR.steps[0]?.matchedRule).toBeNull();
    expect(system.isAccepted(rejected)).toBe(false);
  });

  it('collects accepted boxes and short-circuits fallback when remaining is exhausted', () => {
    const skipFallback = new WorkflowSystem([
      new Workflow('in', [new ConditionalRule('x', '<', 100, 'R')], 'A'),
    ]);
    expect(skipFallback.collectAcceptedBoxes(RatingBox.uniform(1n, 50n))).toEqual([]);
    expect(skipFallback.countAcceptedCombinations(RatingBox.uniform(1n, 50n))).toBe(0n);

    const skipMatched = new WorkflowSystem([
      new Workflow('in', [new ConditionalRule('x', '<', 1, 'R')], 'A'),
    ]);
    expect(skipMatched.countAcceptedCombinations(RatingBox.uniform(1n, 5n))).toBe(625n);
  });
});
