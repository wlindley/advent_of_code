import { LinenLayout, assertValidStripeSequence } from './model';

function parsePatternLine(line: string): readonly string[] {
  const tokens = line.split(',');
  const seen = new Set<string>();
  const unique: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!.trim();
    assertValidStripeSequence(token, `pattern token #${i + 1}`);
    if (!seen.has(token)) {
      seen.add(token);
      unique.push(token);
    }
  }
  return unique;
}

function parseDesignLines(lines: readonly string[]): readonly string[] {
  const designs: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const design = lines[i]!.trim();
    assertValidStripeSequence(design, `design line #${i + 3}`);
    designs.push(design);
  }
  return designs;
}

/** Parses AoC Day 19 linen layout input (patterns line, blank separator, design lines). */
export function parseLinenLayout(raw: string): LinenLayout {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (normalized.length === 0) {
    throw new Error('Linen layout input must not be empty');
  }

  const lines = normalized.split('\n');
  if (lines.length < 3 || lines[1]!.trim().length !== 0) {
    throw new Error('Expected towel patterns line, blank separator line, and at least one design');
  }

  const patterns = parsePatternLine(lines[0]!);
  const designs = parseDesignLines(lines.slice(2));
  return new LinenLayout(patterns, designs);
}
