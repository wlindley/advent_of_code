import { Grammar, type GrammarRule, MonsterMessagesInput } from './grammar';

const RULE_LINE_PATTERN = /^(\d+):\s*(.+)$/;
const TERMINAL_PATTERN = /^"([a-z])"$/;
const TOKEN_ID_PATTERN = /^\d+$/;

function parseAlternative(rawAlt: string, ruleId: number): readonly number[] {
  const trimmed = rawAlt.trim();
  if (trimmed.length === 0) {
    throw new Error(`Empty alternative in rule ${ruleId}`);
  }
  const tokens = trimmed.split(/\s+/);
  const refs: number[] = [];
  for (const token of tokens) {
    if (!TOKEN_ID_PATTERN.test(token)) {
      throw new Error(`Invalid token '${token}' in rule ${ruleId}`);
    }
    refs.push(Number(token));
  }
  return refs;
}

function parseRuleLine(rawLine: string): GrammarRule {
  const line = rawLine.trim();
  const lineMatch = RULE_LINE_PATTERN.exec(line);
  if (!lineMatch) {
    throw new Error(`Invalid rule line: ${line}`);
  }
  const id = Number(lineMatch[1]!);
  const body = lineMatch[2]!.trim();
  const termMatch = TERMINAL_PATTERN.exec(body);
  if (termMatch) {
    return { kind: 'terminal', id, symbol: termMatch[1]! };
  }
  const rawAlts = body.split('|');
  const parsedAlts: (readonly number[])[] = [];
  for (const rawAlt of rawAlts) {
    parsedAlts.push(parseAlternative(rawAlt, id));
  }
  return { kind: 'sequence', id, alternatives: parsedAlts };
}

/** Parses raw puzzle text into a validated MonsterMessagesInput. */
export function parseMonsterMessages(raw: string): MonsterMessagesInput {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (normalized.length === 0) {
    throw new Error('Input is empty');
  }
  const sections = normalized.split(/\n[ \t]*\n/);
  if (sections.length !== 2) {
    throw new Error(`Expected 2 sections separated by a blank line, got ${sections.length}`);
  }
  const rules = sections[0]!.split('\n').map(parseRuleLine);
  const messages = sections[1]!.split('\n').map((line) => line.trim());
  return new MonsterMessagesInput(new Grammar(rules), messages);
}
