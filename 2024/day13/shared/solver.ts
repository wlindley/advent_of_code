import { ceilDiv, floorDiv } from '../../../shared/core';
import type { ClawMachine } from './machine';
import {
  type ClawConfig,
  ClawSolution,
  type MachineOutcome,
  type UnwinnableReason,
  type Vector2D,
} from './types';

function unwinnable(reason: UnwinnableReason): MachineOutcome {
  return Object.freeze({ winnable: false, reason });
}

function winnable(pressesA: bigint, pressesB: bigint): MachineOutcome {
  return Object.freeze({ winnable: true, solution: new ClawSolution(pressesA, pressesB) });
}

function extendedGcd(a: bigint, b: bigint): {
  readonly g: bigint;
  readonly x: bigint;
  readonly y: bigint;
} {
  let oldR = a;
  let r = b;
  let oldS = 1n;
  let s = 0n;
  let oldT = 0n;
  let t = 1n;

  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return { g: oldR, x: oldS, y: oldT };
}

type KBoundsResult =
  | { readonly ok: true; readonly kMin: bigint; readonly kMax: bigint }
  | { readonly ok: false; readonly reason: UnwinnableReason };

function feasibleKBounds(
  a0: bigint,
  b0: bigint,
  aStep: bigint,
  bStep: bigint,
  maxPresses: bigint | null,
): KBoundsResult {
  // All integer solutions satisfy a(k) = a0 + k * aStep >= 0 and b(k) = b0 - k * bStep >= 0.
  let kMin = ceilDiv(-a0, aStep);
  let kMax = floorDiv(b0, bStep);
  if (kMin > kMax) return { ok: false, reason: 'negative-presses' };

  if (maxPresses !== null) {
    const bCapMin = ceilDiv(b0 - maxPresses, bStep);
    const aCapMax = floorDiv(maxPresses - a0, aStep);
    if (bCapMin > kMin) kMin = bCapMin;
    if (aCapMax < kMax) kMax = aCapMax;
    if (kMin > kMax) return { ok: false, reason: 'exceeds-press-limit' };
  }
  return { ok: true, kMin, kMax };
}

function solveNonSingular(
  machine: ClawMachine,
  target: Vector2D,
  det: bigint,
  maxPresses: bigint | null,
): MachineOutcome {
  const numA = target.cross(machine.buttonB);
  const numB = machine.buttonA.cross(target);
  if (numA % det !== 0n || numB % det !== 0n) return unwinnable('non-integer');

  const a = numA / det;
  const b = numB / det;
  if (a < 0n || b < 0n) return unwinnable('negative-presses');
  if (maxPresses !== null && (a > maxPresses || b > maxPresses)) {
    return unwinnable('exceeds-press-limit');
  }
  return winnable(a, b);
}

function solveCollinear(
  machine: ClawMachine,
  target: Vector2D,
  maxPresses: bigint | null,
): MachineOutcome {
  if (machine.buttonA.cross(target) !== 0n) return unwinnable('off-ray');

  const ax = machine.buttonA.x;
  const bx = machine.buttonB.x;
  const { g, x, y } = extendedGcd(ax, bx);
  if (target.x % g !== 0n) return unwinnable('non-integer');

  const aStep = bx / g;
  const bStep = ax / g;
  const scale = target.x / g;
  const a0 = x * scale;
  const b0 = y * scale;

  const bounds = feasibleKBounds(a0, b0, aStep, bStep, maxPresses);
  if (!bounds.ok) return unwinnable(bounds.reason);

  // Cost slope is 3*aStep - bStep per unit increase in k; choose endpoint minimizing cost.
  const bestK = 3n * aStep < bStep ? bounds.kMax : bounds.kMin;
  return winnable(a0 + bestK * aStep, b0 - bestK * bStep);
}

/** Solves a single claw machine exactly under `config`, handling both unique and collinear cases. */
export function solveClawMachine(machine: ClawMachine, config: ClawConfig): MachineOutcome {
  const target = machine.targetPrize(config);
  const det = machine.determinant;
  return det !== 0n
    ? solveNonSingular(machine, target, det, config.maxPresses)
    : solveCollinear(machine, target, config.maxPresses);
}
