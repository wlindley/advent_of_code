import { CrabFleet } from './fleet';

const INTEGER_TOKEN = /^-?\d+$/;

function parsePositionToken(rawToken: string): bigint {
  const token = rawToken.trim();
  if (!INTEGER_TOKEN.test(token)) {
    throw new SyntaxError(`Invalid crab position token: "${token}"`);
  }
  return BigInt(token);
}

/** Parses a single-line comma-separated list of integer crab positions. */
export function parseCrabFleet(raw: string): CrabFleet {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new RangeError('Input must contain at least one crab position');
  }
  if (/[\r\n]/.test(trimmed)) {
    throw new SyntaxError('Input must be a single line of comma-separated positions');
  }
  const positions = trimmed.split(',').map(parsePositionToken);
  return new CrabFleet(positions);
}
