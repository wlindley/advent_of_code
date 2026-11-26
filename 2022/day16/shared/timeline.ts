import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { CompressedValveNetwork } from './compressedNetwork';
import type { ValveSchedule } from './pressureSearch';

export const DEFAULT_MAX_TRACE_STEPS = 64;

export interface AgentRoute {
  readonly label: string;
  readonly schedule: ValveSchedule;
}

export type AgentStatus = 'idle' | 'moving' | 'opening';

export interface AgentSnapshot {
  readonly label: string;
  readonly status: AgentStatus;
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly progress: number;
  readonly openedCount: number;
}

export interface ValveTimelineFrame {
  readonly minute: number;
  readonly timeLimit: number;
  readonly openedMask: number;
  readonly activeFlowRate: number;
  readonly cumulativePressure: number;
  readonly agents: readonly AgentSnapshot[];
}

function validateRoutes(routes: readonly AgentRoute[], timeLimit: number): void {
  if (routes.length === 0) throw new Error('At least one route is required');
  let combinedMask = 0;
  for (const route of routes) {
    if (route.schedule.timeLimit !== timeLimit) {
      throw new RangeError(`Route timeLimit ${route.schedule.timeLimit} does not match ${timeLimit}`);
    }
    const mask = route.schedule.openedMask;
    if ((combinedMask & mask) !== 0) {
      throw new Error('Routes must open disjoint valves');
    }
    combinedMask |= mask;
  }
}

function snapshotAgentAtMinute(route: AgentRoute, startIndex: number, minute: number): AgentSnapshot {
  let prevIndex = startIndex;
  let openedCount = 0;
  for (const step of route.schedule.steps) {
    const departMinute = step.openedAtMinute - step.travelMinutes - 1;
    if (departMinute < minute && minute <= departMinute + step.travelMinutes) {
      return Object.freeze({
        label: route.label,
        status: 'moving',
        fromIndex: prevIndex,
        toIndex: step.valveIndex,
        progress: (minute - departMinute) / step.travelMinutes,
        openedCount,
      });
    }
    if (minute === step.openedAtMinute) {
      return Object.freeze({
        label: route.label,
        status: 'opening',
        fromIndex: step.valveIndex,
        toIndex: step.valveIndex,
        progress: 1,
        openedCount: openedCount + 1,
      });
    }
    if (minute > step.openedAtMinute) {
      openedCount++;
      prevIndex = step.valveIndex;
    }
  }
  return Object.freeze({
    label: route.label,
    status: 'idle',
    fromIndex: prevIndex,
    toIndex: prevIndex,
    progress: 0,
    openedCount,
  });
}

function buildFrameAtMinute(
  compressed: CompressedValveNetwork,
  routes: readonly AgentRoute[],
  timeLimit: number,
  minute: number,
): ValveTimelineFrame {
  let openedMask = 0;
  let activeFlowRate = 0;
  let cumulativePressure = 0;
  for (const route of routes) {
    for (const step of route.schedule.steps) {
      if (minute >= step.openedAtMinute) {
        openedMask |= 1 << step.valveIndex;
        activeFlowRate += step.flowRate;
        cumulativePressure += step.flowRate * (minute - step.openedAtMinute);
      }
    }
  }
  const agents = Object.freeze(routes.map((r) => snapshotAgentAtMinute(r, compressed.startIndex, minute)));
  return Object.freeze({ minute, timeLimit, openedMask, activeFlowRate, cumulativePressure, agents });
}

/** Builds sampled minute-by-minute frames across one or more disjoint agent schedules. */
export function buildValveTimeline(
  compressed: CompressedValveNetwork,
  routes: readonly AgentRoute[],
  timeLimit: number,
  options?: TraceOptions,
): readonly ValveTimelineFrame[] {
  validateRoutes(routes, timeLimit);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const minutes = sampleTraceIndices(timeLimit + 1, limit);
  return Object.freeze(minutes.map((minute) => buildFrameAtMinute(compressed, routes, timeLimit, minute)));
}
