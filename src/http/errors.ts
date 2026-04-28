export class RavenHttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: string,
    public readonly url: string
  ) {
    super(`HTTP ${statusCode} from ${url}: ${body.slice(0, 200)}`);
    this.name = "RavenHttpError";
  }
}

export class RavenNetworkError extends Error {
  constructor(
    cause: unknown,
    public readonly url: string
  ) {
    super(`Network error reaching ${url}: ${String(cause)}`);
    this.name = "RavenNetworkError";
    this.cause = cause;
  }
}

export function isTransient(err: unknown): boolean {
  if (err instanceof RavenHttpError) {
    return err.statusCode >= 502 && err.statusCode <= 504;
  }
  return err instanceof RavenNetworkError;
}
