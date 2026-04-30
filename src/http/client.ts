import { Agent, request } from "undici";
import type { Config } from "../config.js";
import type { EndpointDef } from "../tools/registry.js";
import { RavenHttpError, RavenNetworkError, isTransient } from "./errors.js";
import { streamToFile, type StreamResult } from "./stream.js";
import { spillIfLarge, spillJsonIfLarge } from "../tools/result.js";
import { outputPath } from "../util/paths.js";
import { getLogger } from "../util/logger.js";
import { buildTlsOptions } from "../util/tls.js";
import {
  sampleClusterDashboard,
  sampleThreadsInfo,
  sampleTrafficWatch,
  sampleAdminLogs,
  type DashboardFrames,
} from "./wsClient.js";

export type ToolResult =
  | { type: "json"; data: unknown }
  | { type: "file"; result: StreamResult }
  | { type: "spill"; filePath: string; bytes: number; preview: string };


function buildQueryString(args: Record<string, unknown>, excludeKeys: string[]): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(args)) {
    if (excludeKeys.includes(k) || v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) params.append(k, String(item));
    } else {
      params.set(k, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function extFromContentType(ct: string): string {
  if (ct.includes("zip")) return "zip";
  if (ct.includes("octet-stream") || ct.includes("gzip")) return "bin";
  if (ct.includes("json")) return "json";
  return "dat";
}

export class RavenClient {
  private agent: Agent;
  private nodes: string[];
  private cursor = 0;
  private cfg: Config;

  constructor(cfg: Config) {
    const tls = buildTlsOptions(cfg.cert);
    this.agent = new Agent({
      connect: {
        rejectUnauthorized: false, // admin cert validates against the server's self-signed CA
        ...tls,
      },
    });
    this.nodes = cfg.nodeUrls;
    this.cfg = cfg;
  }

  private rotated(): string[] {
    const idx = this.cursor % this.nodes.length;
    this.cursor++;
    return [...this.nodes.slice(idx), ...this.nodes.slice(0, idx)];
  }

  async request(def: EndpointDef, args: Record<string, unknown>): Promise<ToolResult> {
    const log = getLogger();
    const path = def.path.replace(
      "{databaseName}",
      args.databaseName ? encodeURIComponent(String(args.databaseName)) : ""
    );
    const excludeFromQs = ["nodeUrl", "databaseName"];
    const qs = buildQueryString(args, excludeFromQs);
    const url = (base: string) => `${base}${path}${qs}`;

    const nodeOrder = args.nodeUrl
      ? [String(args.nodeUrl), ...this.nodes.filter((n) => n !== args.nodeUrl)]
      : this.rotated();

    const timeoutMs = def.timeoutMs ?? this.cfg.defaultTimeoutMs ?? 30_000;
    let lastErr: unknown;

    for (const base of nodeOrder) {
      const fullUrl = url(base);
      try {
        log.debug({ url: fullUrl, tool: def.name }, "requesting");
        const res = await request(fullUrl, {
          method: "GET",
          dispatcher: this.agent,
          headersTimeout: Math.min(timeoutMs, 30_000),
          bodyTimeout: timeoutMs,
        });

        if (res.statusCode >= 400) {
          const body = await res.body.text();
          throw new RavenHttpError(res.statusCode, body, fullUrl);
        }

        const ct = (res.headers["content-type"] as string | undefined) ?? "application/json";

        if (def.binary) {
          const fp = outputPath(def.name, extFromContentType(ct));
          const result = await streamToFile(res.body, fp, ct);
          log.info({ tool: def.name, bytes: result.bytes, filePath: fp }, "binary response saved");
          return { type: "file", result };
        }

        if (def.transform) {
          const raw = await res.body.text();
          const transformed = def.transform(JSON.parse(raw));
          return spillJsonIfLarge(transformed, def.name, this.cfg);
        }

        return await spillIfLarge(res.body, def.name, this.cfg);
      } catch (err) {
        if (err instanceof RavenHttpError && !isTransient(err)) throw err;
        lastErr = err instanceof RavenHttpError ? err : new RavenNetworkError(err, fullUrl);
        log.warn({ url: fullUrl, err: String(lastErr) }, "transient error, trying next node");
      }
    }

    throw lastErr;
  }

  async sampleDashboard(
    nodeUrl: string | undefined,
    types: string[],
    durationMs: number
  ): Promise<DashboardFrames> {
    const nodeOrder = nodeUrl
      ? [nodeUrl, ...this.nodes.filter((n) => n !== nodeUrl)]
      : this.rotated();
    const base = nodeOrder[0];

    // /cluster-dashboard/watch requires ?node=<tag> — resolve it first
    const infoRes = await request(`${base}/cluster/node-info`, {
      method: "GET",
      dispatcher: this.agent,
      headersTimeout: 5_000,
      bodyTimeout: 5_000,
    });
    const infoText = await infoRes.body.text();
    const { NodeTag } = JSON.parse(infoText) as { NodeTag: string };

    return sampleClusterDashboard(this.cfg, base, NodeTag, types, durationMs);
  }

  async sampleThreadsInfoWs(
    nodeUrl: string | undefined,
    durationMs: number
  ): Promise<unknown[]> {
    const nodeOrder = nodeUrl
      ? [nodeUrl, ...this.nodes.filter((n) => n !== nodeUrl)]
      : this.rotated();
    return sampleThreadsInfo(this.cfg, nodeOrder[0], durationMs);
  }

  async sampleTrafficWatchWs(
    nodeUrl: string | undefined,
    durationMs: number,
    resourceName?: string
  ): Promise<unknown[]> {
    const nodeOrder = nodeUrl
      ? [nodeUrl, ...this.nodes.filter((n) => n !== nodeUrl)]
      : this.rotated();
    return sampleTrafficWatch(this.cfg, nodeOrder[0], durationMs, resourceName);
  }

  async sampleAdminLogsWs(
    nodeUrl: string | undefined,
    durationMs: number
  ): Promise<unknown[]> {
    const nodeOrder = nodeUrl
      ? [nodeUrl, ...this.nodes.filter((n) => n !== nodeUrl)]
      : this.rotated();
    return sampleAdminLogs(this.cfg, nodeOrder[0], durationMs);
  }

  async destroy(): Promise<void> {
    await this.agent.destroy();
  }
}
