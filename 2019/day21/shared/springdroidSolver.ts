import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { parseIntcodeProgram, type IntcodeProgram } from '../../shared/intcode';
import { DEMO_RUN_HULLS, DEMO_WALK_HULLS } from './exampleProgram';
import { simulateHullCrossing, type HullTick } from './hullSimulator';
import { extractHullDamage, runSpringdroidProgram } from './springdroidRunner';
import { SpringscriptProgram, type SpringdroidMode } from './springscript';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface SpringdroidPolicy {
  readonly id: 'walk' | 'run';
  readonly label: string;
  readonly formula: string;
  readonly program: SpringscriptProgram;
  readonly demoHulls: readonly string[];
}

export interface SpringdroidTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly scenarioIndex: number;
  readonly scenarioCount: number;
  readonly mode: SpringdroidMode;
  readonly hull: string;
  readonly tick: HullTick;
  readonly crossed: boolean;
  readonly asciiLog: string;
  readonly hullDamage: bigint;
  readonly vmSteps: number;
}

interface ScenarioEntry {
  readonly scenarioIndex: number;
  readonly hull: string;
  readonly tick: HullTick;
  readonly crossed: boolean;
}

export const WALK_POLICY: SpringdroidPolicy = Object.freeze({
  id: 'walk',
  label: 'Part 1 · WALK',
  formula: 'J = !(A && B && C) && D',
  program: new SpringscriptProgram('WALK', [
    { op: 'OR', x: 'A', y: 'J' },
    { op: 'AND', x: 'B', y: 'J' },
    { op: 'AND', x: 'C', y: 'J' },
    { op: 'NOT', x: 'J', y: 'J' },
    { op: 'AND', x: 'D', y: 'J' },
  ]),
  demoHulls: DEMO_WALK_HULLS,
});

export const RUN_POLICY: SpringdroidPolicy = Object.freeze({
  id: 'run',
  label: 'Part 2 · RUN',
  formula: 'J = !(A && B && C) && D && (E || H)',
  program: new SpringscriptProgram('RUN', [
    { op: 'OR', x: 'A', y: 'J' },
    { op: 'AND', x: 'B', y: 'J' },
    { op: 'AND', x: 'C', y: 'J' },
    { op: 'NOT', x: 'J', y: 'J' },
    { op: 'AND', x: 'D', y: 'J' },
    { op: 'OR', x: 'E', y: 'T' },
    { op: 'OR', x: 'H', y: 'T' },
    { op: 'AND', x: 'T', y: 'J' },
  ]),
  demoHulls: DEMO_RUN_HULLS,
});

function collectScenarioEntries(policy: SpringdroidPolicy): readonly ScenarioEntry[] {
  const entries: ScenarioEntry[] = [];
  for (let s = 0; s < policy.demoHulls.length; s += 1) {
    const hull = policy.demoHulls[s]!;
    const sim = simulateHullCrossing(hull, policy.program);
    for (const tick of sim.ticks) {
      entries.push(Object.freeze({ scenarioIndex: s, hull, tick, crossed: sim.crossed }));
    }
  }
  return Object.freeze(entries);
}

/** Shared PuzzleSolver for Day 21 Parts 1 and 2 parameterized by SpringdroidPolicy. */
export class SpringdroidSolver implements PuzzleSolver<IntcodeProgram, bigint, SpringdroidTraceFrame> {
  readonly policy: SpringdroidPolicy;

  constructor(policy: SpringdroidPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): IntcodeProgram {
    return parseIntcodeProgram(raw);
  }

  solve(program: IntcodeProgram): bigint {
    return extractHullDamage(runSpringdroidProgram(program, this.policy.program));
  }

  trace(program: IntcodeProgram, options?: TraceOptions): readonly SpringdroidTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const runResult = runSpringdroidProgram(program, this.policy.program);
    const hullDamage = extractHullDamage(runResult);
    const entries = collectScenarioEntries(this.policy);
    const indices = sampleTraceIndices(entries.length, maxSteps);
    const scenarioCount = this.policy.demoHulls.length;
    const frames: SpringdroidTraceFrame[] = [];
    for (const idx of indices) {
      const entry = entries[idx]!;
      frames.push(
        Object.freeze({
          stepIndex: idx,
          totalSteps: entries.length,
          scenarioIndex: entry.scenarioIndex,
          scenarioCount,
          mode: this.policy.program.mode,
          hull: entry.hull,
          tick: entry.tick,
          crossed: entry.crossed,
          asciiLog: runResult.asciiLog,
          hullDamage,
          vmSteps: runResult.vmSteps,
        }),
      );
    }
    return Object.freeze(frames);
  }
}
