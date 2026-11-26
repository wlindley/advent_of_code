import { describe, expect, it } from 'vitest';
import { parsePuzzlePage, parseSubmitOutcome, parseYearCalendar } from './htmlParser';

describe('parseYearCalendar', () => {
  it('extracts sorted unique days and star counts from a calendar page', () => {
    const html = [
      '<a href="/2025/day/12" class="calendar-day12">12</a>',
      '<a href="/2025/day/1" class="calendar-day1 calendar-verycomplete">1</a>',
      '<a href="/2025/day/2" class="calendar-day2 calendar-complete">2</a>',
      '<a href="/2025/day/1" class="calendar-day1 calendar-verycomplete">1</a>',
    ].join('\n');
    expect(parseYearCalendar(html)).toEqual([
      { day: 1, stars: 2 },
      { day: 2, stars: 1 },
      { day: 12, stars: 0 },
    ]);
  });

  it('returns an empty list when no day links exist', () => {
    expect(parseYearCalendar('<main>No days yet</main>')).toEqual([]);
  });
});

describe('parsePuzzlePage', () => {
  it('extracts title, part 1 html, and empty completions for an unsolved puzzle', () => {
    const html = '<article class="day-desc"><h2>--- Day 1: Secret Entrance ---</h2><p>P1</p></article>';
    const parsed = parsePuzzlePage(html);
    expect(parsed.title).toBe('Secret Entrance');
    expect(parsed.part1Html).toContain('<p>P1</p>');
    expect(parsed.part2Html).toBeNull();
    expect(parsed.completedParts).toEqual([]);
  });

  it('extracts part 2 html and completed parts when both parts are solved', () => {
    const html = [
      '<article class="day-desc"><h2>--- Day 1: Secret Entrance ---</h2><p>P1</p></article>',
      '<p>Your puzzle answer was <code>123</code>.</p>',
      '<article class="day-desc"><h2 id="part2">--- Part Two ---</h2><p>P2</p></article>',
      '<p>Your puzzle answer was <code>456</code>.</p>',
    ].join('');
    const parsed = parsePuzzlePage(html);
    expect(parsed.part2Html).toContain('<p>P2</p>');
    expect(parsed.completedParts).toEqual([1, 2]);
  });

  it('reports only part 1 completed when part 2 is still unsolved', () => {
    const html = [
      '<article class="day-desc"><h2>--- Day 1: Secret Entrance ---</h2><p>P1</p></article>',
      '<p>Your puzzle answer was <code>123</code>.</p>',
      '<article class="day-desc"><h2 id="part2">--- Part Two ---</h2><p>P2</p></article>',
    ].join('');
    expect(parsePuzzlePage(html).completedParts).toEqual([1]);
  });

  it('falls back to empty title when heading format is missing', () => {
    expect(parsePuzzlePage('<article class="day-desc"><p>No heading</p></article>').title).toBe('');
  });

  it('throws when no day-desc article is present', () => {
    expect(() => parsePuzzlePage('<main>Not found</main>')).toThrow(
      'Puzzle page does not contain a day-desc article',
    );
  });
});

describe('parseSubmitOutcome', () => {
  it('recognizes correct, finale completion, and already-completed answers', () => {
    expect(parseSubmitOutcome(`<article><p>That's the right answer! Gold star.</p></article>`)).toEqual({
      kind: 'correct',
    });
    expect(
      parseSubmitOutcome(
        `<article><p>Congratulations! You've finished every puzzle in Advent of Code 2022!</p></article>`,
      ),
    ).toEqual({ kind: 'correct' });
    expect(
      parseSubmitOutcome(`<article><p>You've finished every puzzle in Advent of Code!</p></article>`),
    ).toEqual({ kind: 'correct' });
    expect(parseSubmitOutcome(`<article><p>Did you already complete it?</p></article>`)).toEqual({
      kind: 'already_completed',
    });
  });

  it('recognizes wrong answers with too_low, too_high, generic hints, and wait times', () => {
    expect(
      parseSubmitOutcome(`<article><p>That's not the right answer; your answer is too low. Please wait one minute.</p></article>`),
    ).toEqual({ kind: 'wrong', hint: 'too_low', waitSeconds: 60 });
    expect(
      parseSubmitOutcome(`<article><p>That's not the right answer; your answer is too high. Please wait 5 minutes.</p></article>`),
    ).toEqual({ kind: 'wrong', hint: 'too_high', waitSeconds: 300 });
    expect(parseSubmitOutcome(`<article><p>That's not the right answer.</p></article>`)).toEqual({
      kind: 'wrong',
      hint: 'none',
      waitSeconds: null,
    });
  });

  it('recognizes rate-limited responses across duration formats', () => {
    expect(
      parseSubmitOutcome(`<article><p>You gave an answer too recently; you have 2m 15s left to wait.</p></article>`),
    ).toEqual({ kind: 'rate_limited', waitSeconds: 135 });
    expect(
      parseSubmitOutcome(`<article><p>You gave an answer too recently; you have 42s left to wait.</p></article>`),
    ).toEqual({ kind: 'rate_limited', waitSeconds: 42 });
    expect(parseSubmitOutcome(`<article><p>You gave an answer too recently.</p></article>`)).toEqual({
      kind: 'rate_limited',
      waitSeconds: 60,
    });
  });

  it('recognizes authentication errors and unknown responses', () => {
    expect(parseSubmitOutcome('<main>To play, please identify yourself.</main>')).toEqual({
      kind: 'auth_error',
    });
    expect(parseSubmitOutcome('<article><p>Unexpected server notice</p></article>')).toEqual({
      kind: 'unknown',
      excerpt: 'Unexpected server notice',
    });
  });
});
