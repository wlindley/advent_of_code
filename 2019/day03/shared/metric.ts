import type { WireCrossing } from './types';

export interface CrossingMetric {
  readonly name: string;
  score(crossing: WireCrossing): bigint;
}

export const MANHATTAN_METRIC: CrossingMetric = Object.freeze({
  name: 'Manhattan distance',
  score: (crossing: WireCrossing): bigint => crossing.manhattanDistance,
});

export const SIGNAL_DELAY_METRIC: CrossingMetric = Object.freeze({
  name: 'Signal delay',
  score: (crossing: WireCrossing): bigint => crossing.signalDelay,
});
