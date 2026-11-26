import { validateBracketText } from './line';

/**
 * Splits a raw navigation subsystem input into validated bracket lines.
 * Outer blank lines are stripped; interior blank lines and non-bracket characters throw.
 */
export function parseNavigationSubsystem(raw: string): readonly string[] {
  const rawLines = raw.split(/\r?\n/);
  let start = 0;
  while (start < rawLines.length && rawLines[start]!.trim() === '') start += 1;
  let end = rawLines.length;
  while (end > start && rawLines[end - 1]!.trim() === '') end -= 1;

  if (start >= end) {
    throw new RangeError('Navigation subsystem input must contain at least one line');
  }

  const lines: string[] = [];
  for (let i = start; i < end; i += 1) {
    const line = rawLines[i]!;
    if (line.trim() === '') {
      throw new RangeError(`Blank line inside navigation subsystem at line ${i + 1}`);
    }
    validateBracketText(line);
    lines.push(line);
  }
  return Object.freeze(lines);
}
