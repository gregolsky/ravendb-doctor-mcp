import { ServerParams, DbParams } from "../registry.js";
import type { EndpointDef } from "../registry.js";

export const endpoints: EndpointDef[] = [
  {
    name: "admin_txinfo",
    path: "/admin/debug/txinfo",
    category: "transactions",
    auth: "Operator",
    params: ServerParams,
    description: "Server-wide active transaction information across all storage environments.",
  },
  {
    name: "db_admin_txinfo",
    path: "/databases/{databaseName}/admin/debug/txinfo",
    category: "transactions",
    auth: "DatabaseAdmin",
    params: DbParams,
    description: "Active transactions for a specific database's storage environment.",
  },
  {
    name: "db_admin_cluster_txinfo",
    path: "/databases/{databaseName}/admin/debug/cluster/txinfo",
    category: "transactions",
    auth: "DatabaseAdmin",
    params: DbParams,
    description: "Cluster-level transaction info for a specific database (Raft transactions).",
  },
];
