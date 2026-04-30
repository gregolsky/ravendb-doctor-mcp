import { z } from "zod";
import { ServerParams, DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

const InfoPackageParams = ServerParams.extend({
  type: z.string().optional().describe("Package type: ServerWide, Databases, LogFile, or Default"),
  database: z.array(z.string()).optional().describe("Specific database names to include"),
  operationId: z.number().int().optional().describe("Track via this operation ID"),
  timeoutInSecPerNode: z.number().int().optional().describe("Timeout per node in seconds (default 3600)"),
});

export const endpoints: EndpointDef[] = [
  {
    name: "admin_info_package",
    path: "/admin/debug/info-package",
    category: "infoPackages",
    auth: "Operator",
    binary: true,
    dangerous: true,
    dangerReason: "Collects a server-wide diagnostic snapshot; puts significant load on the server during collection.",
    params: InfoPackageParams,
    timeoutMs: 15 * 60_000,
    description: "Download a server-wide debug info ZIP archive. Contains memory, threads, cluster, and database diagnostics.",
  },
  {
    name: "admin_cluster_info_package",
    path: "/admin/debug/cluster-info-package",
    category: "infoPackages",
    auth: "Operator",
    binary: true,
    dangerous: true,
    dangerReason: "Collects diagnostic snapshots from every node in the cluster sequentially; the most expensive operation available.",
    params: InfoPackageParams,
    timeoutMs: 15 * 60_000,
    description: "Download a cluster-wide debug info ZIP archive, collecting data from all nodes.",
  },
  {
    name: "db_debug_info_package",
    path: "/databases/{databaseName}/debug/info-package",
    category: "infoPackages",
    auth: "ValidUser",
    binary: true,
    dangerous: true,
    dangerReason: "Collects a per-database diagnostic snapshot; causes elevated I/O and memory pressure during collection.",
    params: DbParams,
    timeoutMs: 15 * 60_000,
    description: "Download a database-specific debug info ZIP archive.",
  },
];
