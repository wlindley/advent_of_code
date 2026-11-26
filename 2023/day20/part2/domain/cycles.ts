import { lcmBigInt } from '../../../../shared/core';
import type { CircuitBlueprint, PulseEvent } from '../../shared';

export interface FeederObservation {
  readonly input: string;
  readonly firstPress: number | null;
  readonly secondPress: number | null;
}

export type FeederHitRecord =
  | { readonly kind: 'first'; readonly input: string; readonly press: number }
  | { readonly kind: 'second'; readonly input: string; readonly press: number; readonly period: number };

/** Tracks zero-phase high-pulse periods for each input feeding a target's conjunction gate. */
export class FeederCycleTracker {
  readonly feeder: string;
  readonly target: string;
  readonly inputs: readonly string[];
  private readonly firstHits = new Map<string, number>();
  private readonly secondHits = new Map<string, number>();

  private constructor(feeder: string, target: string, inputs: readonly string[]) {
    this.feeder = feeder;
    this.target = target;
    this.inputs = inputs;
  }

  static forTarget(blueprint: CircuitBlueprint, target: string): FeederCycleTracker | null {
    if (!blueprint.hasModule(target)) return null;
    const targetInputs = blueprint.inputsOf(target);
    if (targetInputs.length !== 1) return null;
    const feeder = targetInputs[0]!;
    if (blueprint.specOf(feeder).kind !== 'conjunction') return null;
    const feederInputs = blueprint.inputsOf(feeder);
    if (feederInputs.length < 2) return null;
    return new FeederCycleTracker(feeder, target, feederInputs);
  }

  get observations(): readonly FeederObservation[] {
    const list: FeederObservation[] = [];
    for (const input of this.inputs) {
      list.push(
        Object.freeze({
          input,
          firstPress: this.firstHits.get(input) ?? null,
          secondPress: this.secondHits.get(input) ?? null,
        }),
      );
    }
    return Object.freeze(list);
  }

  get isComplete(): boolean {
    return this.secondHits.size === this.inputs.length;
  }

  record(event: PulseEvent): FeederHitRecord | null {
    if (event.to !== this.feeder || event.pulse !== 'high') return null;
    if (!this.inputs.includes(event.from)) return null;
    const first = this.firstHits.get(event.from);
    if (first === undefined) {
      this.firstHits.set(event.from, event.press);
      return Object.freeze({ kind: 'first', input: event.from, press: event.press });
    }
    if (event.press === first || this.secondHits.has(event.from)) return null;
    const period = event.press - first;
    if (period !== first) {
      throw new Error(
        `Non-zero-phase cycle on "${event.from}" -> "${this.feeder}": first=${first}, second=${event.press}, period=${period}`,
      );
    }
    this.secondHits.set(event.from, event.press);
    return Object.freeze({ kind: 'second', input: event.from, press: event.press, period });
  }

  computeLcm(): bigint {
    if (!this.isComplete) {
      throw new Error(`Cannot compute LCM before all "${this.feeder}" feeder cycles are verified`);
    }
    let result = 1n;
    for (const input of this.inputs) {
      result = lcmBigInt(result, BigInt(this.firstHits.get(input)!));
    }
    return result;
  }

  formatPeriods(): string {
    const parts: string[] = [];
    for (const input of this.inputs) {
      const periodText = this.secondHits.has(input) ? String(this.firstHits.get(input)!) : '?';
      parts.push(`${input}=${periodText}`);
    }
    return parts.join(', ');
  }
}
