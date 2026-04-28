import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RavenClient } from "../../http/client.js";
import { ServerParams } from "../registry.js";
import { spillJsonIfLarge, type JsonResult, type SpillResult } from "../result.js";
import { getConfig } from "../../config.js";
import { getLogger } from "../../util/logger.js";

const DASHBOARD_TYPES = [
  "CpuUsage",
  "MemoryUsage",
  "IoStats",
  "StorageUsage",
  "DatabaseStorageUsage",
  "Traffic",
  "DatabaseTraffic",
  "Indexing",
  "DatabaseIndexing",
  "ClusterOverview",
  "DatabaseOverview",
  "OngoingTasks",
  "GcInfo",
  "DatabasesNotifications",
] as const;

const DEFAULT_DASHBOARD_TYPES: string[] = [
  "CpuUsage",
  "MemoryUsage",
  "IoStats",
  "StorageUsage",
  "Traffic",
  "GcInfo",
];

const ClusterDashboardParams = ServerParams.extend({
  types: z
    .array(z.string())
    .optional()
    .describe(
      `Widget types to subscribe to. Defaults to [${DEFAULT_DASHBOARD_TYPES.join(", ")}]. ` +
        `All available: ${DASHBOARD_TYPES.join(", ")}`
    ),
  durationMs: z
    .number()
    .int()
    .min(1000)
    .max(60_000)
    .optional()
    .describe("Sampling window in milliseconds (default 5000, max 60000)"),
});

const ThreadsInfoParams = ServerParams.extend({
  durationMs: z
    .number()
    .int()
    .min(1000)
    .max(60_000)
    .optional()
    .describe("Sampling window in milliseconds (default 3000, max 60000)"),
});

const AdminLogsParams = ServerParams.extend({
  durationMs: z
    .number()
    .int()
    .min(1000)
    .max(60_000)
    .optional()
    .describe("Sampling window in milliseconds (default 10000, max 60000)"),
});

const TrafficWatchParams = ServerParams.extend({
  durationMs: z
    .number()
    .int()
    .min(1000)
    .max(60_000)
    .optional()
    .describe("Sampling window in milliseconds (default 10000, max 60000)"),
  resourceName: z
    .string()
    .optional()
    .describe("Filter to a specific database name (omit for all traffic)"),
});

function formatResult(result: JsonResult | SpillResult): string {
  if (result.type === "spill") {
    return JSON.stringify({
      filePath: result.filePath,
      bytes: result.bytes,
      note: "Response exceeded size threshold; full content saved to filePath",
      preview: result.preview,
    });
  }
  return JSON.stringify(result.data, null, 2);
}

export function registerDashboard(server: McpServer, client: RavenClient): void {
  const log = getLogger();

  server.tool(
    "cluster_dashboard_sample",
    "Sample the live cluster-dashboard WebSocket stream for a bounded window. " +
      "Mirrors the data shown in RavenDB Studio's Cluster Dashboard (Resource Utilization): " +
      "CPU %, memory, per-mount I/O throughput, storage usage, request/document traffic, GC info, indexing speed, and more. " +
      "Returns one object per received frame, bucketed by widget type.",
    ClusterDashboardParams.shape,
    async (args) => {
      const parsed = ClusterDashboardParams.parse(args);
      const types = parsed.types ?? DEFAULT_DASHBOARD_TYPES;
      const durationMs = parsed.durationMs ?? 5_000;
      log.info({ tool: "cluster_dashboard_sample", types, durationMs }, "tool called");
      try {
        const frames = await client.sampleDashboard(parsed.nodeUrl, types, durationMs);
        const result = spillJsonIfLarge(frames, "cluster_dashboard_sample", getConfig());
        return { content: [{ type: "text" as const, text: formatResult(result) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error({ tool: "cluster_dashboard_sample", err: msg }, "tool error");
        return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "threads_info_sample",
    "Sample the live threads-info WebSocket stream for a bounded window. " +
      "Mirrors the data shown in RavenDB Studio's Threads Runtime view: per-thread CPU %, " +
      "allocation rates, I/O stats (Linux), thread state, priority, and wait reason. " +
      "Each frame is a ThreadsInfo snapshot containing a sorted list of threads by CPU usage.",
    ThreadsInfoParams.shape,
    async (args) => {
      const parsed = ThreadsInfoParams.parse(args);
      const durationMs = parsed.durationMs ?? 3_000;
      log.info({ tool: "threads_info_sample", durationMs }, "tool called");
      try {
        const frames = await client.sampleThreadsInfoWs(parsed.nodeUrl, durationMs);
        const result = spillJsonIfLarge(frames, "threads_info_sample", getConfig());
        return { content: [{ type: "text" as const, text: formatResult(result) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error({ tool: "threads_info_sample", err: msg }, "tool error");
        return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "admin_logs_sample",
    "Sample the live admin logs WebSocket stream (/admin/logs/watch) for a bounded window. " +
      "Mirrors RavenDB Studio's Admin Logs view. Each entry contains Date, Level (DEBUG/INFO/WARN/ERROR/FATAL), " +
      "ThreadID, Resource, Logger, Message, and optional Component/Data fields. " +
      "To change the minimum log level before sampling, use the /admin/logs/configuration endpoint separately.",
    AdminLogsParams.shape,
    async (args) => {
      const parsed = AdminLogsParams.parse(args);
      const durationMs = parsed.durationMs ?? 10_000;
      log.info({ tool: "admin_logs_sample", durationMs }, "tool called");
      try {
        const frames = await client.sampleAdminLogsWs(parsed.nodeUrl, durationMs);
        const result = spillJsonIfLarge(frames, "admin_logs_sample", getConfig());
        return { content: [{ type: "text" as const, text: formatResult(result) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error({ tool: "admin_logs_sample", err: msg }, "tool error");
        return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "traffic_watch_sample",
    "Sample the live traffic-watch WebSocket stream (/admin/traffic-watch) for a bounded window. " +
      "Mirrors RavenDB Studio's Traffic Watch view: captures HTTP, TCP, and Postgres requests " +
      "including method, URI, status code, duration, request/response sizes, database name, and client IP. " +
      "Optionally filter to a single database with resourceName.",
    TrafficWatchParams.shape,
    async (args) => {
      const parsed = TrafficWatchParams.parse(args);
      const durationMs = parsed.durationMs ?? 10_000;
      log.info({ tool: "traffic_watch_sample", durationMs, resourceName: parsed.resourceName }, "tool called");
      try {
        const frames = await client.sampleTrafficWatchWs(parsed.nodeUrl, durationMs, parsed.resourceName);
        const result = spillJsonIfLarge(frames, "traffic_watch_sample", getConfig());
        return { content: [{ type: "text" as const, text: formatResult(result) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error({ tool: "traffic_watch_sample", err: msg }, "tool error");
        return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
      }
    }
  );
}
