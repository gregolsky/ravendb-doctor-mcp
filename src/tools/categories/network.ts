import { z } from "zod";
import { ServerParams, DbParams, PaginationParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "admin_tcp_stats",
    path: "/admin/debug/info/tcp/stats",
    category: "network",
    auth: "Operator",
    params: ServerParams,
    description: "TCP/IPv4/IPv6 connection statistics for the server process.",
  },
  {
    name: "admin_tcp_active_connections",
    path: "/admin/debug/info/tcp/active-connections",
    category: "network",
    auth: "Operator",
    params: ServerParams,
    description: "Active TCP connections grouped by state (ESTABLISHED, TIME_WAIT, etc.).",
  },
  {
    name: "db_tcp_connections",
    path: "/databases/{databaseName}/tcp",
    category: "network",
    auth: "ValidUser",
    params: DbParams.merge(PaginationParams).extend({
      minSecDuration: z.number().int().optional().describe("Filter: min connection duration in seconds"),
      maxSecDuration: z.number().int().optional().describe("Filter: max connection duration in seconds"),
      ip: z.string().optional().describe("Filter by remote IP address"),
      operation: z.string().optional().describe("Filter by TCP operation type"),
    }),
    description: "Active TCP connections for a specific database, with filtering by duration, IP, and operation.",
  },
];
