import { describe, expect, it } from 'vitest';
import { AocClient } from './client';
import type { AsyncClock, FileStore, HttpRequest, HttpResponse, HttpTransport } from './ports';

class InMemoryFileStore implements FileStore {
  readonly files = new Map<string, string>();
  async readText(path: string): Promise<string | null> { return this.files.get(path) ?? null; }
  async writeText(path: string, content: string): Promise<void> { this.files.set(path, content); }
}

class FakeClock implements AsyncClock {
  now = 1000;
  readonly sleeps: number[] = [];
  nowMs(): number { return this.now; }
  async sleep(ms: number): Promise<void> { this.sleeps.push(ms); this.now += ms; }
}

class FakeHttpTransport implements HttpTransport {
  readonly requests: HttpRequest[] = [];
  private readonly responses = new Map<string, HttpResponse>();
  stub(url: string, response: HttpResponse): void { this.responses.set(url, response); }
  async request(req: HttpRequest): Promise<HttpResponse> {
    this.requests.push(req);
    return this.responses.get(req.url) ?? { status: 404, body: 'Not found' };
  }
}

function createHarness() {
  const files = new InMemoryFileStore();
  files.files.set('.aoc-session', 'secret-cookie\n');
  const http = new FakeHttpTransport();
  const clock = new FakeClock();
  const client = new AocClient({ sessionPath: '.aoc-session', cacheDir: '.aoc-cache' }, http, files, clock);
  return { client, files, http, clock };
}

describe('AocClient', () => {
  it('fetches, caches, and refreshes year calendars and puzzles', async () => {
    const { client, http } = createHarness();
    http.stub('https://adventofcode.com/2025', { status: 200, body: '<a href="/2025/day/1" class="calendar-day1">1</a>' });
    http.stub('https://adventofcode.com/2025/day/1', {
      status: 200,
      body: '<article class="day-desc"><h2>--- Day 1: Test ---</h2><p>P1</p></article>',
    });
    expect(await client.discoverYear(2025)).toEqual([{ day: 1, stars: 0 }]);
    expect(await client.discoverYear(2025)).toEqual([{ day: 1, stars: 0 }]);
    expect((await client.fetchPuzzle(2025, 1)).title).toBe('Test');
    expect((await client.fetchPuzzle(2025, 1, true)).title).toBe('Test');
    expect(http.requests).toHaveLength(3);
  });

  it('caches personal puzzle inputs without refetching', async () => {
    const { client, http } = createHarness();
    http.stub('https://adventofcode.com/2025/day/1/input', { status: 200, body: '10\n20\n' });
    expect(await client.fetchInput(2025, 1)).toBe('10\n20\n');
    expect(await client.fetchInput(2025, 1)).toBe('10\n20\n');
    expect(http.requests).toHaveLength(1);
  });

  it('throws on missing session cookie and non-200 GET or POST responses', async () => {
    const { client, files, http } = createHarness();
    files.files.delete('.aoc-session');
    await expect(client.fetchInput(2025, 1)).rejects.toThrow('Missing AoC session cookie');
    files.files.set('.aoc-session', 'valid');
    http.stub('https://adventofcode.com/2025/day/1/input', { status: 400, body: 'Bad' });
    await expect(client.fetchInput(2025, 1)).rejects.toThrow('HTTP 400');
    http.stub('https://adventofcode.com/2025/day/1/answer', { status: 500, body: 'Err' });
    await expect(client.submitAnswer(2025, 1, 1, '1')).rejects.toThrow('HTTP 500');
  });

  it('enforces persisted cooldowns for wrong and rate-limited submissions', async () => {
    const { client, http, clock } = createHarness();
    const url = 'https://adventofcode.com/2025/day/1/answer';
    http.stub(url, { status: 200, body: `<article><p>That's not the right answer; too low. Please wait one minute.</p></article>` });
    expect(await client.submitAnswer(2025, 1, 1, '42')).toEqual({ kind: 'wrong', hint: 'too_low', waitSeconds: 60 });

    http.stub(url, { status: 200, body: `<article><p>You gave an answer too recently; you have 10s left to wait.</p></article>` });
    expect(await client.submitAnswer(2025, 1, 1, '50')).toEqual({ kind: 'rate_limited', waitSeconds: 10 });

    clock.now += 20_000;
    http.stub(url, { status: 200, body: `<article><p>That's the right answer!</p></article>` });
    expect(await client.submitAnswer(2025, 1, 1, '99')).toEqual({ kind: 'correct' });
    expect(clock.sleeps).toEqual([60_000]);
  });
});
