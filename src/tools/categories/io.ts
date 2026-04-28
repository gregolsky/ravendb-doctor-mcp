import { ServerParams, DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "admin_io_metrics",
    path: "/admin/debug/io-metrics",
    category: "io",
    auth: "Operator",
    params: ServerParams,
    description: "I/O metrics for all storage environments across the server: throughput, latency histograms.",
  },
  {
    name: "db_debug_io_metrics",
    path: "/databases/{databaseName}/debug/io-metrics",
    category: "io",
    auth: "ValidUser",
    params: DbParams,
    description: "I/O metrics for a specific database's storage environments.",
  },
  {
    name: "db_debug_perf_metrics",
    path: "/databases/{databaseName}/debug/perf-metrics",
    category: "io",
    auth: "ValidUser",
    params: DbParams,
    description: "Performance metrics for a specific database: operation rates, latencies.",
  },
];
