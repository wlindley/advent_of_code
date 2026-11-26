export const ALPHABET_SIZE = 26;
export const ASCII_LOWER_A = 97;

const LOWERCASE_ASCII_RE = /^[a-z]+$/;
const LINE_BREAK_RE = /[\r\n]/;

function validateSignal(signal: string): string {
  if (signal.length === 0) {
    throw new RangeError('Datastream signal must be non-empty');
  }
  if (LINE_BREAK_RE.test(signal)) {
    throw new RangeError('Datastream signal must be a single line');
  }
  if (!LOWERCASE_ASCII_RE.test(signal)) {
    throw new RangeError('Datastream signal must contain only lowercase ASCII letters a-z');
  }
  return signal;
}

/** Validated, immutable single-line lowercase ASCII datastream buffer. */
export class DatastreamBuffer {
  readonly signal: string;

  constructor(signal: string) {
    this.signal = validateSignal(signal);
    Object.freeze(this);
  }

  get length(): number {
    return this.signal.length;
  }
}

/** Trims surrounding whitespace and constructs a validated `DatastreamBuffer`. */
export function parseDatastream(raw: string): DatastreamBuffer {
  return new DatastreamBuffer(raw.trim());
}
