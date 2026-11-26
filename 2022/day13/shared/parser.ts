import { PacketInt, PacketList, PacketPair, type PacketValue, SignalInput } from './packet';

export const MAX_PACKET_DEPTH = 128;

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9';
}

class PacketCursor {
  private pos = 0;

  constructor(private readonly source: string) {}

  get isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  peek(): string | undefined {
    return this.source[this.pos];
  }

  parseList(depth: number): PacketList {
    if (depth > MAX_PACKET_DEPTH) {
      throw new RangeError(`Packet nesting exceeds max depth ${MAX_PACKET_DEPTH}`);
    }
    if (this.peek() !== '[') {
      throw new SyntaxError(`Expected '[' at position ${this.pos}`);
    }
    this.pos += 1;
    const items: PacketValue[] = [];
    if (this.peek() === ']') {
      this.pos += 1;
      return new PacketList(items);
    }
    while (true) {
      items.push(this.parseValue(depth + 1));
      const sep = this.peek();
      if (sep === ',') {
        this.pos += 1;
        continue;
      }
      if (sep === ']') {
        this.pos += 1;
        return new PacketList(items);
      }
      throw new SyntaxError(`Expected ',' or ']' at position ${this.pos}`);
    }
  }

  private parseValue(depth: number): PacketValue {
    const ch = this.peek();
    if (ch === '[') {
      return this.parseList(depth);
    }
    if (isDigit(ch)) {
      return this.parseInt();
    }
    throw new SyntaxError(`Unexpected token '${ch ?? 'EOF'}' at position ${this.pos}`);
  }

  private parseInt(): PacketInt {
    const start = this.pos;
    while (isDigit(this.peek())) {
      this.pos += 1;
    }
    const raw = this.source.slice(start, this.pos);
    if (raw.length > 1 && raw[0] === '0') {
      throw new SyntaxError(`Leading zero in integer '${raw}' at position ${start}`);
    }
    return new PacketInt(Number(raw));
  }
}

/** Parses a single distress signal packet line into a frozen `PacketList` AST. */
export function parsePacket(line: string): PacketList {
  const cursor = new PacketCursor(line);
  const packet = cursor.parseList(0);
  if (!cursor.isAtEnd) {
    throw new SyntaxError(`Unexpected trailing character '${cursor.peek()}'`);
  }
  return packet;
}

/** Parses blank-line-separated pairs of distress signal packets into `SignalInput`. */
export function parseSignalInput(raw: string): SignalInput {
  const normalized = raw.replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
  if (normalized.length === 0) {
    throw new Error('Signal input must not be empty');
  }
  const blocks = normalized.split('\n\n');
  const pairs: PacketPair[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const lines = blocks[i]!.split('\n');
    if (lines.length !== 2) {
      throw new Error(`Pair ${i + 1} must contain exactly 2 lines, got ${lines.length}`);
    }
    pairs.push(new PacketPair(parsePacket(lines[0]!), parsePacket(lines[1]!)));
  }
  return new SignalInput(pairs);
}
