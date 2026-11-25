import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AsyncClock, FileStore, HttpRequest, HttpResponse, HttpTransport } from './ports';

export const nodeHttpTransport: HttpTransport = {
  async request(req: HttpRequest): Promise<HttpResponse> {
    const response = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    return { status: response.status, body: await response.text() };
  },
};

export const nodeFileStore: FileStore = {
  async readText(path: string): Promise<string | null> {
    try {
      return await readFile(path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  },
  async writeText(path: string, content: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
  },
};

export const nodeClock: AsyncClock = {
  nowMs: () => Date.now(),
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};
