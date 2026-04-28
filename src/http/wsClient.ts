import fs from "node:fs";
import WebSocket from "ws";
import type { Config } from "../config.js";
import { RavenNetworkError } from "./errors.js";
import { getLogger } from "../util/logger.js";

export type DashboardFrames = Record<string, unknown[]>;

const MAX_DURATION_MS = 60_000;

function toWsUrl(httpUrl: string): string {
  return httpUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
}

function buildTlsOpts(cfg: Config): object {
  if (!cfg.cert) return {};
  if (cfg.cert.pfx) {
    return {
      pfx: fs.readFileSync(cfg.cert.pfx),
      passphrase: cfg.cert.password,
      ...(cfg.cert.ca ? { ca: fs.readFileSync(cfg.cert.ca) } : {}),
    };
  }
  return {
    cert: cfg.cert.pem ? fs.readFileSync(cfg.cert.pem) : undefined,
    key: cfg.cert.key ? fs.readFileSync(cfg.cert.key) : undefined,
    ...(cfg.cert.ca ? { ca: fs.readFileSync(cfg.cert.ca) } : {}),
  };
}

// Opens /cluster-dashboard/watch?node={nodeTag}, subscribes to each named type,
// collects frames for durationMs, then unwatches and closes. Returns frames
// bucketed by type name. nodeTag is required by the server.
export function sampleClusterDashboard(
  cfg: Config,
  baseUrl: string,
  nodeTag: string,
  types: string[],
  durationMs: number
): Promise<DashboardFrames> {
  const url = toWsUrl(baseUrl) + `/cluster-dashboard/watch?node=${encodeURIComponent(nodeTag)}`;
  const log = getLogger();
  const clampedMs = Math.min(durationMs, MAX_DURATION_MS);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { rejectUnauthorized: false, ...buildTlsOpts(cfg) });
    const frames: DashboardFrames = Object.fromEntries(types.map((t) => [t, []]));
    const idByType = new Map(types.map((t, i) => [t, i + 1]));
    let timer: ReturnType<typeof setTimeout> | undefined;

    ws.on("open", () => {
      log.debug({ url, types }, "cluster-dashboard WS open");
      for (const [type, id] of idByType) {
        ws.send(JSON.stringify({ Command: "watch", Id: id, Type: type }));
      }
      timer = setTimeout(() => {
        for (const [, id] of idByType) {
          try {
            ws.send(JSON.stringify({ Command: "unwatch", Id: id }));
          } catch {
            // ignore — socket may already be closing
          }
        }
        ws.close();
      }, clampedMs);
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(String(data)) as { Id: number; Data?: unknown };
        if (msg.Id === -1) return; // ServerTime welcome frame
        for (const [type, id] of idByType) {
          if (msg.Id === id && msg.Data !== undefined) {
            frames[type].push(msg.Data);
            break;
          }
        }
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("close", () => {
      clearTimeout(timer);
      log.debug({ url }, "cluster-dashboard WS closed");
      resolve(frames);
    });

    ws.on("error", (err) => {
      clearTimeout(timer);
      ws.terminate();
      reject(new RavenNetworkError(err, url));
    });
  });
}

// Opens /threads-info/watch — server pushes ThreadsInfo frames continuously with
// no watch/unwatch handshake. Collects frames for durationMs then closes.
export function sampleThreadsInfo(
  cfg: Config,
  baseUrl: string,
  durationMs: number
): Promise<unknown[]> {
  const url = toWsUrl(baseUrl) + "/threads-info/watch";
  const log = getLogger();
  const clampedMs = Math.min(durationMs, MAX_DURATION_MS);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { rejectUnauthorized: false, ...buildTlsOpts(cfg) });
    const frames: unknown[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    ws.on("open", () => {
      log.debug({ url }, "threads-info WS open");
      timer = setTimeout(() => ws.close(), clampedMs);
    });

    ws.on("message", (data) => {
      try {
        frames.push(JSON.parse(String(data)));
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("close", () => {
      clearTimeout(timer);
      resolve(frames);
    });

    ws.on("error", (err) => {
      clearTimeout(timer);
      ws.terminate();
      reject(new RavenNetworkError(err, url));
    });
  });
}

// Opens /admin/logs/watch — server pushes log entry frames immediately on
// connect. Each frame is a JSON object with Date, Level, ThreadID, Resource,
// Logger, Message fields. Empty frames are heartbeats and are skipped.
export function sampleAdminLogs(
  cfg: Config,
  baseUrl: string,
  durationMs: number
): Promise<unknown[]> {
  const url = toWsUrl(baseUrl) + "/admin/logs/watch";
  const log = getLogger();
  const clampedMs = Math.min(durationMs, MAX_DURATION_MS);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { rejectUnauthorized: false, ...buildTlsOpts(cfg) });
    const frames: unknown[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    ws.on("open", () => {
      log.debug({ url }, "admin-logs WS open");
      timer = setTimeout(() => ws.close(), clampedMs);
    });

    ws.on("message", (data) => {
      const str = String(data).trim();
      if (!str) return; // skip heartbeats
      try {
        frames.push(JSON.parse(str));
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("close", () => {
      clearTimeout(timer);
      resolve(frames);
    });

    ws.on("error", (err) => {
      clearTimeout(timer);
      ws.terminate();
      reject(new RavenNetworkError(err, url));
    });
  });
}

// Opens /admin/traffic-watch — server pushes TrafficWatchChangeBase frames
// (HTTP, TCP, Postgres) immediately on connect, with empty heartbeat frames
// when idle. Optional resourceName filters to a specific database.
export function sampleTrafficWatch(
  cfg: Config,
  baseUrl: string,
  durationMs: number,
  resourceName?: string
): Promise<unknown[]> {
  const qs = resourceName ? `?resourceName=${encodeURIComponent(resourceName)}` : "";
  const url = toWsUrl(baseUrl) + "/admin/traffic-watch" + qs;
  const log = getLogger();
  const clampedMs = Math.min(durationMs, MAX_DURATION_MS);

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { rejectUnauthorized: false, ...buildTlsOpts(cfg) });
    const frames: unknown[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    ws.on("open", () => {
      log.debug({ url }, "traffic-watch WS open");
      timer = setTimeout(() => ws.close(), clampedMs);
    });

    ws.on("message", (data) => {
      const str = String(data).trim();
      if (!str) return; // skip empty heartbeat frames
      try {
        frames.push(JSON.parse(str));
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("close", () => {
      clearTimeout(timer);
      resolve(frames);
    });

    ws.on("error", (err) => {
      clearTimeout(timer);
      ws.terminate();
      reject(new RavenNetworkError(err, url));
    });
  });
}
