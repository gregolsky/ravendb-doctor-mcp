import { z } from "zod";
import { ServerParams, PaginationParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "server_routes",
    path: "/debug/routes",
    category: "serverInfo",
    auth: "ValidUser",
    params: ServerParams,
    description: "All registered HTTP routes on the server, including debug and production endpoints.",
  },
  {
    name: "server_id",
    path: "/debug/server-id",
    category: "serverInfo",
    auth: "ValidUser",
    params: ServerParams,
    description: "The unique server ID (stable across restarts).",
  },
  {
    name: "server_cpu_credits",
    path: "/debug/cpu-credits",
    category: "serverInfo",
    auth: "ValidUser",
    params: ServerParams,
    description: "CPU credits status (relevant for RavenDB Cloud throttled instances).",
  },
  {
    name: "server_build_version",
    path: "/build/version",
    category: "serverInfo",
    auth: "ValidUser",
    params: ServerParams,
    description: "Server build version, product version, commit hash, and full version string.",
  },
  {
    name: "server_stats",
    path: "/admin/stats",
    category: "serverInfo",
    auth: "Operator",
    params: ServerParams,
    description: "Server-wide statistics: uptime, request counts, database count, CPU/memory summary.",
  },
  {
    name: "server_databases",
    path: "/databases",
    category: "serverInfo",
    auth: "ValidUser",
    params: ServerParams.merge(PaginationParams).extend({
      namesOnly: z.boolean().optional().describe("Return only database names instead of full info"),
    }),
    description: "List databases accessible to the current user with their status and node assignments.",
  },
  {
    name: "server_admin_database_record",
    path: "/admin/databases",
    category: "serverInfo",
    auth: "Operator",
    params: ServerParams.extend({
      name: z.string().describe("Database name to retrieve the full database record for"),
    }),
    description: "Retrieve the full database record (topology, settings, indexes, tasks) from the cluster state machine.",
  },
  {
    name: "server_db_is_loaded",
    path: "/debug/is-loaded",
    category: "serverInfo",
    auth: "ValidUser",
    params: ServerParams.extend({
      name: z.string().describe("Database name to check"),
    }),
    description: "Check whether a specific database is currently loaded and active on this node.",
  },
  {
    name: "admin_databases_idle",
    path: "/admin/debug/databases/idle",
    category: "serverInfo",
    auth: "Operator",
    params: ServerParams,
    description: "List databases that are currently idle (unloaded) on this node.",
  },
  {
    name: "server_license_connectivity",
    path: "/license-server/connectivity",
    category: "serverInfo",
    auth: "ValidUser",
    params: ServerParams,
    description: "Check connectivity to the RavenDB license server.",
  },
];
