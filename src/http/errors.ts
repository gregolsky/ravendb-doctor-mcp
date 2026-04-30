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

// 500 Internal Server Error is intentionally excluded — RavenDB returns 500 for
// application-level failures (bad requests, missing databases) that will not
// resolve on a different node. Only gateway-level errors (502/503/504) and
// network failures warrant a retry against the next node in the cluster.
export function isTransient(err: unknown): boolean {
  if (err instanceof RavenHttpError) {
    return err.statusCode >= 502 && err.statusCode <= 504;
  }
  return err instanceof RavenNetworkError;
}
