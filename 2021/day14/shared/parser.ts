import { InsertionRule, PolymerFormula } from './polymer';

const RULE_LINE_RE = /^[A-Z]{2} -> [A-Z]$/;

function parseRuleLine(rawLine: string, index: number): InsertionRule {
  const line = rawLine.trim();
  if (!RULE_LINE_RE.test(line)) {
    throw new Error(`Invalid insertion rule at line ${index + 1}: "${line}"`);
  }
  return new InsertionRule(line.slice(0, 2), line.slice(6, 7));
}

/** Parses polymer template and pair-insertion rule text into a `PolymerFormula`. */
export function parsePolymerFormula(raw: string): PolymerFormula {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) {
    throw new Error('Polymer input must not be empty');
  }
  const sections = normalized.split(/\n\s*\n/);
  if (sections.length !== 2) {
    throw new Error(`Expected template and rule sections separated by a blank line, got ${sections.length}`);
  }
  const [templateSection, rulesSection] = sections as [string, string];
  const rules = rulesSection.split('\n').map(parseRuleLine);
  return new PolymerFormula(templateSection.trim(), rules);
}
