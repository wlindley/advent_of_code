import { LanternfishSchool, TIMER_BUCKETS, type TimerBucket } from './school';

const DIGITS_ONLY = /^\d+$/;

function parseTimerToken(rawToken: string): TimerBucket {
  const token = rawToken.trim();
  if (!DIGITS_ONLY.test(token)) {
    throw new SyntaxError(`Invalid lanternfish timer token: "${token}"`);
  }
  const bucket = TIMER_BUCKETS[Number(token)];
  if (bucket === undefined) {
    throw new RangeError(`Lanternfish timer must be between 0 and 8, got ${token}`);
  }
  return bucket;
}

/** Parses comma-separated initial lanternfish timers into an immutable `LanternfishSchool`. */
export function parseLanternfishSchool(raw: string): LanternfishSchool {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new RangeError('Lanternfish input must not be empty');
  }
  const timers = trimmed.split(',').map(parseTimerToken);
  return LanternfishSchool.fromTimers(timers);
}
