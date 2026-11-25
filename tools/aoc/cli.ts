import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { executeSolver, formatDayFolder, type PuzzlePart, type PuzzleSolver } from '../../shared/core';
import { AocClient } from './client';
import { nodeClock, nodeFileStore, nodeHttpTransport } from './nodeAdapters';

function parseIntArg(value: string | undefined, label: string): number {
  const parsed = Number(value);
  if (!value || !Number.isInteger(parsed)) throw new Error(`Invalid ${label}: ${value ?? '(missing)'}`);
  return parsed;
}

function parsePartArg(value: string | undefined): PuzzlePart {
  const part = parseIntArg(value, 'part');
  if (part !== 1 && part !== 2) throw new Error(`Part must be 1 or 2, got ${part}`);
  return part;
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const refresh = rest.includes('--refresh');
  const args = rest.filter((arg) => arg !== '--refresh');
  const client = new AocClient(
    { sessionPath: resolve('.aoc-session'), cacheDir: resolve('.aoc-cache') },
    nodeHttpTransport,
    nodeFileStore,
    nodeClock,
  );

  if (command === 'discover') {
    const year = parseIntArg(args[0], 'year');
    const calendar = await client.discoverYear(year, refresh);
    console.log(JSON.stringify({ year, totalDays: calendar.length, days: calendar }, null, 2));
    return;
  }

  if (command === 'fetch') {
    const year = parseIntArg(args[0], 'year');
    const day = parseIntArg(args[1], 'day');
    const puzzle = await client.fetchPuzzle(year, day, refresh);
    const input = await client.fetchInput(year, day);
    console.log(
      JSON.stringify(
        {
          year,
          day,
          title: puzzle.title,
          hasPart2: puzzle.part2Html !== null,
          completedParts: puzzle.completedParts,
          inputBytes: Buffer.byteLength(input, 'utf8'),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'run') {
    const year = parseIntArg(args[0], 'year');
    const day = parseIntArg(args[1], 'day');
    const part = parsePartArg(args[2]);
    const inputFlagIndex = args.indexOf('--input');
    const rawInput =
      inputFlagIndex >= 0
        ? await readFile(resolve(args[inputFlagIndex + 1] ?? ''), 'utf8')
        : await client.fetchInput(year, day);

    const solverPath = resolve(`${year}/${formatDayFolder(day)}/part${part}/domain/solver.ts`);
    const mod = (await import(pathToFileURL(solverPath).href)) as {
      solver?: PuzzleSolver<unknown, unknown>;
    };
    if (!mod.solver) throw new Error(`Expected named export 'solver' in ${solverPath}`);
    const result = executeSolver(mod.solver, rawInput);
    console.log(JSON.stringify({ ...result, answer: String(result.answer) }, null, 2));
    return;
  }

  if (command === 'submit') {
    const year = parseIntArg(args[0], 'year');
    const day = parseIntArg(args[1], 'day');
    const part = parsePartArg(args[2]);
    const answer = args[3];
    if (!answer) throw new Error('Missing answer argument');
    const outcome = await client.submitAnswer(year, day, part, answer);
    console.log(JSON.stringify(outcome, null, 2));
    return;
  }

  throw new Error('Usage: npm run aoc -- <discover|fetch|run|submit> ...');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
