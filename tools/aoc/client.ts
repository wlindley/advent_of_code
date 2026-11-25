import { formatDayFolder, type PuzzlePart } from '../../shared/core';
import {
  parsePuzzlePage,
  parseSubmitOutcome,
  parseYearCalendar,
  type DayCalendarEntry,
  type ParsedPuzzlePage,
  type SubmitOutcome,
} from './htmlParser';
import type { AsyncClock, FileStore, HttpTransport } from './ports';

export interface AocClientConfig {
  readonly sessionPath: string;
  readonly cacheDir: string;
  readonly userAgent?: string;
}

const DEFAULT_USER_AGENT = 'github.com/wlindley/advent_of_code (autonomous solver)';

export class AocClient {
  private readonly userAgent: string;

  constructor(
    private readonly config: AocClientConfig,
    private readonly http: HttpTransport,
    private readonly files: FileStore,
    private readonly clock: AsyncClock,
  ) {
    this.userAgent = config.userAgent ?? DEFAULT_USER_AGENT;
  }

  async discoverYear(year: number, refresh = false): Promise<readonly DayCalendarEntry[]> {
    const html = await this.getCached(`${this.config.cacheDir}/${year}/calendar.html`, `https://adventofcode.com/${year}`, refresh);
    return parseYearCalendar(html);
  }

  async fetchPuzzle(year: number, day: number, refresh = false): Promise<ParsedPuzzlePage> {
    const html = await this.getCached(
      `${this.config.cacheDir}/${year}/${formatDayFolder(day)}/puzzle.html`,
      `https://adventofcode.com/${year}/day/${day}`,
      refresh,
    );
    return parsePuzzlePage(html);
  }

  async fetchInput(year: number, day: number): Promise<string> {
    return this.getCached(
      `${this.config.cacheDir}/${year}/${formatDayFolder(day)}/input.txt`,
      `https://adventofcode.com/${year}/day/${day}/input`,
      false,
    );
  }

  async submitAnswer(year: number, day: number, part: PuzzlePart, answer: string): Promise<SubmitOutcome> {
    await this.waitForCooldown();
    const session = await this.loadSession();
    const response = await this.http.request({
      method: 'POST',
      url: `https://adventofcode.com/${year}/day/${day}/answer`,
      headers: {
        Cookie: `session=${session}`,
        'User-Agent': this.userAgent,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ level: String(part), answer }).toString(),
    });
    if (response.status !== 200) throw new Error(`HTTP ${response.status} submitting answer`);
    const outcome = parseSubmitOutcome(response.body);
    const waitSeconds = outcome.kind === 'rate_limited' ? outcome.waitSeconds : outcome.kind === 'wrong' ? outcome.waitSeconds : null;
    if (waitSeconds) {
      await this.files.writeText(
        `${this.config.cacheDir}/rate-limit.json`,
        JSON.stringify({ nextAllowedSubmitMs: this.clock.nowMs() + waitSeconds * 1000 }),
      );
    }
    return outcome;
  }

  private async loadSession(): Promise<string> {
    const cookie = (await this.files.readText(this.config.sessionPath))?.trim() ?? '';
    if (!cookie) throw new Error(`Missing AoC session cookie at ${this.config.sessionPath}`);
    return cookie;
  }

  private async getCached(cachePath: string, url: string, refresh: boolean): Promise<string> {
    if (!refresh) {
      const cached = await this.files.readText(cachePath);
      if (cached !== null) return cached;
    }
    const response = await this.http.request({
      method: 'GET',
      url,
      headers: { Cookie: `session=${await this.loadSession()}`, 'User-Agent': this.userAgent },
    });
    if (response.status !== 200) throw new Error(`HTTP ${response.status} fetching ${url}`);
    await this.files.writeText(cachePath, response.body);
    return response.body;
  }

  private async waitForCooldown(): Promise<void> {
    const raw = await this.files.readText(`${this.config.cacheDir}/rate-limit.json`);
    if (!raw) return;
    const { nextAllowedSubmitMs } = JSON.parse(raw) as { nextAllowedSubmitMs: number };
    const remainingMs = nextAllowedSubmitMs - this.clock.nowMs();
    if (remainingMs > 0) await this.clock.sleep(remainingMs);
  }
}
