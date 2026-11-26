import type { PuzzlePart } from '../../shared/core';

export interface DayCalendarEntry {
  readonly day: number;
  readonly stars: 0 | 1 | 2;
}

export interface ParsedPuzzlePage {
  readonly title: string;
  readonly part1Html: string;
  readonly part2Html: string | null;
  readonly completedParts: readonly PuzzlePart[];
}

export type SubmitOutcome =
  | { readonly kind: 'correct' }
  | { readonly kind: 'already_completed' }
  | { readonly kind: 'wrong'; readonly hint: 'too_low' | 'too_high' | 'none'; readonly waitSeconds: number | null }
  | { readonly kind: 'rate_limited'; readonly waitSeconds: number }
  | { readonly kind: 'auth_error' }
  | { readonly kind: 'unknown'; readonly excerpt: string };

export function parseYearCalendar(html: string): readonly DayCalendarEntry[] {
  const byDay = new Map<number, 0 | 1 | 2>();
  for (const match of html.matchAll(/<a\b([^>]*href="\/\d{4}\/day\/(\d+)"[^>]*)>/gi)) {
    const attrs = match[1]!;
    const day = Number(match[2]!);
    if (byDay.has(day)) continue;
    const stars: 0 | 1 | 2 = attrs.includes('calendar-verycomplete') ? 2 : attrs.includes('calendar-complete') ? 1 : 0;
    byDay.set(day, stars);
  }
  return [...byDay.entries()].sort(([a], [b]) => a - b).map(([day, stars]) => ({ day, stars }));
}

export function parsePuzzlePage(html: string): ParsedPuzzlePage {
  const articles = [...html.matchAll(/<article\s+class="day-desc">([\s\S]*?)<\/article>/gi)].map(
    (m) => m[1]!.trim(),
  );
  if (articles.length === 0) {
    throw new Error('Puzzle page does not contain a day-desc article');
  }

  const titleMatch = articles[0]!.match(/<h2>---\s*Day\s+\d+:\s*(.+?)\s*---<\/h2>/i);
  const answerCount = [...html.matchAll(/Your puzzle answer was <code>/gi)].length;
  const completedParts: PuzzlePart[] = answerCount >= 2 ? [1, 2] : answerCount === 1 ? [1] : [];

  return {
    title: titleMatch ? titleMatch[1]!.trim() : '',
    part1Html: articles[0]!,
    part2Html: articles[1] ?? null,
    completedParts,
  };
}

function parseWaitSeconds(text: string): number | null {
  const minSec = text.match(/(\d+)m\s+(\d+)s/i);
  if (minSec) return Number(minSec[1]!) * 60 + Number(minSec[2]!);
  const secOnly = text.match(/\b(\d+)s\b/i);
  if (secOnly) return Number(secOnly[1]!);
  if (/one minute/i.test(text)) return 60;
  const mins = text.match(/(\d+)\s+minutes?/i);
  if (mins) return Number(mins[1]!) * 60;
  return null;
}

export function parseSubmitOutcome(html: string): SubmitOutcome {
  const articleMatch = html.match(/<article>([\s\S]*?)<\/article>/i);
  const plain = (articleMatch ? articleMatch[1]! : html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  if (/That's the right answer|You've finished every puzzle/i.test(plain)) return { kind: 'correct' };
  if (/Did you already complete it/i.test(plain)) return { kind: 'already_completed' };
  if (/Please log in|identify yourself/i.test(plain)) return { kind: 'auth_error' };
  if (/You gave an answer too recently/i.test(plain)) {
    return { kind: 'rate_limited', waitSeconds: parseWaitSeconds(plain) ?? 60 };
  }
  if (/That's not the right answer/i.test(plain)) {
    const hint = /too low/i.test(plain) ? 'too_low' : /too high/i.test(plain) ? 'too_high' : 'none';
    return { kind: 'wrong', hint, waitSeconds: parseWaitSeconds(plain) };
  }
  return { kind: 'unknown', excerpt: plain.slice(0, 200) };
}
