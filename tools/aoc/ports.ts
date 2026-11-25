export interface HttpRequest {
  readonly method: 'GET' | 'POST';
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body?: string;
}

export interface HttpResponse {
  readonly status: number;
  readonly body: string;
}

export interface HttpTransport {
  request(req: HttpRequest): Promise<HttpResponse>;
}

export interface FileStore {
  readText(path: string): Promise<string | null>;
  writeText(path: string, content: string): Promise<void>;
}

export interface AsyncClock {
  nowMs(): number;
  sleep(ms: number): Promise<void>;
}
